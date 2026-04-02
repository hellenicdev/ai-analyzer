const contractInput = document.getElementById("contract-input");
const submitBtn = document.getElementById("submit-btn");
const resultDiv = document.getElementById("result");

submitBtn.addEventListener("click", async () => {
  const contractText = contractInput.value.trim();
  if (!contractText) return alert("Please paste your contract first!");

  resultDiv.innerHTML = "Analyzing... 🔍";

  try {
    const response = await fetch("https://your-backend.onrender.com/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract: contractText })
    });

    if (!response.ok) throw new Error("Failed to analyze contract");

    const data = await response.json();
    resultDiv.innerHTML = formatResult(data);

  } catch (error) {
    resultDiv.innerHTML = `<span style="color:red">Error: ${error.message}</span>`;
  }
});

function formatResult(data) {
  if (!data || !data.analysis) return "No analysis returned.";

  let html = "<h3>Contract Analysis Results:</h3><ul>";
  data.analysis.forEach(item => {
    html += `<li><strong>${item.title}:</strong> ${item.details}</li>`;
  });
  html += "</ul>";
  return html;
}