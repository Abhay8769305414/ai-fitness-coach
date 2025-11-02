"use client";

import React, { useState } from "react";
import Image from "next/image"; // Required for next/image component
import { Loader2, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Using official alias (best practice)
import { Button } from "@/components/ui/button"; // Using official alias

// Interface for component props
interface ImageGeneratorProps {
  prompt: string;
}

// Function to convert raw base64 to a data URL
const base64ToDataUrl = (base64Data: string): string => {
  return `data:image/png;base64,${base64Data}`;
};

// Custom fetch hook with exponential backoff for API calls
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }

            // Handle API specific errors without retrying (e.g., bad request)
            if (response.status >= 400 && response.status < 500) {
                const errorBody = await response.json();
                console.error("API Error (No Retry):", errorBody);
                throw new Error(errorBody.error?.message || "Server Error");
            }
            
            // For other server errors, proceed to retry
            const delay = Math.pow(2, i) * 1000;
            console.warn(`Attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));

        } catch (e) {
            // e is typed as Error from fetchWithRetry now
            if (i === retries - 1) throw e; 
            const delay = Math.pow(2, i) * 1000;
            console.warn(`Fetch failed. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Failed to fetch data after multiple retries.");
};


// Component to generate and display the image
export function ImageGenerator({ prompt }: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to call the Imagen API via a generic predictor endpoint
  const generateImage = async () => {
    if (imageUrl) return; // Don't regenerate if image already exists

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    // Prompt enhancement for better visuals
    const fullPrompt = `${prompt}, high quality, realistic photo, hyper detailed, 4k, clean background, no text`;
    
    // Using imagen-3.0-generate-002 model
    const apiKey = ""; // API key is provided by the Canvas environment

    const payload = {
        instances: { prompt: fullPrompt },
        parameters: { "sampleCount": 1 }
    };
    
    // Using the predictor endpoint for Imagen 3.0
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    try {
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;

        if (base64Data) {
            setImageUrl(base64ToDataUrl(base64Data));
        } else {
            console.error("API response missing image data:", result);
            setError("Image generation failed. Missing data in API response.");
        }
    } catch (e) {
        // e is typed as Error from fetchWithRetry now
        setError(`Failed to generate image: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open: boolean) => {
        // Auto-trigger generation when the dialog is opened for the first time
        if (open && !imageUrl && !isLoading) {
            generateImage();
        }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-blue-500 hover:bg-blue-100"
        >
          [Visual Aid]
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle>Visual Aid: {prompt}</DialogTitle>
          <DialogDescription>
            AI-generated visualization to assist with form or meal preparation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 min-h-96 w-full">
          {isLoading && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-3" />
              <p className="text-sm text-muted-foreground">Generating image...</p>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center">
              <p>Error: {error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Ensure your API key is correct and Vercel has the GEMINI_API_KEY environment variable set.
              </p>
            </div>
          )}
          {imageUrl && (
            <div className="relative w-full h-full max-h-[600px] aspect-square rounded-lg overflow-hidden shadow-2xl border">
                {/* Vercel Fix: The 'sizes' prop is mandatory for next/image */}
                <Image
                    src={imageUrl}
                    alt={`AI-generated image for ${prompt}`}
                    fill
                    style={{ objectFit: 'contain' }}
                    // MANDATORY FIX for Vercel deployment error "images missing required property sizes"
                    sizes="(max-width: 768px) 100vw, 50vw" 
                    className="rounded-lg"
                    unoptimized // Required for base64 data URLs
                />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
