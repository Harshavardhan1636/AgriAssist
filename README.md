# AgriAssist: AI-Powered Crop Health Analysis

AgriAssist is a web application designed to act as a "Digital Health Twin" for a farm. It uses AI to analyze images of crops, diagnose diseases, assess severity, and forecast outbreak risks. This tool is intended to help farmers and agronomists make informed decisions to protect their crops.

## Key Features

- **Multimodal & Multilingual Analysis:** Upload an image, record a voice note, or type a description in your local language to get a comprehensive health analysis.
- **Disease Classification & Severity Assessment:** The AI model identifies potential diseases, provides confidence scores, and estimates the extent of damage.
- **Explainable AI (XAI):** Uses Grad-CAM heatmaps to visualize which parts of the image the AI focused on for its diagnosis, building farmer trust.
- **Risk Forecasting:** Provides a 7-day outbreak risk score based on various data points to enable preventive action.
- **Community Outbreak Alerts:** Features a live, interactive map showing reported disease outbreaks in the region, helping farmers stay informed about local threats.
- **Ethical & Smart Marketplace:** An integrated store recommends safe, government-approved, and organic-first products based on the specific crop diagnosis. Includes a map to find local retailers.
- **Analysis History & Review Queue:** Browse all past analyses and flag low-confidence predictions for expert review by an agronomist.

## Tech Stack

This project is built on the following technologies:

- **Frontend:** [Next.js](https://nextjs.org/) (with App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI:** [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Generative AI:** [Google's Gemini models](https://deepmind.google/technologies/gemini/) accessed via [Genkit](https://firebase.google.com/docs/genkit).
- **Charting & Mapping:** [Recharts](https://recharts.org/), [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/)
- **Hosting:** Prepared for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- An environment variable `GEMINI_API_KEY` with a valid API key for the Gemini models.

### Running the Development Server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the root directory and add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
