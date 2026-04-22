const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const HF_API = "https://api-inference.huggingface.co/models/";
const HF_KEY = process.env.HF_API_KEY;

// 🧪 health check
app.get("/", (req, res) => {
  res.send("AI backend running");
});

// 📦 upload route
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("UPLOAD HIT");

  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }

  res.json({
    ok: true,
    filename: req.file.originalname,
    size: req.file.size
  });
});

    // ======================
    // 📄 TEXT MODE
    // ======================
    const text = req.file.buffer.toString("utf-8");

    const response = await axios.post(
      HF_API + "google/flan-t5-base",
      {
        inputs: `Summarize this file:\n\n${text.slice(0, 2000)}`
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
    console.error(err.response?.data || err.message);

    res.status(500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
});

// 🚀 start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});