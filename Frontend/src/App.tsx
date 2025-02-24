import { useEffect, useRef, useState } from "react";
import LineItem from "./components/LineItem";
import Recorder from "js-audio-recorder";
import Avatar from "react-avatar";
import EVENT_BUS from "./event";
import { events } from "fetch-event-stream";
import { config } from "./config";
import { BsFillMicFill, BsFillMicMuteFill } from "react-icons/bs";
import { RiSendPlaneFill } from "react-icons/ri";
import './App.css';

const apiUrl = "http://localhost:4242";

const App = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(0);
  const [communicating, setCommunicating] = useState(false);
  const [isVertical, setIsVertical] = useState(
    window.innerHeight > window.innerWidth
  );

  const lineBottomRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef(new Recorder());

  // Update isVertical state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    if (lineBottomRef.current) {
      lineBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onBtnRecordClick = () => {
    if (recording) {
      console.log(recording);
      stopRecording();
    } else {
      startRecording();
    }
  };

  const onBtnSendClick = async () => {
    if (communicating) {
      console.log("communicating");
      return;
    }

    try {
      const val = message.trim();
      if (!val) {
        console.log("Message cannot be empty!");
        return;
      }

      setMessage("");

      const formData = new FormData();
      formData.append("aia", config.id);
      formData.append("message", val);
      setCommunicating(true);

      const userMessage = { from: "user", text: val };
      setHistory((prev) => [...prev, userMessage]);

      const response = {
        from: "assistant",
        text: "Generating response...",
        state: "pending",
      };
      setHistory((prev) => [...prev, response]);
      scrollToBottom();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let res = await fetch(`${apiUrl}/completions/stream`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        console.log("Received text from backend:", data.text);
        response.text = data.text;
        response.state = "completed";
      } else {
        console.log("HTTP-Error: " + res.status);
        response.text = "Error: Failed to generate a response.";
        response.state = "error";
      }

      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = response;
        return updated;
      });

      scrollToBottom();
      setCommunicating(false);
    } catch (e) {
      console.error(`Error: ${e}`);
      const errorResponse = {
        from: "assistant",
        text: "Error: Unable to process request.",
        state: "error",
      };
      setHistory((prev) => [...prev, errorResponse]);
      setCommunicating(false);
    }
  };

  const startRecording = async () => {
    if (communicating) {
      console.log("communicating");
      return;
    }

    console.log("start recording");
    try {
      await recorderRef.current.start();
      const now = Date.now();
      setRecording(now);

      // Use a functional update to compare the latest state value
      setTimeout(() => {
        setRecording((current) => {
          if (current === now) {
            stopRecording();
          }
          return current;
        });
      }, 10000);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = async () => {
    setRecording(0);
    try {
      const audio = await recorderRef.current.getWAVBlob();

      const formData = new FormData();
      formData.append("aia", config.id);
      formData.append("audio", audio, "audio.wav");

      setHistory((prev) => [
        ...prev,
        { from: "user", text: undefined, state: "pending" },
      ]);
      scrollToBottom();

      setCommunicating(true);
      let res = await fetch(`${apiUrl}/completions/stream/audio`, {
        method: "POST",
        body: formData,
      });
      console.log(res);

      if (res.ok) {
        await handleStream(res);
      } else {
        console.log("HTTP-Error: " + res.status);
      }

      setCommunicating(false);
    } catch (e) {
      console.error(e);
      setCommunicating(false);
    }
  };

  const handleStream = async (res: Response) => {
    let assistantMessage = {
      from: "assistant",
      text: "",
      audio: null,
      state: "pending",
    };

    let stream = await events(res, null);
    for await (let event of stream) {
      const data = JSON.parse(event.data);
      console.log(data);

      if (data.from === "assistant") {
        if (data.type === "emotion") {
          console.log(`emotion is: ${data.emotion}`);
          EVENT_BUS.emit("emotion", data.emotion);
        } else if (data.type === "token") {
          // Append token to the assistant message
          assistantMessage = {
            ...assistantMessage,
            text: assistantMessage.text + data.text,
            state: "pending", // Keep pending until full message is received
          };

          setHistory((prev) => {
            const updated = [...prev];
            const index = updated.findIndex(
              (item) => item.from === "assistant" && item.state === "pending"
            );

            if (index !== -1) {
              updated[index] = assistantMessage;
            } else {
              updated.push(assistantMessage);
            }
            return updated;
          });

          scrollToBottom();
        } else if (data.type === "audio") {
          assistantMessage = {
            ...assistantMessage,
            audio: data.audio,
            state: "completed", // Mark completed once audio is received
          };

          setHistory((prev) => {
            const updated = [...prev];
            const index = updated.findIndex(
              (item) => item.from === "assistant" && item.state === "pending"
            );

            if (index !== -1) {
              updated[index] = assistantMessage;
            } else {
              updated.push(assistantMessage);
            }
            return updated;
          });

          // Ensure voice icon updates properly
          EVENT_BUS.emit("audioReady", data.audio);
        }
      } else if (data.from === "user") {
        setHistory((prev) =>
          prev.map((item) => {
            if (
              item.from === "user" &&
              item.state === "pending" &&
              (!item.text || item.text.trim() === "")
            ) {
              return { ...item, state: "completed", text: data.text };
            }
            return item;
          })
        );
      } else if (data.from === "notification") {
        setHistory((prev) => [
          ...prev,
          { from: "notification", text: data.text },
        ]);
      }
    }
  };


  return (
    <div className={isVertical ? "vertical" : "horizontal"}>

      {/* Chat UI */}
      <div className="ui">
        <div className="chat-panel">

          {/* Chat Header */}
          <div style={{ display: "flex", alignItems: "center", marginTop: "1em", gap: "1em" }}>
            <img src="/assets/company.png" alt="Avatar" style={{ width: "6em" }} />
            <span style={{ fontSize: "1.5em", color: "white" }}>{config.name}</span>
          </div>

          {/* Chat History Separator */}
          <div
            style={{
              marginTop: "1em",
              backgroundColor: "#FFFFFF22",
              width: "calc(100% - 2em)",
              height: "1px"
            }}
          ></div>

          {/* Chat History */}
          <div className="chat-container">
            <div className="history-container">
              {history.map((line, index) => (
                <LineItem key={index} historyItem={line} />
              ))}
              <div id="linebottom" ref={lineBottomRef}></div>
            </div>
          </div>

          {/* Fixed Chat Input */}
          <div className="input-container">
            <input
              onKeyUp={(e) => e.key === "Enter" && onBtnSendClick()}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
            />
            <div className="tools">
              <button onClick={onBtnRecordClick} disabled={communicating} className="icon-btn">
                {recording ? <BsFillMicFill /> : <BsFillMicMuteFill />}
              </button>
              <button onClick={onBtnSendClick} className="icon-btn">
                <RiSendPlaneFill />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );

};

export default App;
