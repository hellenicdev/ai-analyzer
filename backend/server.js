const express = require("express");
const multer = require("multer");
const cors = require("cors");
const morgan = require("morgan");
const https = require("https");
const dns = require("dns");
const axios = require("axios");
require("dotenv").config();

const HF_HOST = "api-inference.huggingface.co";
const DOH_URL = `https://cloudflare-dns.com/dns-query?name=${HF_HOST}&type=A`;

let HF_IP = null;

// Prepend public DNS servers for environments where system DNS is restricted
try {
  const current = dns.getServers();
  const publicDNS = ["1.1.1.1", "8.8.8.8"];
  const merged = [...new Set([...publicDNS, ...current])];
  dns.setServers(merged);
} catch (_) { /* not all environments allow setServers */ }

const httpsAgent = new https.Agent({
  keepAlive: true,
  lookup(hostname, opts, cb) {
    if (hostname === HF_HOST && HF_IP) {
      return cb(null, HF_IP, 4);
    }
    dns.lookup(hostname, opts, cb);
  },
});

async function resolveHF(retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Try system DNS first
    try {
      const addrs = await dns.promises.resolve4(HF_HOST);
      if (addrs.length) {
        HF_IP = addrs[0];
        console.log(`HF API resolved via DNS: ${HF_IP}`);
        return true;
      }
    } catch (err) {
      if (attempt === 0) console.warn(`System DNS failed (${err.code}), trying DoH...`);
    }
    // Fallback to DNS-over-HTTPS (bypasses system resolver)
    try {
      const res = await axios.get(DOH_URL, {
        headers: { Accept: "application/dns-json" },
        timeout: 5000,
      });
      const answer = (res.data.Answer || []).find((a) => a.type === 1);
      if (answer) {
        HF_IP = answer.data;
        console.log(`HF API resolved via DoH: ${HF_IP}`);
        return true;
      }
    } catch (e) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  console.warn("HF API DNS resolution failed after all attempts");
  return false;
}

resolveHF();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

app.use(cors());
app.use(morgan("short"));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [".txt", ".md", ".csv", ".json", ".log", ".xml", ".yaml", ".yml"];
    const ext = "." + file.originalname.split(".").pop()?.toLowerCase();
    if (allowed.includes(ext) || file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(", ")}`));
    }
  },
});

const HF_MODELS = {
  summarize: "facebook/bart-large-cnn",
  sentiment: "distilbert-base-uncased-finetuned-sst-2-english",
  "zero-shot": "facebook/bart-large-mnli",
};

function validateEnv() {
  if (!process.env.HF_API_KEY) {
    console.error("FATAL: HF_API_KEY environment variable is not set.");
    process.exit(1);
  }
}
validateEnv();

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "AI Analyzer API",
    version: "2.0.0",
    models: Object.keys(HF_MODELS),
    endpoints: {
      "POST /upload": "Upload a file for AI analysis (query: ?type=summarize|sentiment|zero-shot)",
    },
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use field name 'file'." });
    }

    const analysisType = req.query.type || "summarize";
    if (!HF_MODELS[analysisType]) {
      return res.status(400).json({
        error: `Unknown analysis type: "${analysisType}"`,
        available: Object.keys(HF_MODELS),
      });
    }

    const text = req.file.buffer.toString("utf-8").trim();
    if (!text) {
      return res.status(400).json({ error: "File is empty." });
    }

    const model = HF_MODELS[analysisType];
    const HF_URL = `https://api-inference.huggingface.co/models/${model}`;
    const truncatedText = text.slice(0, 2000);

    const input =
      analysisType === "zero-shot"
        ? { inputs: truncatedText, parameters: { candidate_labels: ["technology", "science", "business", "health", "education", "entertainment", "sports", "politics"] } }
        : { inputs: truncatedText };

    const response = await axios({
      method: "POST",
      url: HF_URL,
      httpsAgent,
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
      data: input,
      timeout: 30000,
    });

    const output = response.data;

    res.json({
      ok: true,
      type: analysisType,
      model,
      result: output,
      meta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        characters: truncatedText.length,
      },
    });
  } catch (err) {
    console.error("Upload error:", err.message);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` });
    }
    if (err.message?.includes("Unsupported file type")) {
      return res.status(415).json({ error: err.message });
    }

    let category = "unknown";
    let detail = err.message;

    if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || err.code === "ENODATA") {
      category = "dns";
      detail = `Cannot resolve Hugging Face API domain (${err.code}).`;
      resolveHF(); // retry DNS in background
    } else if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET" || err.code === "ETIMEDOUT") {
      category = "network";
      detail = `Cannot connect to Hugging Face API (${err.code}). The service may be down or blocked.`;
    } else if (err.response) {
      category = "api";
      detail = err.response.data?.error || `HTTP ${err.response.status}`;
    } else if (err.code === "ECONNABORTED") {
      category = "timeout";
      detail = "Hugging Face API took too long to respond.";
    }

    res.status(500).json({
      error: "Analysis failed",
      category,
      detail,
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found. Try POST /upload or GET /" });
});

app.listen(PORT, () => {
  console.log(`AI Analyzer API running on port ${PORT}`);
  console.log(`Models: ${Object.keys(HF_MODELS).join(", ")}`);
});
