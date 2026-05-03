export type Skill = {
  name: string;
  notes?: string;
};

export type DiaryEntry = {
  id: string;
  userId: string;
  date: string;
  mood: number;
  durationMinutes: number;
  notes?: string;
  skills?: Skill[];
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  team?: string;
  position?: string;
  preferredFoot?: string;
  age?: number;
  isPremium: boolean;
};
