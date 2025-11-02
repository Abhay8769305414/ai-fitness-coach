🏋️ AI Fitness Coach App

An advanced, full-stack fitness assistant built on Next.js, powered by Google's Gemini LLM and Imagen 3.0 for personalized workout plans, diet regimes, and visual guidance. The application includes user authentication and persistent plan storage using Firebase Firestore.

✨ Features

Personalized Plan Generation: Users input their goals, fitness levels, diet, and equipment (Home/Gym) to generate completely custom 7-day workout plans and daily diet breakdowns using Gemini.

Persistent Storage: Generated plans are securely saved and loaded for authenticated users using Firebase Firestore.

Visual Aid (AI Image Generation): Clicking on any exercise or meal generates a realistic, high-quality image of the exercise form or the food using Imagen 3.0.

Voice Features: Option to play back the workout and diet plans using the browser's Text-to-Speech (TTS) API.

Daily Motivation: Fetches a fresh, AI-generated motivational quote daily.

Responsive UI: Built with Tailwind CSS and Shadcn UI for a smooth, modern, and adaptive experience on all devices.

Theme Toggle: Supports Dark and Light mode.

💻 Tech Stack

The application is built on a robust, full-stack architecture leveraging the following key technologies:

Frontend: Next.js (App Router), React, TypeScript.

Purpose: Full-stack framework, routing, and component architecture.

Styling & UI: Tailwind CSS, Shadcn UI.

Purpose: Utility-first styling and robust, accessible UI components.

Generative AI (LLM): Gemini.

Purpose: Generating structured Workout, Diet, and Motivational Plans.

Image AI: Imagen 3.0 (via Canvas API).

Purpose: Visualizing exercises and meals on demand.

Database: Firebase Firestore.

Purpose: Secure, real-time storage for user data and saved plans.

Authentication: Firebase Auth (Custom Token).

Purpose: Authentication management for persistent user sessions.

⚙️ Setup and Installation

Follow these steps to get a copy of the project running on your local machine.

Prerequisites

Node.js (version 18 or later)

npm

A Gemini API Key (from Google AI Studio or Google Cloud)

A Firebase Project (or access to the Canvas environment)

Step 1: Clone and Install

# Clone the repository
git clone [YOUR_REPO_URL] ai-fitness-coach-app
cd ai-fitness-coach-app

# Install all dependencies (Next.js, Firebase, Gen AI, UI libs)
npm install


Step 2: Configure Environment Variables

Create a file named .env.local in the root of your project directory (ai-fitness-coach-app/) and add your API key.

# .env.local

# Your Gemini API Key for server-side use in API Routes
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# NOTE: Firebase configuration is handled automatically by the Canvas environment.
# If running locally, you must provide the firebaseConfig JSON string here.
# __firebase_config='{...}'


Step 3: Run the Development Server

Start the application using the Next.js development script:

npm run dev


The application will be accessible at http://localhost:3000.

📌 Development Notes

API Endpoints

/api/generate-plan (POST): Calls Gemini to generate the structured plan based on user input.

/api/daily-quote (GET): Fetches a new motivational quote from Gemini.

Firestore Structure

The application uses the security rules defined in the Canvas environment, storing data under:

/artifacts/{appId}/users/{userId}/plans/{planId}

Plans are stored with metadata (name, goal, level) and the full AI-generated plan object is serialized as a JSON string in the document.