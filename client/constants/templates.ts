import { SkillCategory } from "@/constants/theme";

export interface TrainingTemplate {
  id: string;
  name: string;
  icon: string;
  duration: number;
  skills: { category: SkillCategory; notes: string }[];
  isPremium: boolean;
}

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
  {
    id: "pre-match-warmup",
    name: "Pre-Match Warmup",
    icon: "sunrise",
    duration: 30,
    skills: [
      { category: "Fitness", notes: "Light jogging, dynamic stretches, and activation drills" },
      { category: "Passing", notes: "Short passing sequences and rondos to build rhythm" },
    ],
    isPremium: false,
  },
  {
    id: "shooting-drills",
    name: "Shooting Drills",
    icon: "target",
    duration: 45,
    skills: [
      { category: "Shooting", notes: "Finishing from various angles and distances" },
      { category: "First Touch", notes: "Receiving and setting up for shots" },
    ],
    isPremium: false,
  },
  {
    id: "dribbling-masterclass",
    name: "Dribbling Masterclass",
    icon: "wind",
    duration: 60,
    skills: [
      { category: "Dribbling", notes: "1v1 moves, close control, and change of direction" },
      { category: "First Touch", notes: "Ball manipulation and tight space control" },
    ],
    isPremium: false,
  },
  {
    id: "full-training-session",
    name: "Full Training Session",
    icon: "activity",
    duration: 90,
    skills: [
      { category: "Dribbling", notes: "Ball mastery and skill moves" },
      { category: "Shooting", notes: "Finishing and long-range efforts" },
      { category: "Passing", notes: "Short and long-range distribution" },
      { category: "First Touch", notes: "Receiving under pressure" },
      { category: "Fitness", notes: "Endurance and strength conditioning" },
      { category: "Tactics", notes: "Positional play and game scenarios" },
    ],
    isPremium: true,
  },
  {
    id: "tactical-analysis",
    name: "Tactical Analysis",
    icon: "map",
    duration: 45,
    skills: [
      { category: "Tactics", notes: "Formation study, positioning, and decision making" },
      { category: "Passing", notes: "Building from the back and switching play" },
    ],
    isPremium: true,
  },
  {
    id: "speed-agility",
    name: "Speed & Agility",
    icon: "zap",
    duration: 40,
    skills: [
      { category: "Fitness", notes: "Sprint intervals, ladder drills, and cone work" },
      { category: "Dribbling", notes: "Speed dribbling and quick feet exercises" },
    ],
    isPremium: true,
  },
  {
    id: "set-piece-practice",
    name: "Set Piece Practice",
    icon: "flag",
    duration: 30,
    skills: [
      { category: "Shooting", notes: "Free kicks and penalty practice" },
      { category: "Passing", notes: "Corner delivery and set piece routines" },
      { category: "Tactics", notes: "Defensive and offensive set piece organization" },
    ],
    isPremium: true,
  },
  {
    id: "recovery-session",
    name: "Recovery Session",
    icon: "heart",
    duration: 20,
    skills: [
      { category: "Fitness", notes: "Light stretching, foam rolling, and cool-down exercises" },
    ],
    isPremium: true,
  },
];
