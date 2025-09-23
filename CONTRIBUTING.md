# Contributing to AgriAssist

We welcome contributions! This document provides a guide to the project's structure to help you get started.

## Project Structure

The project follows the standard Next.js App Router structure. Here's an overview of the most important directories:

### `src/app`

This directory contains all the routes and UI pages of the application.

- **`src/app/layout.tsx`**: The root layout of the application.
- **`src/app/page.tsx`**: The home page, which redirects to the login or dashboard.
- **`src/app/login/page.tsx`**: The user login page.
- **`src/app/dashboard/`**: This is the main section of the application, containing the user-facing dashboard and its sub-pages.
  - **`layout.tsx`**: The primary layout for the dashboard area, including the sidebar and header.
  - **`page.tsx`**: The main dashboard overview page.
  - **`analyze/`**: Contains the logic and UI for providing input (image, text, audio) and viewing the analysis results. The core server-side logic is in `actions.ts`.
  - **`history/`**: The page for viewing past analyses.
  - **`conversations/`**: The section for viewing and continuing past AI chat sessions.
  - **`review/`**: The page for agronomists to review low-confidence AI predictions.
  - **`community/`**: The page for visualizing community-reported outbreaks on a map.
  - **`forecast/`**: The page for viewing detailed weather forecasts and soil data.
  - **`store/`**: The e-commerce section for recommended products and a retailer map.
  - **`settings/`**: The user settings page for profile, appearance, and language.

### `src/ai`

This directory contains all the generative AI logic, organized into flows using Genkit.

- **`src/ai/genkit.ts`**: Initializes and configures the main Genkit `ai` object.
- **`src/ai/flows/`**: Each file in this directory defines a specific, self-contained AI task (a "flow"). For example, `classify-plant-disease.ts` is responsible for calling the AI model to identify a disease from an image. This separation makes the AI logic modular and easy to understand.

### `src/components`

This directory contains all reusable React components.

- **`src/components/ui/`**: Contains the base UI components from the [shadcn/ui](https://ui.shadcn.com/) library (e.g., `Button`, `Card`, `Input`).
- **`src/components/app-sidebar.tsx`**: The main application sidebar.
- **`src/components/header.tsx`**: The top header bar.

### `src/lib`

This directory is for shared utilities, type definitions, and mock data.

- **`src/lib/types.ts`**: Contains all major TypeScript type definitions used throughout the application. This file is crucial for understanding the data structures.
- **`src/lib/utils.ts`**: General utility functions.
- **`src/lib/mock-data.ts`**: Provides mock data for populating the UI in a development environment.
- **`src/lib/placeholder-images.json`**: Contains all placeholder image data used in the app.

### `src/context`
This directory holds React context providers for managing global state.
- **`src/context/auth-context.tsx`**: Manages user authentication state.
- **`src/context/i18n-context.tsx`**: Manages internationalization and language state.
- **`src/context/cart-context.tsx`**: Manages the state of the e-commerce shopping cart.

## Business Logic Flows

### Primary Analysis Flow
1.  A user provides input (image, text, or audio) on the **Analyze** page (`src/app/dashboard/analyze/analysis-view.tsx`).
2.  The `analyzeImage` server action (`actions.ts`) orchestrates calls to multiple AI flows in `src/ai/flows/`.
3.  It first gets a disease classification (`classifyPlantDisease` or `diagnoseWithText`).
4.  It then runs several other flows in parallel (`assessDiseaseSeverity`, `forecastOutbreakRisk`, `explainClassificationWithGradCAM`, and `generateRecommendations`).
5.  The aggregated result is returned to the client and displayed in the `AnalysisResults` component.
6.  Simultaneously, a new persistent conversation is created and accessible from the **AI Conversations** page.

### AI Conversation Flow
1.  After an analysis, a user can ask follow-up questions in the "Conversational Assistant" widget.
2.  Each chat is linked to its original analysis.
3.  Users can navigate to the **AI Conversations** page (`/dashboard/conversations`) to see a history of all their chats.
4.  Clicking a chat opens a dedicated view (`/dashboard/conversations/[id]`) where they can read past messages and continue the conversation at any time.

### Shopping & Checkout Flow
1.  The user visits the **Store** page (`/dashboard/store`), which displays recommended products.
2.  The `addToCart` function, managed by `cart-context.tsx`, is called when a user clicks the "Add to Cart" button.
3.  A toast notification confirms the item was added. The cart icon in the header updates with a count.
4.  The user opens the cart `Sheet`, reviews items, and clicks "Proceed to Checkout."
5.  The checkout is simulated, a confirmation toast is shown, and the cart is cleared.

### Agronomist Review Flow
1.  Low-confidence AI predictions are automatically added to the **Review Queue**.
2.  An expert navigates to the `review/` page, which presents one case at a time.
3.  The expert can either "Approve AI" or "Submit Correction" with a new label and notes.
4.  This feedback is logged, and the UI moves to the next case in the queue, simulating a continuous learning loop.
