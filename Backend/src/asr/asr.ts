import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";
import fs from "fs";
import { streamWriteData } from "../utils/handler_utils";

dotenv.config();

// Using the Deepgram API key from environment variables
const OPENAI = process.env.OPENAI_API_KEY;
if (!OPENAI) {
  throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}

// Initialize Deepgram SDK
const deepgram = createClient(OPENAI);

async function Asr(input: string, res: any, isText: boolean = false) {
  try {
    console.log("Received input:", input);
    console.log("Is text input:", isText);

    let transcript = "";

    if (isText) {
      // Process manual text input instead of voice transcription
      transcript = input.trim();

      if (!transcript) {
        console.log("Error: Received an empty manual input.");
        streamWriteData(res, {
          from: "assistant",
          text: "Error: Empty message received.",
          language: "en",
          state: "error",
        });
        return null;
      }

      console.log("Manual message received:", transcript);
    } else {
      // Ensure the input file exists
      if (!fs.existsSync(input)) {
        console.error("Error: Audio file does not exist.");
        streamWriteData(res, {
          from: "assistant",
          text: "Error: Audio file not found.",
          language: "en",
          state: "error",
        });
        return null;
      }

      // Process audio file transcription with timeout
      const audioFileStream = fs.createReadStream(input);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // Timeout after 10 seconds

      try {
        const transcription = await deepgram.listen.prerecorded.transcribeFile(
          audioFileStream,
          {
            language: "en",
            punctuate: true,
            utterances: true,
            signal: controller.signal
          }
        );

        clearTimeout(timeout); // Clear timeout if request completes

        console.log("Transcription result:", transcription.result);

        // Check if the transcription is valid
        if (
          transcription &&
          transcription.result &&
          transcription.result.results.channels &&
          transcription.result.results.channels.length > 0
        ) {
          transcript =
            transcription.result.results.channels[0].alternatives[0].transcript;
        } else {
          throw new Error("No transcription result found");
        }
      } catch (error) {
        console.error("Deepgram API error:", error);
        streamWriteData(res, {
          from: "assistant",
          text: "Error: Transcription failed.",
          language: "en",
          state: "error",
        });
        return null;
      }
    }

    const language = "en"; // Default language
    console.log(`Language: ${language}`);
    console.log("Processed message:", transcript);

    // Stream the response back to the client
    const response = {
      from: "user",
      text: transcript,
      language: language,
      state: "completed",
    };
    console.log("Sending response:", response);
    streamWriteData(res, response);

    return { text: transcript };
  } catch (e) {
    console.error("Error processing message:", e);
    streamWriteData(res, {
      from: "assistant",
      text: "Error: Unable to process request.",
      language: "en",
      state: "error",
    });
    return null;
  }
}

export { Asr };
