import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// 1. Initialize the GoogleGenAI client
// It automatically picks up the GEMINI_API_KEY from environment variables.
const ai = new GoogleGenAI({});

// 2. Define the expected JSON structure for the LLM output
const PLAN_SCHEMA = {
  type: "object",
  properties: {
    workout_plan: {
      type: "array",
      description: "A 7-day workout schedule with exercises, sets, reps, and rest.",
      items: {
        type: "object",
        properties: {
          day: { type: "string", description: "Day number or 'Rest'." },
          focus: { type: "string", description: "The muscle group or activity." },
          routine: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                sets: { type: "string" },
                reps: { type: "string" },
                rest: { type: "string" },
              },
              required: ["exercise", "sets", "reps", "rest"],
            },
          },
        },
        required: ["day", "focus", "routine"],
      },
    },
    diet_plan: {
      type: "array",
      description: "A one-day sample diet plan with meals and calories.",
      items: {
        type: "object",
        properties: {
          meal: { type: "string", description: "Breakfast, Lunch, Dinner, Snack etc." },
          calories: { type: "string", description: "Approximate calorie count." },
          items: {
            type: "array",
            items: { type: "string" },
            description: "List of food items in the meal.",
          },
        },
        required: ["meal", "calories", "items"],
      },
    },
    ai_tips: {
      type: "object",
      description: "Motivational and posture tips.",
      properties: {
        posture: { type: "string" },
        lifestyle: { type: "string" },
      },
      required: ["posture", "lifestyle"],
    },
  },
  required: ["workout_plan", "diet_plan", "ai_tips"],
};

export async function POST(req: Request) {
  try {
    const userData = await req.json();

    // 3. Construct the detailed prompt based on user input
    const prompt = `
      Generate a highly personalized 7-day fitness plan and a 1-day sample diet plan based on the following user details.
      
      User Details:
      - Name: ${userData.name}
      - Age: ${userData.age}
      - Gender: ${userData.gender}
      - Height: ${userData.height_cm} cm
      - Weight: ${userData.weight_kg} kg
      - Fitness Goal: ${userData.fitness_goal}
      - Fitness Level: ${userData.fitness_level}
      - Workout Location: ${userData.workout_location}
      - Dietary Preference: ${userData.dietary_preference}
      - Optional Notes/Limitations: ${userData.optional_notes}

      Constraints:
      1. **Workout Plan:** Must be a 7-day schedule. Use a structured split appropriate for the goal and level. Must include one rest day. Ensure exercises are suitable for the **Workout Location** (${userData.workout_location}).
      2. **Diet Plan:** Provide one full day of eating (Breakfast, Snack, Lunch, Dinner, Snack) with estimated calories for each meal, ensuring it respects the **Dietary Preference** (${userData.dietary_preference}) and supports the **Fitness Goal** (${userData.fitness_goal}).
      3. **AI Tips:** Provide specific tips on Posture and Lifestyle/Motivation.

      Output MUST be a single JSON object that strictly follows the provided JSON schema. DO NOT include any text outside the JSON object.
    `;

    // 4. Call the Gemini API for structured JSON output
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // A fast model suitable for structured JSON generation
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: PLAN_SCHEMA,
        }
    });

    // 5. Parse the JSON text and return
    const plan = JSON.parse(response.text.trim());

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate plan." },
      { status: 500 }
    );
  }
}
