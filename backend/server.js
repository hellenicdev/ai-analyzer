const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ✅ Upload route (FULL DEBUG VERSION)
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("UPLOAD HIT");

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = req.file.buffer.toString("utf-8");

    const HF_URL =
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

    console.log("CALLING HF:", HF_URL);

    const response = await axios({
      method: "POST",
      url: HF_URL,
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      data: {
        inputs: text.slice(0, 1000),
      },
    });

    return res.json({
      ok: true,
      result: response.data,
    });

  } catch (err) {
    console.log("AXIOS ERROR URL:", err.config?.url);
    console.log("AXIOS DETAILS:", err.response?.data || err.message);

    return res.status(500).json({
      error: err.message,
      debug_url: err.config?.url,
      details: err.response?.data || null,
    });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});