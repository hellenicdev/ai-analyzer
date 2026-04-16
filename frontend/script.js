async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const resultDiv = document.getElementById("result");

  if (!fileInput.files.length) {
    alert("Select a file first!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("file", file, file.name);

  resultDiv.innerText = "🧠 Analyzing with Smart AI...";

  try {
    const response = await fetch(
      "https://ai-analyzer-htk8.onrender.com/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (data.mode === "image") {
      resultDiv.innerText =
        "🖼 Image Analysis:\n\n" + data.result;
    } else if (data.mode === "text") {
      resultDiv.innerText =
        "📄 Text Analysis:\n\n" + data.result;
    } else {
      resultDiv.innerText =
        data.result || JSON.stringify(data, null, 2);
    }

  } catch (err) {
    resultDiv.innerText = "Error: " + err.message;
  }
}