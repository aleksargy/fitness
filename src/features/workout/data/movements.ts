export type MovementCategory = "Pull" | "Push" | "Legs" | "Core";

export type Movement = {
  id: string;
  name: string;
  category: MovementCategory;
};

export const MOVEMENTS: Movement[] = [
  { id: "pullup", name: "Pull-ups", category: "Pull" },
  { id: "chinup", name: "Chin-ups", category: "Pull" },
  { id: "row", name: "Bodyweight Rows", category: "Pull" },

  { id: "dip", name: "Dips", category: "Push" },
  { id: "pushup", name: "Push-ups", category: "Push" },
  { id: "hspu", name: "Handstand Push-ups", category: "Push" },

  { id: "squat", name: "Squats", category: "Legs" },
  { id: "pistol", name: "Pistol Squats", category: "Legs" },
  { id: "lunge", name: "Lunges", category: "Legs" },
  { id: "nordic", name: "Nordic Curls", category: "Legs" },

  { id: "plank", name: "Plank", category: "Core" },
  { id: "legraise", name: "Hanging Leg Raises", category: "Core" },
];
