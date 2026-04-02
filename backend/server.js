import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req, res) => {
  const { contract } = req.body;
  if (!contract) return res.status(400).json({ error: "No contract provided" });

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: contract })
    });

    const hfData = await response.json();

    // Transform HF response
    const analysis = hfData.map((item, idx) => ({
      title: item.label || `Item ${idx + 1}`,
      details: item.score ? `${item.score} - ${item.text || ""}` : item.text || ""
    }));

    res.json({ analysis });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));