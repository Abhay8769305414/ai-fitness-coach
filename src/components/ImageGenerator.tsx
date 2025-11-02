"use client";

import React, { useState } from "react";
import { Loader2, Image as ImageIcon, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageGeneratorProps {
  prompt: string;
}

// Utility function to make the API call to our local endpoint
const generateImage = async (prompt: string): Promise<string> => {
  try {
    console.log("Generating image for prompt:", prompt);
    // Using Gemini Nano Banana for image generation
    const response = await fetch('/api/generate-image', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: prompt,
        model: process.env.NEXT_PUBLIC_IMAGE_MODEL || "gemini-nano-banana" // Use environment variable with fallback
      }),
    });

    if (!response.ok) {
      console.error("API Error:", response.status);
      throw new Error(`API failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Image generation successful");
    return result.imageUrl;

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred during image generation.';
    console.error("Error during image fetch:", error);
    
    // Fallback to placeholder image if API fails - using Vercel-friendly placeholder
    return `https://via.placeholder.com/600x400/purple/white?text=${encodeURIComponent(prompt)}`;
  }
};


export default function ImageGenerator({ prompt }: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Function to handle the image generation process
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    
    // Create a detailed prompt for a realistic style
    const detailedPrompt = `A highly detailed, realistic, high-quality photograph of: ${prompt}. Cinematic lighting, depth of field, studio quality.`;

    const url = await generateImage(detailedPrompt);
    
    if (url) {
      setImageUrl(url);
    } else {
      setError("Failed to generate image. Please try again.");
    }
    setIsLoading(false);
  };

  // Generate image immediately when component mounts
  React.useEffect(() => {
    if (!imageUrl && !isLoading && !error) {
      handleGenerate();
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when closing the dialog
        setImageUrl(null);
        setError(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          disabled={isLoading}
          onClick={() => setOpen(true)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              <span>Visual Aid</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exercise Visualization</DialogTitle>
          <DialogDescription>
            AI-generated visual representation of the exercise.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="AI generated exercise visualization" 
              className="rounded-md max-h-[500px] object-contain"
            />
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your image...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-red-500 text-center">{error}</p>
              <Button onClick={handleGenerate} className="gap-2 mt-2">
                <Zap className="h-4 w-4" />
                Regenerate Image
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Button onClick={handleGenerate} className="gap-2">
                <Zap className="h-4 w-4" />
                Generate Image
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}