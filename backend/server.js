app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("FILES:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    const fileBuffer = req.file.buffer.toString("utf-8");

    console.log("TEXT LENGTH:", fileBuffer.length);

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      { inputs: fileBuffer.slice(0, 2000) },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`
        }
      }
    );

    res.json({
      result: response.data[0]?.summary_text || response.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});