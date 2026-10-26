const API_URL = "https://ai-analyzer-htk8.onrender.com";
// Leave empty to skip Cloudflare Turnstile. Set the site key only when
// TURNSTILE_SECRET_KEY is also set on the API.
const TURNSTILE_SITE_KEY = "";

const dropzone = document.getElementById("dropzone");
const dropzoneContent = document.getElementById("dropzoneContent");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeBtn = document.getElementById("removeFile");
const analysisType = document.getElementById("analysisType");
const uploadBtn = document.getElementById("uploadBtn");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const status = document.getElementById("status");
const statusText = document.getElementById("statusText");
const statusIcon = document.getElementById("statusIcon");
const result = document.getElementById("result");
const resultBody = document.getElementById("resultBody");
const resultType = document.getElementById("resultType");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

let selectedFile = null;

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ── File selection via dropzone click ──────────────────────
dropzone.addEventListener("click", (e) => {
  if (e.target.closest(".file-info-remove")) return;
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) setFile(fileInput.files[0]);
});

// ── Drag & Drop ───────────────────────────────────────────
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
});

function setFile(file) {
  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatSize(file.size);
  dropzoneContent.classList.add("hidden");
  fileInfo.classList.remove("hidden");
  dropzone.classList.add("has-file");
  uploadBtn.disabled = false;
  hideStatus();
  hideResult();
}

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  clearFile();
});

function clearFile() {
  selectedFile = null;
  fileInput.value = "";
  dropzoneContent.classList.remove("hidden");
  fileInfo.classList.add("hidden");
  dropzone.classList.remove("has-file");
  uploadBtn.disabled = true;
  hideStatus();
  hideResult();
}

// ── Upload ─────────────────────────────────────────────────
uploadBtn.addEventListener("click", uploadFile);

// Enter key to trigger upload
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !uploadBtn.disabled) uploadFile();
});

function readTurnstileToken() {
  if (!TURNSTILE_SITE_KEY) return "";
  return window.turnstile?.getResponse() || null;
}

function initTurnstile() {
  if (!TURNSTILE_SITE_KEY) return;
  const widget = document.getElementById("turnstileWidget");
  widget.classList.remove("hidden");
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.onload = () => {
    window.turnstile.render(widget, { sitekey: TURNSTILE_SITE_KEY, theme: "dark" });
  };
  document.head.appendChild(script);
}

async function uploadFile() {
  if (!selectedFile) return;

  const turnstileToken = readTurnstileToken();
  if (turnstileToken === null) {
    showStatus("error", "Complete the verification check first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);
  if (turnstileToken) formData.append("cf-turnstile-response", turnstileToken);
  const type = analysisType.value;

  setLoading(true);

  try {
    const res = await fetch(`${API_URL}/upload?type=${encodeURIComponent(type)}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Request failed");
    }

    showResult(type, data);
    showStatus("success", "Analysis complete");
  } catch (err) {
    showStatus("error", err.message);
  } finally {
    if (TURNSTILE_SITE_KEY && window.turnstile) window.turnstile.reset();
    setLoading(false);
  }
}

function setLoading(loading) {
  if (loading) {
    btnText.textContent = "Analyzing…";
    btnSpinner.classList.remove("hidden");
    uploadBtn.disabled = true;
    showStatus("loading", "Analyzing file…");
  } else {
    btnText.textContent = "Analyze File";
    btnSpinner.classList.add("hidden");
    uploadBtn.disabled = false;
  }
}

// ── Display helpers ───────────────────────────────────────
function showStatus(type, message) {
  status.className = "status " + type;
  statusText.textContent = message;
  status.classList.remove("hidden");
}

function hideStatus() {
  status.classList.add("hidden");
}

function showResult(type, data) {
  result.classList.remove("hidden");
  resultType.textContent = type.replace(/-/g, " ");
  resultBody.innerHTML = "";

  switch (type) {
    case "sentiment":
      renderSentiment(data.result);
      break;
    case "zero-shot":
      renderZeroShot(data.result);
      break;
    case "summarize":
    default:
      renderSummarize(data.result);
      break;
  }
}

function hideResult() {
  result.classList.add("hidden");
}

function renderSummarize(result) {
  const text = Array.isArray(result) ? result[0]?.summary_text || JSON.stringify(result) : typeof result === "string" ? result : JSON.stringify(result, null, 2);
  const p = document.createElement("p");
  p.textContent = text;
  resultBody.appendChild(p);
}

function renderSentiment(result) {
  const scores = Array.isArray(result) ? result : [result];
  const ul = document.createElement("ul");
  scores.forEach((item) => {
    const label = (item.label || item[0]?.label || "").toLowerCase();
    const score = item.score || item[0]?.score || 0;
    const pct = (score * 100).toFixed(1);

    const li = document.createElement("li");
    const labelSpan = document.createElement("span");
    labelSpan.className = "sentiment-label";
    if (label === "positive" || label === "negative" || label === "neutral") {
      labelSpan.classList.add(label);
    }
    labelSpan.textContent = label;
    const scoreSpan = document.createElement("span");
    scoreSpan.textContent = pct + "%";
    li.append(labelSpan, scoreSpan);
    ul.appendChild(li);
  });
  resultBody.appendChild(ul);
}

function renderZeroShot(result) {
  const data = Array.isArray(result) ? result[0] : result;
  const labels = data.labels || data.sequence || [];
  const scores = data.scores || [];

  if (labels.length && scores.length) {
    const ul = document.createElement("ul");
    labels.forEach((label, i) => {
      const pct = (scores[i] * 100).toFixed(1);
      const li = document.createElement("li");
      const tag = document.createElement("span");
      tag.className = "topic-tag";
      tag.textContent = String(label);
      const scoreSpan = document.createElement("span");
      scoreSpan.textContent = pct + "%";
      li.append(tag, scoreSpan);
      ul.appendChild(li);
    });
    resultBody.appendChild(ul);
  } else {
    resultBody.textContent = JSON.stringify(data, null, 2);
  }
}

// ── Clipboard ─────────────────────────────────────────────
copyBtn.addEventListener("click", async () => {
  const text = resultBody.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add("copied");
    setTimeout(() => copyBtn.classList.remove("copied"), 2000);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
});

clearBtn.addEventListener("click", () => {
  hideResult();
});

initTurnstile();
