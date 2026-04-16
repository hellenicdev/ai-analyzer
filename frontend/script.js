async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const result = document.getElementById("result");

  if (!fileInput.files.length) {
    alert("Select a file first");
    return;
  }

  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("file", file, file.name);

  status.innerText = "Uploading...";

  try {
    const res = await fetch("https://ai-analyzer-htk8.onrender.com/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    status.innerText = "Done";

    result.innerText = data.result || JSON.stringify(data, null, 2);

  } catch (err) {
    status.innerText = "Error";
    result.innerText = err.message;
  }
}