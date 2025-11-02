"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

// --- Form Schema Definition (using Zod) ---
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(16, { message: "Must be 16 or older." }).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  height_cm: z.coerce.number().min(50).max(250),
  weight_kg: z.coerce.number().min(20).max(400),
  fitness_goal: z.enum(["Weight Loss", "Muscle Gain", "Endurance", "General Fitness"]),
  fitness_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  workout_location: z.enum(["Home", "Gym", "Outdoor"]),
  dietary_preference: z.enum(["Veg", "Non-Veg", "Vegan", "Keto", "None"]),
  optional_notes: z.string().max(500).optional().default(""),
});

// We infer the type directly from the schema for simplicity
export type PlanInput = z.infer<typeof formSchema>;

// Component props interface
interface PlanInputFormProps {
    onPlanGenerated: (data: PlanInput) => void;
    isLoading: boolean;
}

export function PlanInputForm({ onPlanGenerated, isLoading }: PlanInputFormProps) {
  const form = useForm<PlanInput>({
    resolver: zodResolver(formSchema), 
    defaultValues: {
      name: "",
      age: 25,
      gender: "Male",
      height_cm: 175,
      weight_kg: 70,
      fitness_goal: "Muscle Gain",
      fitness_level: "Intermediate",
      workout_location: "Gym",
      dietary_preference: "None",
      optional_notes: "",
    },
    mode: "onBlur"
  });

  // The submit handler is now correctly typed as PlanInput
  function onSubmit(values: PlanInput) {
    onPlanGenerated(values);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto my-12 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Generate Your Personalized Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* FIX: The onSubmit handler must be passed directly to handleSubmit */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name and Age */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      {/* FIX: Ensure onChange passes a number or undefined to match z.coerce.number() */}
                      <Input type="number" placeholder="25" {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Height and Weight */}
              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="175" {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="70" {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Male" />
                        </FormControl>
                        <FormLabel className="font-normal">Male</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Female" />
                        </FormControl>
                        <FormLabel className="font-normal">Female</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="Other" />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fitness Goal */}
              <FormField
                control={form.control}
                name="fitness_goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitness Goal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a goal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                        <SelectItem value="Muscle Gain">Muscle Gain</SelectItem>
                        <SelectItem value="Endurance">Endurance</SelectItem>
                        <SelectItem value="General Fitness">General Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>What do you want to achieve?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fitness Level */}
              <FormField
                control={form.control}
                name="fitness_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Fitness Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Workout Location */}
              <FormField
                control={form.control}
                name="workout_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Where do you workout?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Home">Home (Bodyweight/Minimal Equipment)</SelectItem>
                        <SelectItem value="Gym">Gym (Full Equipment)</SelectItem>
                        <SelectItem value="Outdoor">Outdoor (Running, Calisthenics)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dietary Preference */}
              <FormField
                control={form.control}
                name="dietary_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Any dietary restrictions?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">No Preference</SelectItem>
                        <SelectItem value="Veg">Vegetarian</SelectItem>
                        <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                        <SelectItem value="Keto">Keto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Notes */}
            <FormField
              control={form.control}
              name="optional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional Notes / Medical History</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Bad knee, avoid lunges,' or 'High stress level'" {...field} />
                  </FormControl>
                  <FormDescription>Any specific limitations or details the AI should consider?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                {isLoading ? (
                    <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Plan...
                    </span>
                ) : (
                    "Generate My Plan 🚀"
                )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
