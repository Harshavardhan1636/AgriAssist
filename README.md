
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

### **Phase 0: Foundational Services**

This phase covers the immediate backend requirements to power the features already built in the prototype.

#### **1. Core Backend Services & User Management**
- **Authentication**: Use Firebase Authentication for email/password-based user management (farmers, agronomists).
- **Database (Firestore)**: Use Firestore to store user profiles, analysis results, AI conversations, product catalogs, orders, community disease reports, and the expert review queue.

#### **2. AI Analysis Pipeline**
- **Custom AI Models**: Train and deploy a custom computer vision model (e.g., on Vertex AI) for disease classification from leaf images. The model should also generate Grad-CAM heatmaps.
- **Orchestration**: A central Cloud Function (`analyzeImage`) should manage the entire analysis workflow:
    1.  Receive user input (image, text, or audio).
    2.  Call the AI model for diagnosis.
    3.  If confidence is low, add the case to the `review_queue` in Firestore.
    4.  Trigger parallel AI flows for severity assessment, risk forecasting, and treatment recommendations.
    5.  Save the complete result to the `analyses` collection.
    6.  Create a corresponding persistent chat in the `conversations` collection.

#### **3. Real-time Data & Alerts**
- **Weather & Soil Data**: Integrate with external APIs (e.g., OpenWeatherMap, agricultural data providers) to fetch real-time weather forecasts and soil data based on farm location.
- **Community Outbreak System**:
    1.  Allow users to submit confirmed diagnoses as anonymous community reports.
    2.  A scheduled Cloud Function will periodically analyze these reports, using geospatial clustering to detect disease outbreaks.
    3.  When an outbreak is confirmed, use Firebase Cloud Messaging to send push notifications to users within the affected radius.

#### **4. E-commerce & Recommendations**
- **Smart Recommendations**: An AI flow (`recommendProducts`) will suggest suitable products from the Firestore `products` collection based on the diagnosed disease.
- **Checkout Process**: Integrate a payment gateway (e.g., Stripe, Razorpay). A Cloud Function will create a checkout session, and a webhook will listen for successful payments to finalize the order and update inventory.

#### **5. Automated Review & Continuous Learning**
- **Expert Review**: The frontend UI allows agronomists to review low-confidence cases. Their feedback (corrections, notes) is submitted via a Cloud Function.
- **Active Learning Loop**: The expert's verified data (image + correct label) is saved to a dedicated Google Cloud Storage bucket. This data is then used to periodically retrain the AI model, which is then redeployed, continuously improving its accuracy over time.

---

### **Phase 1: Deepening the Digital Twin**

This phase focuses on enriching the core "Digital Health Twin" by integrating robust, real-time data sources and predictive models.

#### **1. Real-Time Sensor & IoT Integration 📡**
- **Description**: Implement a feature allowing farmers to connect AgriAssist to low-cost **IoT (Internet of Things)** devices like soil moisture, pH, and temperature sensors.
- **Implementation**:
  - **Backend**: Create an API gateway (using MQTT or HTTP) to ingest high-volume sensor data into a time-series database (e.g., InfluxDB).
  - **Frontend**: Develop a dashboard `(/dashboard/iot)` to visualize real-time data. Create an alert system `(/dashboard/alerts)` for custom thresholds.
  - **Integration**: Feed this live data into the **Risk Forecasting** and **Recommendation** engines to make advice hyper-specific (e.g., "Irrigate Zone B, soil moisture at 15%").

#### **2. Satellite Imagery & Drone Analytics 🛰️**
- **Description**: Integrate APIs from satellite services (e.g., Sentinel-2) and drone analytics platforms to provide a macro-level health overview of the entire farm.
- **Implementation**:
  - **Backend**: Use Google Earth Engine to process satellite imagery and calculate vegetation indices (NDVI, EVI) to identify stress zones.
  - **Frontend**: Create a geo-spatial map view `(/dashboard/map)` overlaying indices as heatmaps, allowing farmers to monitor farm health at a glance.
  - **Integration**: A drop in NDVI in a specific field can trigger an alert, suggesting a closer look with the standard AI analysis tool.

---

### **Phase 2: Empowering the Ecosystem**

This phase expands functionality to connect the farmer to the broader agricultural supply chain, increasing transparency and market access.

#### **1. Blockchain-Based Traceability & Supply Chain Integration ⛓️**
- **Description**: Use **blockchain technology** to create an immutable digital ledger from farm to fork, ensuring **farm-to-consumer transparency**.
- **Implementation**:
  - **Blockchain**: Use a platform like Hyperledger Fabric to design smart contracts for key events (planting, fertilization, harvesting).
  - **Frontend**: Develop an interface `(/dashboard/trace)` for farmers to log events. Generate a unique **QR code** for each produce batch that consumers can scan to see its full history, including AgriAssist health reports.
  - **Integration**: The ledger will automatically pull verified data from the Digital Health Twin.

#### **2. Integrated Agri-Fintech Solutions 💳**
- **Description**: Seamlessly integrate financial services (micro-lending, insurance) based on the farm's verified Digital Twin data.
- **Implementation**:
  - **Backend**: Partner with financial institutions via APIs. Build a credit-scoring model based on the farm's historical yield, risk profile, and resource management records.
  - **Frontend**: Create a section `(/dashboard/finance)` where farmers can apply for loans or insurance with pre-filled, verified data from their farm's performance.

---

### **Phase 3: The Ultimate Learning & Automation Engine**

This final phase makes the Digital Twin a truly autonomous and self-improving assistant.

#### **1. Generative AI for Personalized Crop Plans 🤖**
- **Description**: Use **Generative AI** to create a complete, personalized, and dynamic crop cultivation plan from sowing to harvesting, tailored to the farm's unique conditions.
- **Implementation**:
  - **AI Model**: Fine-tune an LLM with agricultural best practices, government guidelines, and your own collected data.
  - **Backend**: Develop a service that takes inputs from the Digital Twin (soil, weather, crop type) and generates a detailed, week-by-week cultivation plan.
  - **Frontend**: Create an interface `(/dashboard/plan)` to display the plan and allow farmers to provide feedback for retraining the model.

#### **2. "Digital Twin Sandbox" Simulation 🧪**
- **Description**: Create a simulation environment where farmers can test the impact of different decisions (e.g., "What if I use Fertilizer X vs. Y?") and see predicted outcomes on yield, cost, and risk.
- **Implementation**:
  - **Backend**: Build a predictive modeling engine that uses the Digital Twin's data as a baseline to simulate variables like nutrient uptake, pest spread, and water consumption.
  - **Frontend**: Design an interactive UI `(/dashboard/sandbox)` where a farmer can input variables and see a side-by-side comparison of the projected outcomes.


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
