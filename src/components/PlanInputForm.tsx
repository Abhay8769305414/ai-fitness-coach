import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";

// -----------------------------
// Zod schema + inferred TS type
// -----------------------------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce
    .number()
    .min(10, "Age must be >= 10")
    .max(120, "Age must be <= 120"),
  gender: z.enum(["Male", "Female", "Other"]),
  height_cm: z.coerce
    .number()
    .min(50, "Height must be >= 50 cm")
    .max(300, "Height must be <= 300 cm"),
  weight_kg: z.coerce
    .number()
    .min(20, "Weight must be >= 20 kg")
    .max(500, "Weight must be <= 500 kg"),
  fitness_goal: z.enum([
    "Weight Loss",
    "Muscle Gain",
    "Endurance",
    "General Fitness",
  ]),
  fitness_level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  workout_location: z.enum(["Home", "Gym", "Outdoor"]),
  // Keep these as strings with defaults to match parent expectations
  dietary_preference: z.string().default(""),
  optional_notes: z.string().default(""),
});

export type PlanInput = z.infer<typeof formSchema>;

// -----------------------------
// Component Props
// -----------------------------
type PlanInputFormProps = {
  onPlanGenerated: (input: PlanInput) => Promise<void> | void;
  isLoading?: boolean;
};

// -----------------------------
// Component
// -----------------------------
export function PlanInputForm({
  onPlanGenerated,
  isLoading = false,
}: PlanInputFormProps) {
  // <-- Note: no generic parameter here. Let zodResolver infer the type.
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 25,
      gender: "Male",
      height_cm: 170,
      weight_kg: 70,
      fitness_goal: "General Fitness",
      fitness_level: "Beginner",
      workout_location: "Home",
      dietary_preference: "",
      optional_notes: "",
    },
  });

  const onSubmit = async (data: PlanInput) => {
    try {
      await onPlanGenerated(data);
      // optional: reset();
    } catch (err) {
      console.error("Error generating plan:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl mx-auto grid gap-4"
    >
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input {...register("name")} className="input" />
        {errors.name && (
          <p className="text-xs text-destructive">
            {String(errors.name.message)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Age</label>
          <input
            type="number"
            {...register("age", { valueAsNumber: true })}
            className="input"
          />
          {errors.age && (
            <p className="text-xs text-destructive">
              {String(errors.age.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Height (cm)</label>
          <input
            type="number"
            {...register("height_cm", { valueAsNumber: true })}
            className="input"
          />
          {errors.height_cm && (
            <p className="text-xs text-destructive">
              {String(errors.height_cm.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input
            type="number"
            {...register("weight_kg", { valueAsNumber: true })}
            className="input"
          />
          {errors.weight_kg && (
            <p className="text-xs text-destructive">
              {String(errors.weight_kg.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Gender</label>
          <select {...register("gender")} className="input">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && (
            <p className="text-xs text-destructive">
              {String(errors.gender.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Fitness Goal</label>
          <select {...register("fitness_goal")} className="input">
            <option value="General Fitness">General Fitness</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Endurance">Endurance</option>
          </select>
          {errors.fitness_goal && (
            <p className="text-xs text-destructive">
              {String(errors.fitness_goal.message)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Fitness Level</label>
          <select {...register("fitness_level")} className="input">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {errors.fitness_level && (
            <p className="text-xs text-destructive">
              {String(errors.fitness_level.message)}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Workout Location</label>
        <select {...register("workout_location")} className="input">
          <option value="Home">Home</option>
          <option value="Gym">Gym</option>
          <option value="Outdoor">Outdoor</option>
        </select>
        {errors.workout_location && (
          <p className="text-xs text-destructive">
            {String(errors.workout_location.message)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">
          Dietary Preference (optional)
        </label>
        <input {...register("dietary_preference")} className="input" />
        {errors.dietary_preference && (
          <p className="text-xs text-destructive">
            {String(errors.dietary_preference.message)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">
          Optional Notes / Limitations
        </label>
        <textarea {...register("optional_notes")} className="input" rows={3} />
        {errors.optional_notes && (
          <p className="text-xs text-destructive">
            {String(errors.optional_notes.message)}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Plan"}
        </Button>
      </div>
    </form>
  );
}

export default PlanInputForm;
