import React, { useMemo } from "react";
import { marked } from "marked";
import { config } from "../config";
import { playBase64 } from "../audio";
import { RiVoiceAiLine } from "react-icons/ri";

const LineItem = ({ historyItem }) => {
  const { from, text, audio, state } = historyItem;
  console.log(historyItem);
  const displayName = from === "user" ? "You" : config.name;

  const play = () => {
    if (audio) {
      playBase64(audio);
    }
  };

  const styles = {
    container: {
      display: "flex",
      width: "100%",
      marginBottom: "1em", // add spacing between messages
      justifyContent: from === "assistant" ? "flex-start" : "flex-end",
    },
    message: {
      minWidth: "20%",
      maxWidth: "80%",
      borderRadius: "1em",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "1em",
      gap: "0.75em",
      fontWeight: "bold",
      // background and text color based on sender
      backgroundColor: from === "user" ? "rgb(55, 82, 155)" : "rgb(43, 46, 54)",
      color: from === "user" ? "black" : "white",
    },
    avatar: {
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      marginRight: "0.5em",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "0.5em",
      width: "100%",
    },
    name: {
      fontSize: "0.9em",
    },
    content: {
      fontSize: "0.95em",
      lineHeight: "1.4",
    },
    playIcon: {
      cursor: "pointer",
      marginLeft: "auto",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.message}>
        <div style={styles.header} className="message-header">
          <img
            style={styles.avatar}
            src={
              from === "assistant" ? "/assets/company.png" : "/assets/user-avatar.png"
            }
            alt="avatar"
          />
          <span style={styles.name}>{displayName}</span>

          <div style={{ marginLeft: "auto"}}>
            {from === "assistant" && audio && (
              <RiVoiceAiLine onClick={play}  />
            )}
          </div>

        </div>
        <div style={styles.content} className="message-content">
          {state != "completed" && from != 'user' ? (
            <img
              src="/assets/loading.gif"
              style={{ height: "1.6em", width: "auto" }}
              alt="loading"
            />
          ) : (
            <span>{text}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineItem;
