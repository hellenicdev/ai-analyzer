const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const HF_KEY = process.env.HF_API_KEY;

// 🧠 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🧠 AI Dashboard Backend Running");
});

// 🔥 SAFE HF CALL WRAPPER (prevents all URL bugs)
const hfPost = (model, data) => {
  return axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${HF_KEY}`
      }
    }
  );
};

// 📦 MAIN UPLOAD ROUTE
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const mime = req.file.mimetype;
    console.log("FILE TYPE:", mime);

    // =========================
    // 🖼 IMAGE MODE
    // =========================
    if (mime.startsWith("image/")) {
      const base64 = req.file.buffer.toString("base64");

      const response = await hfPost(
        "Salesforce/blip-image-captioning-base",
        {
          inputs: base64
        }
      );

      return res.json({
        mode: "image",
        result: response.data[0]?.generated_text || response.data
      });
    }

    // =========================
    // 📄 TEXT MODE
    // =========================
    const text = req.file.buffer.toString("utf-8");

    if (!text || text.trim().length === 0) {
      return res.json({
        mode: "text",
        result: "⚠️ Unsupported or empty file."
      });
    }

    const response = await hfPost(
      "google/flan-t5-base",
      {
        inputs: `Analyze and summarize this file:\n\n${text.slice(0, 2000)}`
      }
    );

    return res.json({
      mode: "text",
      result: response.data[0]?.generated_text || response.data
    });

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});