async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const statusDiv = document.getElementById("status");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    alert("Please select a file first!");
    return;
  }

  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("file", file, file.name);

  statusDiv.innerText = "🧠 Uploading...";

  try {
    const res = await fetch("https://ai-analyzer-htk8.onrender.com/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    statusDiv.innerText = "Done ✔";

    resultDiv.innerText =
      data.result || JSON.stringify(data, null, 2);

  } catch (err) {
    statusDiv.innerText = "Error";
    resultDiv.innerText = err.message;
  }
}