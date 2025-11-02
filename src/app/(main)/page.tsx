"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Using the correct, final alias path. We assume configuration (tsconfig.json) is correct.
import { PlanInputForm } from "@/components/PlanInputForm"; 
import { PlanDisplay } from "@/components/PlanDisplay"; 
// ----------------------------------------------------------------------
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Trash2, PenTool, Eye, X, Lightbulb, CheckCircle2, Save } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
// Import GSAP animations
import { 
  animateMainHeading, 
  animateInputForm, 
  animatePlanSections, 
  animateQuote, 
  animateAITips, 
  animateSavedPlans,
  initializeHoverAnimations
} from '@/lib/animations';

// FIX: Importing corrected function names from firebase.ts
import { 
    initializeFirebase, 
    getPlansCollectionRef, 
    savePlanToDatabase, 
    deletePlanFromDatabase, 
    getUserId 
} from '@/lib/firebase';
import { onSnapshot, query, orderBy } from 'firebase/firestore';

// --- Type Definitions (Must match other files) ---
interface Exercise { exercise: string; sets: string; reps: string; rest: string; }
interface WorkoutDay { day: string; focus: string; routine: Exercise[]; }
interface Meal { meal: string; calories: string; items: string[]; }
interface AITips { posture: string; lifestyle: string; }
interface GeneratedPlan { 
    workout_plan: WorkoutDay[]; 
    diet_plan: Meal[]; 
    ai_tips: AITips; 
    tips?: string[];
}
type PlanInput = {
    name: string; age: number; gender: 'Male' | 'Female' | 'Other'; height_cm: number;
    weight_kg: number; fitness_goal: string; fitness_level: string; workout_location: string;
    dietary_preference: string; optional_notes: string;
};
interface SavedPlan {
    id: string;
    name: string;
    goal: string;
    level: string;
    plan: GeneratedPlan;
    createdAt: Date;
}

// MOCK Data for initial rendering (keep as fallback)
const MOCK_PLAN: GeneratedPlan = {
  workout_plan: [
    { day: "Day 1", focus: "Full Body", routine: [
        { exercise: "Squats", sets: "3", reps: "10", rest: "60s" },
        { exercise: "Pushups", sets: "3", reps: "15", rest: "60s" },
    ]},
    { day: "Day 2", focus: "Rest", routine: [] },
    { day: "Day 7", focus: "Rest", routine: [] },
  ],
  diet_plan: [
    { meal: "Breakfast", calories: "400 kcal", items: ["Oatmeal with fruit", "Protein Shake"] },
  ],
  ai_tips: {
    posture: "Keep your back straight during lifts.",
    lifestyle: "Drink plenty of water.",
  }
};


// Simple Theme Toggle
const ThemeToggle = () => {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <PenTool className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <PenTool className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function Home() {
    const [currentPlan, setCurrentPlan] = useState<GeneratedPlan | null>(null);
    const [currentPlanInput, setCurrentPlanInput] = useState<PlanInput | null>(null);
    const [showPlan, setShowPlan] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [dailyQuote, setDailyQuote] = useState<string>('Discipline is the bridge between goals and accomplishment.'); // Default quote
    
    // Refs for animation targets
    const mainHeadingRef = useRef<HTMLDivElement>(null);
    const formCardRef = useRef<HTMLDivElement>(null);
    const planSectionsRef = useRef<HTMLDivElement>(null);
    const quoteRef = useRef<HTMLDivElement>(null);
    const aiTipsRef = useRef<HTMLDivElement>(null);
    const savedPlansRef = useRef<HTMLDivElement>(null);

    // 1. Initial Auth, Firestore Listener, and Daily Quote Setup
    useEffect(() => {
        // --- Auth Initialization ---
        initializeFirebase().then(() => {
            setIsAuthReady(true);
        }).catch(console.error);
        
        // --- Daily Quote Fetch (API call) ---
        const fetchDailyQuote = async () => {
            try {
                const response = await fetch("/api/daily-quote");
                if (response.ok) {
                    const result = await response.json();
                    setDailyQuote(result.quote);
                }
            } catch (e) {
                console.warn("Failed to fetch daily quote API. Using default quote.", e);
            }
        };
        fetchDailyQuote();
        
        // Initialize animations
        if (mainHeadingRef.current) {
            animateMainHeading(mainHeadingRef.current);
        }
        
        if (formCardRef.current) {
            animateInputForm(formCardRef.current);
        }
        
        // Initialize hover animations
        setTimeout(() => {
            initializeHoverAnimations();
        }, 1000);
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;

        // --- Firestore Listener ---
        try {
            const plansRef = getPlansCollectionRef();
            
            // FIX C: Only proceed if the collection reference is valid
            if (plansRef) {
                const q = query(plansRef, orderBy("createdAt", "desc"));
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const plansList: SavedPlan[] = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        let parsedPlan: GeneratedPlan | undefined;
                        
                        // FIX B: Ensure data.plan is valid before parsing
                        if (typeof data.plan === 'string') {
                            try {
                                parsedPlan = JSON.parse(data.plan); 
                            } catch(e) {
                                console.error("Failed to parse plan JSON from Firestore document:", doc.id, e);
                            }
                        }

                        // Only push if parsing was successful
                        if (parsedPlan) {
                            plansList.push({
                                id: doc.id,
                                name: data.name,
                                goal: data.goal,
                                level: data.level,
                                plan: parsedPlan, // Now guaranteed to be GeneratedPlan
                                createdAt: data.createdAt?.toDate() || new Date(),
                            });
                        }
                    });
                    setSavedPlans(plansList);
                });

                return () => unsubscribe(); // Cleanup the listener
            }

        } catch (e) {
            console.error("Error setting up Firestore listener. You may need to enable Firestore in your project.", e);
        }
    }, [isAuthReady]);

    
    // Function to handle form submission and fetch plan from API
    const handleGeneratePlan = async (userData: PlanInput) => {
        setCurrentPlanInput(userData); 
        setShowPlan(false);
        setIsLoading(true);
        setCurrentPlan(null);

        try {
            const response = await fetch("/api/generate-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                throw new Error("Plan generation failed.");
            }

            const result = await response.json();
            setCurrentPlan(result.plan as GeneratedPlan);
            setShowPlan(true);
            
            // Animate plan sections when they appear
            setTimeout(() => {
                if (planSectionsRef.current) {
                    const sections = planSectionsRef.current.querySelectorAll('.plan-card');
                    if (sections.length) {
                        animatePlanSections(Array.from(sections) as HTMLElement[]);
                    }
                }
                
                // Animate quote
                if (quoteRef.current) {
                    animateQuote(quoteRef.current);
                }
                
                // Animate AI Tips
                if (aiTipsRef.current) {
                    animateAITips(aiTipsRef.current);
                }
                
                // Re-initialize hover animations for new content
                initializeHoverAnimations();
            }, 300);

        } catch (error) {
            console.error("Plan Generation Error:", error);
            setCurrentPlan(MOCK_PLAN); 
            setShowPlan(true);
            alert("Error generating plan (API Key/Quota issue?). Showing mock data for testing purposes.");
        } finally {
            setIsLoading(false);
        }
    };

    // Function to save the currently displayed plan
    const handleSavePlan = useCallback(async () => {
        if (!currentPlan || !currentPlanInput) {
            alert("No plan generated yet to save!");
            return;
        }

        try {
            const metadata = {
                name: currentPlanInput.name,
                goal: currentPlanInput.fitness_goal,
                level: currentPlanInput.fitness_level,
            };
            await savePlanToDatabase(currentPlan, metadata);
            alert("Plan saved successfully!");
        } catch (error) {
            console.error("Save Plan Error:", error);
            alert("Failed to save plan. See console for details. (Check Firebase setup)");
        }
    }, [currentPlan, currentPlanInput]);


    // Function to display a saved plan
    const handleLoadPlan = (plan: GeneratedPlan) => {
        setCurrentPlan(plan);
        setShowPlan(true);
    };

    // Function to handle regeneration (shows the form again)
    const handleRegenerate = () => {
        setShowPlan(false);
        setCurrentPlan(null);
    };

    // Function to edit details (shows the form again)
    const handleEdit = () => {
        setShowPlan(false);
    };

    // Display user ID for debugging and collaboration (MANDATORY)
    const userId = isAuthReady ? getUserId() : 'Loading...';


    // --- Render Components ---
    const SavedPlansSection = () => (
        <div ref={savedPlansRef} className="w-full max-w-6xl mx-auto space-y-4 pt-12">
            <h3 className="text-3xl font-extrabold flex items-center text-primary">
                <LayoutGrid className="w-6 h-6 mr-2" /> Your Saved Fitness Plans
            </h3>
            <Card className="p-4 bg-muted/50 border-dashed border-2 border-border/70">
                <p className="text-sm text-muted-foreground font-medium">
                    Your User ID: **{userId}** (Used for secure, private data storage)
                </p>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedPlans.length > 0 ? (
                    savedPlans.map((plan) => (
                        <Card key={plan.id} className="shadow-md hover:shadow-lg transition duration-200 flex flex-col plan-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg truncate">{plan.name}&apos;s Plan</CardTitle> 
                                <CardDescription className="text-xs">Goal: {plan.goal} • Level: {plan.level}</CardDescription>
                                <CardDescription className="text-xs">Saved: {plan.createdAt.toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2 flex justify-between space-x-2">
                                <Button 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => handleLoadPlan(plan.plan)}
                                >
                                    <Eye className="w-4 h-4 mr-2" /> View Plan
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="w-10"
                                    onClick={() => deletePlanFromDatabase(plan.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="md:col-span-4 p-8 text-center text-muted-foreground">
                        No saved plans found. Generate and save your first personalized plan!
                    </Card>
                )}
            </div>
        </div>
    );

    return (
        <main className="min-h-screen p-4 md:p-8">
            <header className="flex justify-between items-center max-w-7xl mx-auto py-4">
                <h1 ref={mainHeadingRef} className="text-3xl font-extrabold tracking-tight text-primary">
                    AI Fitness Coach
                </h1>
                <ThemeToggle />
            </header>

            {/* Daily Quote Section (Now dynamic) */}
            <div className="w-full max-w-6xl mx-auto pt-4">
                <Card className="p-4 bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-yellow-500">
                    <p className="text-sm italic text-yellow-800 dark:text-yellow-300 font-medium">
                        &quot;Daily Motivation: {dailyQuote}&quot;
                    </p>
                </Card>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                    <h2 className="text-2xl font-semibold text-muted-foreground">
                        Crafting your personalized plan...
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        This may take up to 20 seconds. Thank you for your patience!
                    </p>
                </div>
            )}

            {/* Display Plan or Form */}
            {!isLoading && (showPlan && currentPlan) ? (
                <div ref={planSectionsRef}>
                    <PlanDisplay 
                        plan={currentPlan} 
                        onRegenerate={handleRegenerate} 
                        onEdit={handleEdit}
                        onSave={handleSavePlan} // Pass save handler
                        dailyQuote={dailyQuote} // Pass dailyQuote prop
                    />
                </div>
            ) : (
                <>
                    <section className="text-center py-12">
                        <h2 className="4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Your Personalized Fitness Journey Starts Here
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Answer a few questions to generate a tailored workout and diet plan.
                        </p>
                    </section>
                    <div ref={formCardRef}>
                        <PlanInputForm onPlanGenerated={handleGeneratePlan} isLoading={isLoading} />
                    </div>
                </>
            )}

            {/* Display Saved Plans Section */}
            {isAuthReady && <SavedPlansSection />}

        </main>
    );
}
