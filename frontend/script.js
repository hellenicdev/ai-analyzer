async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    alert("Select a file first!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file);

  resultDiv.innerText = "Analyzing...";

  try {
    const response = await fetch("https://YOUR-RENDER-URL.onrender.com/upload", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    resultDiv.innerText = data.result || JSON.stringify(data, null, 2);
  } catch (err) {
    resultDiv.innerText = "Error: " + err.message;
  }
}