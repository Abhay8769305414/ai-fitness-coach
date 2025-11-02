"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, RefreshCw, PenTool, Speaker, Zap, Image as ImageIcon } from "lucide-react";
 // Using default import

// --- Type Definitions ---
interface Exercise {
  exercise: string;
  sets: string;
  reps: string;
  rest: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  routine: Exercise[];
}

interface Meal {
  meal: string;
  calories: string;
  items: string[];
}

interface AITips {
  posture: string;
  lifestyle: string;
}

interface GeneratedPlan { 
    workout_plan: WorkoutDay[]; 
    diet_plan: Meal[]; 
    ai_tips: AITips; 
}

interface PlanDisplayProps {
  plan: GeneratedPlan;
  onRegenerate: () => void;
  onEdit: () => void;
  onSave: () => Promise<void>; 
  // ADD THIS LINE TO FIX THE ERROR:
  dailyQuote: string; 
}

// Function to handle PDF export (MOCK implementation)
const handleExportPDF = (plan: GeneratedPlan) => {
  // Mock file download
  console.log("Mock Export: Initiating download of plan data as JSON.");
  const planData = JSON.stringify(plan, null, 2);
  const blob = new Blob([planData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'personalized_fitness_plan.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert("Mock Export: Downloaded plan as JSON. For real PDF, integrate a library like html2pdf.js!");
};

// Function for Text-to-Speech (Client-side implementation)
const handleTextToSpeech = (text: string) => {
    // Stop any currently speaking utterance
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; 
        window.speechSynthesis.speak(utterance);
    } else {
        console.error("Text-to-Speech is not supported in this browser environment.");
    }
};

// Function to show visual aid for exercises
const showVisualAid = (exerciseName: string) => {
    // Create a placeholder image URL
    const imageUrl = `https://placehold.co/600x400/purple/white?text=${encodeURIComponent(exerciseName)}`;
    
    // Open a new window with the image
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(`
            <html>
                <head>
                    <title>${exerciseName} - Visual Guide</title>
                    <style>
                        body { 
                            font-family: system-ui, sans-serif; 
                            background: #f5f5f5; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center;
                            padding: 2rem;
                        }
                        h1 { color: #6b21a8; }
                        img { 
                            max-width: 100%; 
                            border-radius: 8px; 
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                        }
                        .container {
                            max-width: 800px;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${exerciseName} - Visual Guide</h1>
                        <img src="${imageUrl}" alt="${exerciseName} demonstration" />
                        <p>This is a visual demonstration of how to perform ${exerciseName} with proper form.</p>
                    </div>
                </body>
            </html>
        `);
        newWindow.document.close();
    }
};

const WorkoutDisplay = ({ plan }: { plan: GeneratedPlan }) => (
    <Card className="shadow-2xl hover:shadow-purple-500/50 transition duration-300 plan-card">
        <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-purple-500 flex items-center">
                <Zap className="w-6 h-6 mr-2" /> Workout Plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">7-Day Personalized Routine</p>
        </CardHeader>
        <CardContent className="space-y-6">
            {plan.workout_plan.map((day, index) => (
                <div key={index} className="p-4 rounded-lg border bg-card/50 shadow-sm">
                    <h4 className={`font-bold text-lg mb-2 ${day.day.toLowerCase() === 'rest' ? 'text-green-500' : 'text-primary'}`}>
                        {day.day} - {day.focus}
                    </h4>
                    {day.day.toLowerCase() !== 'rest' && (
                        <ul className="list-disc ml-5 space-y-1">
                            {day.routine.map((ex, exIndex) => (
                                <li key={exIndex} className="text-sm">
                                    <span className="font-medium">{ex.exercise}:</span> {ex.sets} sets x {ex.reps} reps (Rest: {ex.rest})
                                    <div className="flex mt-1 space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 px-2 text-xs"
                                            onClick={() => handleTextToSpeech(`${ex.exercise}. Do ${ex.sets} sets of ${ex.reps} reps with ${ex.rest} rest between sets.`)}
                                        >
                                            <Speaker className="h-3 w-3 mr-1" /> Speak
                                        </Button>
                                        
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
            <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleTextToSpeech(plan.workout_plan.map(d => `${d.day}, focus: ${d.focus}`).join('. '))}
            >
                <Speaker className="w-4 h-4 mr-2" /> Read Full Workout Plan
            </Button>
        </CardContent>
    </Card>
);

const DietDisplay = ({ plan }: { plan: GeneratedPlan }) => (
    <Card className="shadow-2xl hover:shadow-pink-500/50 transition duration-300 plan-card">
        <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-pink-500 flex items-center">
                <Zap className="w-6 h-6 mr-2" /> Diet Plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">Sample Day Meal Breakdown</p>
        </CardHeader>
        <CardContent className="space-y-6">
            {plan.diet_plan.map((meal, index) => (
                <div key={index} className="p-4 rounded-lg border bg-card/50 shadow-sm">
                    <h4 className="font-bold text-lg mb-2 text-primary">
                        {meal.meal} <span className="text-sm font-normal text-muted-foreground">({meal.calories})</span>
                    </h4>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                        {meal.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center justify-between">
                                <span>{item}</span>
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleTextToSpeech(item)}
                                    >
                                        <Speaker className="h-3 w-3 mr-1" /> Speak
                                    </Button>
                                    
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleTextToSpeech(plan.diet_plan.map(m => `${m.meal} with ${m.items.join(', ')}`).join('. '))}
            >
                <Speaker className="w-4 h-4 mr-2" /> Read Full Diet Plan
            </Button>
        </CardContent>
    </Card>
);

const TipsDisplay = ({ tips }: { tips: AITips }) => (
    <Card className="md:col-span-2 shadow-2xl hover:shadow-cyan-500/50 transition duration-300 plan-card">
        <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-cyan-500 flex items-center">
                <Zap className="w-6 h-6 mr-2" /> AI Tips & Motivation
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h4 className="font-bold text-xl mb-2 text-cyan-500">Posture & Form</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{tips.posture}</p>
            </div>
            <div>
                <h4 className="font-bold text-xl mb-2 text-cyan-500">Lifestyle & Recovery</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{tips.lifestyle}</p>
            </div>
        </CardContent>
    </Card>
);


export function PlanDisplay({ plan, onRegenerate, onEdit, onSave }: PlanDisplayProps) {
  // Mock daily quote (to be AI-generated in a future phase)
  const dailyQuote = "Discipline is the bridge between goals and accomplishment.";
    
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
        
        {/* Header and Control Buttons */}
        <div className="flex justify-between items-center bg-card p-6 rounded-xl shadow-xl border border-border/50">
            <div className="space-y-1">
                <h2 className="text-3xl font-extrabold tracking-tight">Your Personalized Plan</h2>
                <p className="text-muted-foreground">Generated just for you. Save, export, or adjust the plan.</p>
            </div>
            <div className="flex space-x-3">
                <Button 
                    variant="outline" 
                    onClick={onSave} // Calls the save function wired in page.tsx
                >
                    <Copy className="w-4 h-4 mr-2" /> Save Plan
                </Button>
                <Button 
                    onClick={() => handleExportPDF(plan)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                >
                    <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
            </div>
        </div>

        {/* Motivation Quote */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-yellow-500">
            <p className="text-sm italic text-yellow-800 dark:text-yellow-300 font-medium">
                "Daily Motivation: {dailyQuote}"
            </p>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <WorkoutDisplay plan={plan} />
            <DietDisplay plan={plan} />
            <TipsDisplay tips={plan.ai_tips} />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4 pt-4 pb-12">
            <Button variant="secondary" onClick={onEdit}>
                <PenTool className="w-4 h-4 mr-2" /> Edit Details
            </Button>
            <Button variant="default" onClick={onRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate Plan
            </Button>
        </div>

    </div>
  );
}
