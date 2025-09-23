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
  - **`analyze/`**: Contains the logic and UI for uploading an image and viewing the analysis results. The core server-side logic is in `actions.ts`.
  - **`history/`**: The page for viewing past analyses.
  - **`review/`**: The page for agronomists to review low-confidence AI predictions.
  - **`community/`**: The page for visualizing community-reported outbreaks on a map.
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

## Business Logic Flow

The primary user workflow is the **Image Analysis Flow**:

1.  A user provides input (image, text, or audio) in the UI (`src/app/dashboard/analyze/analysis-view.tsx`).
2.  The form submission triggers the `analyzeImage` server action in `src/app/dashboard/analyze/actions.ts`.
3.  The `analyzeImage` action orchestrates multiple calls to different AI flows defined in `src/ai/flows/`.
    - It first calls `classifyPlantDisease` (or `diagnoseWithText`) to get the disease name.
    - It then runs `assessDiseaseSeverity`, `explainClassificationWithGradCAM`, `forecastOutbreakRisk`, and `generateRecommendations` in parallel.
4.  The aggregated result is returned to the client.
5.  The `AnalysisResults` component (`src/app/dashboard/analyze/analysis-results.tsx`) receives the data and displays it to the user.
