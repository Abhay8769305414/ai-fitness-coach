import { NextResponse } from 'next/server';

// Define models - use environment variables with fallbacks
const IMAGEN_MODEL = process.env.IMAGEN_MODEL || "imagen-3.0-generate-002";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-nano-banana";

export async function POST(request: Request) {
  try {
    const { prompt, model = GEMINI_MODEL } = await request.json();

    if (!prompt) {
      return new NextResponse(
        JSON.stringify({ error: "Prompt is required." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      // If API key is missing, return a placeholder image using Vercel-friendly domain
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/600x400/purple/white?text=${encodeURIComponent(prompt)}`
      });
    }

    // Use the specified model (default to Gemini Nano Banana)
    const selectedModel = model === GEMINI_MODEL ? GEMINI_MODEL : IMAGEN_MODEL;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    // Prepare payload based on model
    let payload;
    if (selectedModel === GEMINI_MODEL) {
      payload = {
        contents: [{
          parts: [
            { text: "Generate an image of: " + prompt },
            { inlineData: { mimeType: "image/jpeg" } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      };
    } else {
      payload = {
        instances: [{ prompt: prompt }],
        parameters: {
          "sampleCount": 1,
          "outputMimeType": "image/jpeg",
          "aspectRatio": "1:1"
        }
      };
    }

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      // If API fails, return a placeholder image instead of an error
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/600x400/purple/white?text=${encodeURIComponent(prompt)}`
      });
    }

    const result = await apiResponse.json();
    
    // Extract image data based on model
    let imageData;
    if (selectedModel === GEMINI_MODEL) {
      imageData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } else {
      imageData = result.predictions?.[0]?.bytesBase64Encoded;
    }

    if (!imageData) {
      // If no image data, return a placeholder
      return NextResponse.json({
        imageUrl: `https://via.placeholder.com/600x400/purple/white?text=${encodeURIComponent(prompt)}`
      });
    }

    // Return the base64 image data
    return NextResponse.json({
      imageUrl: `data:image/jpeg;base64,${imageData}`
    });

  } catch (error) {
    console.error("Error in generate-image API:", error);
    
    // Return a placeholder image on error
    return NextResponse.json({
      imageUrl: `https://via.placeholder.com/600x400/purple/white?text=Error+Generating+Image`
    });
  }
}