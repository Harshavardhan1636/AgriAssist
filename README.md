# AgriAssist: AI-Powered Crop Health Analysis

AgriAssist is a web application designed to act as a "Digital Health Twin" for a farm. It uses AI to analyze images of crops, diagnose diseases, assess severity, and forecast outbreak risks. This tool is intended to help farmers and agronomists make informed decisions to protect their crops.

## Key Features

- **Multimodal & Multilingual Analysis:** Upload an image, record a voice note, or type a description in your local language to get a comprehensive health analysis.
- **Disease Classification & Severity Assessment:** The AI model identifies potential diseases, provides confidence scores, and estimates the extent of damage.
- **Explainable AI (XAI):** Uses Grad-CAM heatmaps to visualize which parts of the image the AI focused on for its diagnosis, building farmer trust.
- **Risk Forecasting:** Provides a 7-day outbreak risk score based on various data points to enable preventive action.
- **Community Outbreak Alerts:** Features a live, interactive map showing reported disease outbreaks in the region, helping farmers stay informed about local threats.
- **Ethical & Smart Marketplace:** An integrated store recommends safe, government-approved, and organic-first products based on the specific crop diagnosis. Includes a map to find local retailers.
- **Persistent AI Conversations:** Every analysis creates a dedicated chat session. Farmers can ask follow-up questions and refer back to the conversation days later, creating an ongoing relationship with their AI assistant.
- **Analysis History & Review Queue:** Browse all past analyses and flag low-confidence predictions for expert review by an agronomist, creating a continuous learning loop.

## Tech Stack

This project is built on the following technologies:

- **Frontend:** [Next.js](https://nextjs.org/) (with App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI:** [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Generative AI:** [Google's Gemini models](https://deepmind.google/technologies/gemini/) accessed via [Genkit](https://firebase.google.com/docs/genkit).
- **Charting & Mapping:** [Recharts](https://recharts.org/), [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/)
- **Hosting:** Prepared for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Backend Architecture Blueprint

This project is a fully-featured frontend prototype. The following is a detailed specification for the backend required to make it a production-ready application.

### 1. Core Backend Services & User Management
- **Authentication**: Use Firebase Authentication for email/password-based user management (farmers, agronomists).
- **Database (Firestore)**: Use Firestore to store user profiles, analysis results, AI conversations, product catalogs, orders, community disease reports, and the expert review queue.

### 2. AI Analysis Pipeline
- **Custom AI Models**: Train and deploy a custom computer vision model (e.g., on Vertex AI) for disease classification from leaf images. The model should also generate Grad-CAM heatmaps.
- **Orchestration**: A central Cloud Function (`analyzeImage`) should manage the entire analysis workflow:
    1.  Receive user input (image, text, or audio).
    2.  Call the AI model for diagnosis.
    3.  If confidence is low, add the case to the `review_queue` in Firestore.
    4.  Trigger parallel AI flows for severity assessment, risk forecasting, and treatment recommendations.
    5.  Save the complete result to the `analyses` collection.
    6.  Create a corresponding persistent chat in the `conversations` collection.

### 3. Real-time Data & Alerts
- **Weather & Soil Data**: Integrate with external APIs (e.g., OpenWeatherMap, agricultural data providers) to fetch real-time weather forecasts and soil data based on farm location.
- **Community Outbreak System**:
    1.  Allow users to submit confirmed diagnoses as anonymous community reports.
    2.  A scheduled Cloud Function will periodically analyze these reports, using geospatial clustering to detect disease outbreaks.
    3.  When an outbreak is confirmed, use Firebase Cloud Messaging to send push notifications to users within the affected radius.

### 4. E-commerce & Recommendations
- **Smart Recommendations**: An AI flow (`recommendProducts`) will suggest suitable products from the Firestore `products` collection based on the diagnosed disease.
- **Checkout Process**: Integrate a payment gateway (e.g., Stripe, Razorpay). A Cloud Function will create a checkout session, and a webhook will listen for successful payments to finalize the order and update inventory.

### 5. Automated Review & Continuous Learning
- **Expert Review**: The frontend UI allows agronomists to review low-confidence cases. Their feedback (corrections, notes) is submitted via a Cloud Function.
- **Active Learning Loop**: The expert's verified data (image + correct label) is saved to a dedicated Google Cloud Storage bucket. This data is then used to periodically retrain the AI model, which is then redeployed, continuously improving its accuracy over time.

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
