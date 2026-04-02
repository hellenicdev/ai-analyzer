// Replace with your Render URL
const API_URL = "https://ai-analyzer-htk8.onrender.com/analyze";

// Function to send contract text to backend
async function analyzeContract(text) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contract: text })
    });

    const data = await response.json();
    console.log("AI Result:", data);
    return data;
  } catch (err) {
    console.error("Error calling backend:", err);
  }
}

// Example usage
analyzeContract("This is my sample contract text.");