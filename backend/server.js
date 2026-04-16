const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const HF_KEY = process.env.HF_API_KEY;

// 🧠 SMART FILE ROUTER
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const mime = req.file.mimetype;
    console.log("FILE TYPE:", mime);

    // =========================
    // 🖼 IMAGE MODE
    // =========================
    if (mime.startsWith("image/")) {
      console.log("Using IMAGE AI mode");

      const base64 = req.file.buffer.toString("base64");

      const response = await axios.post(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
        {
          inputs: base64
        },
        {
          headers: {
            Authorization: `Bearer ${HF_KEY}`
          }
        }
      );

      return res.json({
        mode: "image",
        result: response.data[0]?.generated_text || response.data
      });
    }

    // =========================
    // 📄 TEXT MODE (txt/json/md/doc fallback)
    // =========================

    const text = req.file.buffer.toString("utf-8");

    if (!text || text.trim().length === 0) {
      return res.json({
        result: "⚠️ Could not read file as text. Try a .txt or .json file."
      });
    }

    console.log("Using TEXT AI mode");

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        inputs: `You are a smart file analyzer. Summarize and explain this file:\n\n${text.slice(0, 2000)}`
      },
      {
        headers: {
          Authorization: `Bearer ${HF_KEY}`
        }
      }
    );

    return res.json({
      mode: "text",
      result: response.data[0]?.generated_text || response.data
    });

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
});

app.get("/", (req, res) => {
  res.send("🧠 Smart AI File Analyzer running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});