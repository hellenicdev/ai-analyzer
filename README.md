# ai-analyzer

Upload text files and get instant AI-powered analysis — summarization, sentiment, or topic classification.

**Frontend:** GitHub Pages · **Backend:** Render

## Features

- **Summarize** — condense long text with `facebook/bart-large-cnn`
- **Sentiment Analysis** — detect positive/negative tone via `distilbert-base-uncased-finetuned-sst-2-english`
- **Topic Classification** — categorize text into topics using zero-shot `facebook/bart-large-mnli`
- Drag & drop file upload with instant feedback
- Clean, responsive dark-mode UI

## Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | Vanilla HTML / CSS / JS |
| Backend     | Node.js + Express |
| AI API      | Hugging Face Inference API |
| File Upload | Multer (memory storage) |
| Logging     | Morgan |

## Local Development

```bash
# Clone
git clone https://github.com/hellenicdev/ai-analyzer.git
cd ai-analyzer

# Backend
cd backend
cp ../.env.example .env   # add your HF_API_KEY
npm install
npm run dev

# Frontend
# Open frontend/index.html in a browser,
# or serve it locally:
npx serve frontend
```

## Environment Variables

| Variable      | Required | Description |
|---------------|----------|-------------|
| `HF_API_KEY`  | Yes      | [Hugging Face API token](https://huggingface.co/settings/tokens) |
| `PORT`        | No       | Server port (default `3000`) |

## API

### `GET /`

Health check — returns available models and endpoints.

### `POST /upload?type=<mode>`

Upload a file for AI analysis. Accepted modes:

| `type` parameter | Description |
|------------------|-------------|
| `summarize`      | Summarize the text (default) |
| `sentiment`      | Positive / Negative sentiment |
| `zero-shot`      | Classify into topic categories |

Accepts `.txt`, `.md`, `.csv`, `.json`, `.log`, `.xml`, `.yaml` files up to 5 MB.

## Deployment

**Backend (Render):** Connect the repo, set `HF_API_KEY`, `PORT=10000`, start command `cd backend && npm start`.

**Frontend (GitHub Pages):** Point Pages to the `frontend/` directory on the `main` branch.
