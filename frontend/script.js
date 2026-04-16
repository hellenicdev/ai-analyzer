const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const resultDiv = document.getElementById("result");
const statusDiv = document.getElementById("status");

let selectedFile = null;

// CLICK TO SELECT
dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];
  statusDiv.innerText = `Selected: ${selectedFile.name}`;
});

// DRAG & DROP
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "#fff";
});

dropzone.addEventListener("dragleave", () => {
  dropzone.style.borderColor = "#6c63ff";
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.style.borderColor = "#6c63ff";

  selectedFile = e.dataTransfer.files[0];
  fileInput.files = e.dataTransfer.files;

  statusDiv.innerText = `Selected: ${selectedFile.name}`;
});

// UPLOAD
async function uploadFile() {
  if (!selectedFile) {
    alert("Pick a file first!");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile, selectedFile.name);

  resultDiv.innerText = "";
  statusDiv.innerText = "🧠 Analyzing...";

  try {
    const res = await fetch("https://ai-analyzer-htk8.onrender.com/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    statusDiv.innerText = `Mode: ${data.mode || "unknown"}`;

    resultDiv.innerText =
      data.result || JSON.stringify(data, null, 2);

  } catch (err) {
    statusDiv.innerText = "Error";
    resultDiv.innerText = err.message;
  }
}