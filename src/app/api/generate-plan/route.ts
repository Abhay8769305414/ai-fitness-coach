// src/app/api/generate-plan/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import Ajv, { JSONSchemaType } from "ajv";

// Initialize Gemini client
const ai = new GoogleGenAI({});

// Type definitions
interface Exercise { exercise: string; sets: string; reps: string; rest: string; }
interface WorkoutDay { day: string; focus: string; routine: Exercise[]; }
interface Meal { meal: string; calories: string; items: string[]; }
interface AITips { posture: string; lifestyle: string; }
interface GeneratedPlan {
  workout_plan: WorkoutDay[];
  diet_plan: Meal[];
  ai_tips: AITips;
}

// JSON schema (compatible with GeneratedPlan)
const PLAN_SCHEMA: JSONSchemaType<GeneratedPlan> = {
  type: "object",
  properties: {
    workout_plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          focus: { type: "string" },
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
              additionalProperties: true,
            },
          },
        },
        required: ["day", "focus", "routine"],
        additionalProperties: true,
      },
    },
    diet_plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          meal: { type: "string" },
          calories: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["meal", "calories", "items"],
        additionalProperties: true,
      },
    },
    ai_tips: {
      type: "object",
      properties: {
        posture: { type: "string" },
        lifestyle: { type: "string" },
      },
      required: ["posture", "lifestyle"],
      additionalProperties: true,
    },
  },
  required: ["workout_plan", "diet_plan", "ai_tips"],
  additionalProperties: true,
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePlan = ajv.compile(PLAN_SCHEMA);

export async function POST(req: Request) {
  try {
    const userData = await req.json().catch(() => null);
    if (!userData) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const prompt = `
      Generate a highly personalized 7-day fitness plan and a 1-day sample diet plan based on the following user details.

      User Details:
      - Name: ${String(userData.name ?? "Unknown")}
      - Age: ${String(userData.age ?? "Unknown")}
      - Gender: ${String(userData.gender ?? "Unknown")}
      - Height: ${String(userData.height_cm ?? "Unknown")} cm
      - Weight: ${String(userData.weight_kg ?? "Unknown")} kg
      - Fitness Goal: ${String(userData.fitness_goal ?? "General fitness")}
      - Fitness Level: ${String(userData.fitness_level ?? "Beginner")}
      - Workout Location: ${String(userData.workout_location ?? "Home")}
      - Dietary Preference: ${String(userData.dietary_preference ?? "None")}
      - Optional Notes/Limitations: ${String(userData.optional_notes ?? "None")}

      Constraints:
      1. Workout Plan: Must be a 7-day schedule. Use a structured split appropriate for the goal and level. Include at least one rest day. Ensure exercises suit the Workout Location (${String(userData.workout_location ?? "Home")}). 
      2. Diet Plan: Provide one full day of eating (Breakfast, Snack, Lunch, Dinner, Snack) with estimated calories, respecting Dietary Preference (${String(userData.dietary_preference ?? "None")}) and supporting the Fitness Goal (${String(userData.fitness_goal ?? "General fitness")}).
      3. AI Tips: Provide specific tips on Posture and Lifestyle/Motivation.

      Output MUST be a single JSON object that strictly follows the provided JSON schema. DO NOT include any text outside the JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PLAN_SCHEMA,
      },
    });

    let bodyText: string | undefined;

    if (!response) {
      console.error("No response returned from Gemini client");
      return NextResponse.json({ success: false, error: "No response from AI service" }, { status: 502 });
    }

    if (typeof (response as any).text === "function") {
      try {
        bodyText = await (response as any).text();
      } catch (err) {
        console.error("Failed to read response.text() from Gemini client:", err);
        bodyText = undefined;
      }
    } else if (typeof (response as any).text === "string") {
      bodyText = (response as any).text;
    } else if (Array.isArray((response as any).outputs) && (response as any).outputs.length > 0) {
      const firstOutput = (response as any).outputs[0];
      if (firstOutput && typeof firstOutput.text === "string") {
        bodyText = firstOutput.text;
      } else if (firstOutput && typeof firstOutput.content === "string") {
        bodyText = firstOutput.content;
      }
    }

    if (!bodyText || typeof bodyText !== "string" || bodyText.trim().length === 0) {
      console.error("Empty or missing text in Gemini response.", { response });
      return NextResponse.json({ success: false, error: "Empty response from AI service" }, { status: 502 });
    }

    const trimmed = bodyText.trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      console.error("Failed to parse JSON from Gemini response:", err, "body:", trimmed);
      return NextResponse.json({ success: false, error: "AI returned invalid JSON" }, { status: 502 });
    }

    const valid = validatePlan(parsed as GeneratedPlan);
    if (!valid) {
      console.error("Plan validation failed:", validatePlan.errors);
      return NextResponse.json(
        { success: false, error: "AI returned JSON that does not match the expected schema", details: validatePlan.errors },
        { status: 502 }
      );
    }

    const plan = parsed as GeneratedPlan;
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ success: false, message: "Failed to generate plan." }, { status: 500 });
  }
}
