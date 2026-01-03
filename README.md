# Chatterbots: Multimodal Live API Agent

> **Note**: This is an enhanced fork of the original [Google AI Studio Multimodal Live API starter](https://github.com/google-gemini/multimodal-live-api-web-console), designed to demonstrate real-time interaction with Gemini's multimodal capabilities.

This project takes the robust foundation provided by Google and introduces significant improvements in character animation, language support, and agent diversity, transforming it into a more capable and expressive interactive experience.

## ✨ Key Enhancements

This repository includes several major upgrades over the original codebase:

* **👄 Advanced Lip Sync**: Custom audio analysis system using **Adobe Character Animator inspired visemes** with **14 High-Quality SVG mouth shapes**. This allows for fluid and expressive mouth movements that sync perfectly with the AI's audio output.
* **🌍 Multilingual Support**: Seamless support for multiple languages. The agents are now capable of conversing fluently in Spanish, English, and other languages.
* **🤖 Expanded Agent Library**: Added a variety of custom agent presets and personalities (see `lib/presets/agents.ts`), each with unique system instructions and behaviors.
* **⚡ Modernized API**: Refactored the integration to use the latest **`@google/genai`** SDK (v1.29+), ensuring better performance, stability, and access to the newest model features.

## 🛠️ Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* A Google Gemini API Key

### Installation

1. **Clone the repository**
2. **Install dependencies**:

    ```bash
    npm install
    ```

    *Note: This will install `@google/genai` and other necessary packages.*

3. **Configure Environment**:
    Create a `.env` file in the root directory and add your API key:

    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4. **Run Locally**:

    ```bash
    npm run dev
    ```

    Open your browser to `http://localhost:5173` (or the port shown in your terminal).

## 📦 Deployment (Netlify / Vercel)

This project is built with **Vite** and is fully compatible with static hosting platforms.

### Deploying to Netlify

1. Connect your repository to Netlify.
2. **Build Command:** `npm run build`
3. **Publish Directory:** `dist`
4. **⚠️ IMPORTANT:** Go to **Site Settings > Environment Variables** and add your `GEMINI_API_KEY`.
    * *Why?* The Vite build process reads this key to embed it into the application, allowing the client-side browser code to authenticate directly with Google's servers.

## 📄 License & Attribution

This project is open-source software:

* **Original Code**: Copyright 2024 Google LLC. Licensed under the Apache License, Version 2.0.
* **Modifications**: Released under the same Apache License, Version 2.0.

See [LICENSE](LICENSE) for more details.
