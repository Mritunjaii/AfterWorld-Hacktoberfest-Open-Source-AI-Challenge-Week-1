# AFTERWORLD

> *Every place has a past. Every place has a possible future.*

AFTERWORLD is a minimalist, editorial web app that transforms physical landmarks and historical places into portals through time. By combining strictly grounded historical evidence citations with open-weight language models, AFTERWORLD bridges documented human history, present reality, and speculative future horizons.

---

## 🏛️ Core Principles & Architecture

1. **Strict Historical Grounding**: Past narratives are generated exclusively from verified evidence bundles (Wikidata, Wikipedia, and curated records). Claims cite clickable, public source URLs. The model is forbidden from inventing names, dates, or citations.
2. **Explicitly Labeled Speculation**: Future narratives are creative projections labeled: `Imagined future — not a prediction`.
3. **Dual-Model Inference Strategy**:
   - **Local Development**: Runs Google Gemma via Ollama on developer machine.
   - **Cloud Deployment (Render / Production)**: Uses Google Gemini API (`gemini-1.5-flash`), eliminating the need to self-host heavy GPU models in the cloud.
4. **Minimalist Editorial Aesthetics**: Warm off-white canvas (`#FBF9F5`), charcoal typography, muted teal/olive accent (`#2E6059`), and quiet typography inspired by architectural journals.
5. **No Clutter**: No user accounts, leaderboards, or feeds. Built for real-world exploration.
6. **Privacy First**: Optional browser Geolocation; manual search operates without permissions. Precise user coordinates are never stored or tracked.

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **npm**: v10+
- **Ollama (for local Gemma)**: [ollama.com](https://ollama.com/)
  ```bash
  ollama pull gemma2:2b
  ```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the template into `.env.local`:
```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `ollama` for local Gemma, `gemini` for Google Gemini | `ollama` (local) |
| `GEMINI_API_KEY` | Google Gemini API key (for Render cloud deployment) | *empty* |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |
| `OLLAMA_BASE_URL` | Local or remote Ollama serving endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Open-weight Gemma model identifier | `gemma2:2b` |
| `MONGODB_URI` | MongoDB Atlas connection string *(optional; falls back to seed JSON)* | *empty* |
| `SERPAPI_API_KEY` | SerpApi key for auxiliary web evidence leads *(optional)* | *empty* |
| `SENTRY_DSN` | Sentry telemetry DSN with PII scrubbing *(optional)* | *empty* |

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Render

This repository includes [`render.yaml`](./render.yaml) for direct Blueprint deployment or standard Web Service configuration on [Render](https://render.com).

### Step-by-Step Render Deployment:
1. Push your repository to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** $\rightarrow$ **Web Service** (or **Blueprint**).
3. Connect your repository.
4. Fill in the following build & start settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free (or Starter)
5. Add the following **Environment Variables** under Render settings:
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>` (from [Google AI Studio](https://aistudio.google.com/app/apikey))
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `SERPAPI_API_KEY`: `<Your SerpApi key>` (optional)
   - `SENTRY_DSN`: `<Your Sentry DSN>` (optional)
6. Click **Create Web Service**. Render will automatically build Next.js and launch your live portal.

---

## 🧭 Curated Demo Locations

AFTERWORLD ships with 5 pre-reviewed historical places with verified coordinates and citations:
- **Colosseum, Rome**: Flavian Amphitheatre (Britannica, UNESCO)
- **Machu Picchu, Peru**: Incan dry-stone sanctuary (UNESCO, National Geographic)
- **Parthenon, Athens**: Acropolis citadel and treasury (Acropolis Museum, Britannica)
- **Angkor Wat, Cambodia**: Hydraulic Khmer temple complex (UNESCO, Smithsonian)
- **Taj Mahal, Agra**: Makrana marble mausoleum (Archaeological Survey of India, UNESCO)

Any other location can also be searched and discovered dynamically via the live Wikipedia & SerpApi evidence pipeline.

---

## 📡 API Contract

### Search Endpoint: `GET /api/places/search?q={query}`
Returns matching curated places or dynamically discovers and extracts evidence for unindexed locations.

### Story Endpoint: `POST /api/story`
**Request Body**:
```json
{
  "placeId": "colosseum-rome",
  "mode": "past"
}
```

**Past Response**:
```json
{
  "mode": "past",
  "story": "...",
  "sources": [
    { "title": "Encyclopaedia Britannica — Colosseum", "url": "https://www.britannica.com/topic/Colosseum" }
  ],
  "evidenceStatus": "supported"
}
```

**Future Response**:
```json
{
  "mode": "future",
  "story": "...",
  "speculationLabel": "Imagined future — not a prediction",
  "assumptions": ["Ecological shifts", "Architectural preservation"]
}
```
