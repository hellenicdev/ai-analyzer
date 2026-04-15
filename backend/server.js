const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express(); // 🔥 MUST be first

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const fileBuffer = req.file.buffer.toString("utf-8");

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      { inputs: fileBuffer.slice(0, 2000) },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`
        }
      }
    );

    res.json({
      result: response.data[0]?.summary_text || response.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});