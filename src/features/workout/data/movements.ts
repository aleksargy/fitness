export type MovementCategory = "Pull" | "Push" | "Legs" | "Core";

export type Movement = {
  id: string;
  name: string;
  category: MovementCategory;
  image: string; // public path
};

export const MOVEMENTS: Movement[] = [
  { id: "pullup", name: "Pull-ups", category: "Pull", image: "/movements/pullup.jpg" },
  { id: "chinup", name: "Chin-ups", category: "Pull", image: "/movements/chinup.jpg" },
  { id: "row", name: "Bodyweight Rows", category: "Pull", image: "/movements/row.jpg" },

  { id: "dip", name: "Dips", category: "Push", image: "/movements/dip.jpg" },
  { id: "pushup", name: "Push-ups", category: "Push", image: "/movements/pushup.jpg" },
  { id: "hspu", name: "Handstand Push-ups", category: "Push", image: "/movements/hspu.jpg" },

  { id: "squat", name: "Squats", category: "Legs", image: "/movements/squat.jpg" },
  { id: "pistol", name: "Pistol Squats", category: "Legs", image: "/movements/pistol.jpg" },
  { id: "lunge", name: "Lunges", category: "Legs", image: "/movements/lunge.jpg" },
  { id: "nordic", name: "Nordic Curls", category: "Legs", image: "/movements/nordic.jpg" },

  { id: "plank", name: "Plank", category: "Core", image: "/movements/plank.jpg" },
  { id: "legraise", name: "Hanging Leg Raises", category: "Core", image: "/movements/legraise.jpg" },
];
