import dotenv from "dotenv";
dotenv.config();

import express from "express";
import multer, { diskStorage } from "multer";
import fs from "fs";
import completionHandler from "./handlers/chat_handler.js";
import cors from "cors";
import { Asr } from "./asr/asr.js";
import { getPollinationsText } from "./utils/downimage.js";

// Initialize Express app
function main() {
  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT || 4242;

  const upload = multer({
    storage: diskStorage({
      destination: "/tmp/uploads/",
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}${file.originalname.slice(file.originalname.lastIndexOf("."))}`);
      },
    }),
  });

  const cleanUpUploadedAudio = (path: string) => {
    try {
      fs.unlink(path, (err) => {
        if (err) console.error(err);
      });
    } catch (e) {
      console.log(`Error cleaning up uploaded audio: ${e}`);
    }
  };

  const setStream = (res: any) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
  };

  // Endpoint for audio completions using ASR
  app.post("/completions/stream/audio", upload.single("audio"), async (req, res) => {
    try {
      setStream(res);
      const aia = req.body["aia"];
      const history = req.body["history"];
      console.log(`Extracted aia: ${aia}, history: ${history} from request`);

      const asrResult = await Asr(req.file?.path!, res);
      cleanUpUploadedAudio(req.file?.path!);

      if (asrResult) {
        await completionHandler(aia, asrResult.text, history, res);
      } else {
        res.end();
      }
    } catch (e) {
      console.error(e);
      cleanUpUploadedAudio(req.file?.path!);
    } finally {
      if (!req.file?.path) return;
      fs.access(req.file?.path, fs.constants.F_OK, (err) => {
        if (!err) cleanUpUploadedAudio(req.file?.path!);
      });
    }
  });

  // Endpoint for text completions
  app.post("/completions/stream", upload.none(), async (req, res) => {
    const aia = req.body["aia"];
    const history = req.body["history"];
    const message = req.body["message"];

    try {
      const generatedText = await getPollinationsText(message);
      console.log("Pollinations generated text:", generatedText);
      res.json({ text: generatedText });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error generating text" });
    }
  });

  app.listen(port, () => {
    console.log("Listening on port " + port);
  });

  console.log("Service started");
}
console.log("Deepgram API Key:", process.env.DEEPGRAM_API_KEY);

main();
