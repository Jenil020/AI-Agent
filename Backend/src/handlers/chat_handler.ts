import { streamWriteData } from "../utils/handler_utils";
import { getPollinationsText } from "../utils/downimage"; // Utility function for Pollinations
import axios from "axios";

// Configuration for Pollinations API
const aiaConfig = {
  prompt: process.env.SYS_PROMPT,
  pollinationsBaseUrl:
    process.env.POLLINATIONS_BASE_URL || "https://text.pollinations.ai",
  voice: process.env.VOICE_CLONE_ID,
};

const completionHandler = async (
  aia: string,
  message: string,
  history: string,
  res: any
) => {
  // Check if configuration exists
  if (!aiaConfig) {
    console.error(`AIA config not found for ${aia}`);
    streamWriteData(res, {
      from: "assistant",
      text: `AIA config not found for ${aia}`,
    });
    res.end();
    return;
  }

  // **Generate text response using Pollinations**
  const generatedText = await getPollinationsText(message);
  console.log("✅ Pollinations generated text:", generatedText);

  // **Send generated text to the frontend**
  streamWriteData(res, {
    from: "assistant",
    text: generatedText,
    type: "token",
  });

  try {
    console.log("🔹 Sending text to Deepgram for TTS...");

    const ttsResponse = await axios.post(
      "https://api.deepgram.com/v1/speak",
      { text: generatedText },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "audio/wav",
        },
        responseType: "arraybuffer",
      }
    );

    if (ttsResponse?.data) {
      const buffer = Buffer.from(ttsResponse.data);
      const base64Audio = buffer.toString("base64");

      // **Send generated audio response to the frontend**
      streamWriteData(res, {
        from: "assistant",
        type: "audio",
        audio: base64Audio,
      });

      console.log("✅ Deepgram TTS audio generated successfully!");
    } else {
      console.error("❌ Deepgram TTS response is empty.");
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Axios Error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("❌ General Error:", error.message);
    } else {
      console.error("❌ Unknown Error:", error);
    }
  }

  // **Send end signal to the frontend**
  streamWriteData(res, { from: "assistant", type: "end" });
  res.end();
};

export default completionHandler;
