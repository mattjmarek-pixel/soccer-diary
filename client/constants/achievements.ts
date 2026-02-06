import { Colors, SkillCategories } from "@/constants/theme";
import type { DiaryEntry } from "@/contexts/DiaryContext";

export interface DiaryStats {
  totalEntries: number;
  totalMinutes: number;
  currentStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isEarned: (entries: DiaryEntry[], stats: DiaryStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-entry",
    title: "First Entry",
    description: "Log your first session",
    icon: "edit-3",
    color: Colors.dark.primary,
    isEarned: (_entries, stats) => stats.totalEntries >= 1,
  },
  {
    id: "week-warrior",
    title: "Week Warrior",
    description: "7-day training streak",
    icon: "zap",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.currentStreak >= 7,
  },
  {
    id: "dedicated-player",
    title: "Dedicated Player",
    description: "Log 25 entries",
    icon: "award",
    color: "#FF6B6B",
    isEarned: (_entries, stats) => stats.totalEntries >= 25,
  },
  {
    id: "century",
    title: "Century",
    description: "Log 100 entries",
    icon: "star",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.totalEntries >= 100,
  },
  {
    id: "marathon-trainer",
    title: "Marathon Trainer",
    description: "Train 1000+ total minutes",
    icon: "clock",
    color: Colors.dark.primary,
    isEarned: (_entries, stats) => stats.totalMinutes >= 1000,
  },
  {
    id: "all-rounder",
    title: "All-Rounder",
    description: "Practice all 6 skills in one session",
    icon: "target",
    color: "#9C27B0",
    isEarned: (entries) =>
      entries.some((entry) => {
        const categories = new Set(entry.skills.map((s) => s.category));
        return categories.size >= SkillCategories.length;
      }),
  },
  {
    id: "mood-master",
    title: "Mood Master",
    description: "Rate 5 (Great) mood 10 times",
    icon: "smile",
    color: Colors.dark.primary,
    isEarned: (entries) =>
      entries.filter((e) => e.mood === 5).length >= 10,
  },
  {
    id: "iron-will",
    title: "Iron Will",
    description: "30-day training streak",
    icon: "shield",
    color: "#FF6B6B",
    isEarned: (_entries, stats) => stats.currentStreak >= 30,
  },
  {
    id: "10k-minutes",
    title: "10K Minutes",
    description: "Train 10,000+ total minutes",
    icon: "trending-up",
    color: Colors.dark.accent,
    isEarned: (_entries, stats) => stats.totalMinutes >= 10000,
  },
  {
    id: "video-star",
    title: "Video Star",
    description: "Attach 10 videos to entries",
    icon: "video",
    color: "#2196F3",
    isEarned: (entries) =>
      entries.filter((e) => e.videoUri).length >= 10,
  },
];
