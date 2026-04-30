import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { eq, and, desc } from "drizzle-orm";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { db } from "./db/index";
import { users, diaryEntries, waitlist } from "../shared/schema";
import { signToken, verifyToken } from "./auth";
import { requireAuth } from "./middleware";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ─── AUTH ────────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/session
   * Body options:
   *   { provider: "apple", idToken: string, name?: string, email?: string }
   *   { provider: "google", idToken: string, email: string, name: string }
   *   { provider: "email", email: string, password: string, name?: string, isSignUp?: boolean }
   */
  app.post("/api/auth/session", async (req, res) => {
    try {
      const { provider, email, name, idToken, isSignUp, password } = req.body;

      if (!provider) {
        return res.status(400).json({ message: "Provider is required" });
      }

      // ── Email / Password ──────────────────────────────────────────────
      if (provider === "email") {
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        if (isSignUp) {
          if (!name) {
            return res.status(400).json({ message: "Name is required for sign up" });
          }

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

          if (existing.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists" });
          }

          const passwordHash = await bcrypt.hash(password, 12);

          const [user] = await db
            .insert(users)
            .values({
              email: email.toLowerCase(),
              name,
              provider: "email",
              passwordHash,
            })
            .returning();

          const token = signToken({ userId: user.id, email: user.email, name: user.name });
          return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
        } else {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);

          if (!user || !user.passwordHash) {
            return res.status(401).json({ message: "Invalid email or password" });
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return res.status(401).json({ message: "Invalid email or password" });
          }

          const token = signToken({ userId: user.id, email: user.email, name: user.name });
          return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
        }
      }

      // ── OAuth (Apple / Google) ───────────────────────────────────────
      if (!email) {
        return res.status(400).json({ message: "Email is required for OAuth sign-in" });
      }

      if (!idToken) {
        return res.status(400).json({ message: "idToken is required for OAuth sign-in" });
      }

      const normalizedEmail = email.toLowerCase();
      const displayName = name || normalizedEmail.split("@")[0];

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      let user: typeof users.$inferSelect;

      if (existing.length > 0) {
        [user] = existing;
      } else {
        [user] = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            name: displayName,
            provider,
            providerId: idToken.slice(0, 64),
          })
          .returning();
      }

      const token = signToken({ userId: user.id, email: user.email, name: user.name });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });

  /**
   * GET /api/auth/me — validate token and return user profile
   */
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.user!.userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to fetch user" });
    }
  });

  /**
   * PATCH /api/auth/me — update user profile fields
   */
  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const { name, avatarUrl, team, position, preferredFoot, age } = req.body;

      const updates: Partial<typeof users.$inferInsert> = {};
      if (name !== undefined) updates.name = name;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      if (team !== undefined) updates.team = team;
      if (position !== undefined) updates.position = position;
      if (preferredFoot !== undefined) updates.preferredFoot = preferredFoot;
      if (age !== undefined) updates.age = age;

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.user!.userId))
        .returning();

      const { passwordHash: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to update profile" });
    }
  });

  // ─── DIARY ENTRIES ───────────────────────────────────────────────────────

  /**
   * GET /api/entries — all entries for the authenticated user, newest first
   */
  app.get("/api/entries", requireAuth, async (req, res) => {
    try {
      const entries = await db
        .select()
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, req.user!.userId))
        .orderBy(desc(diaryEntries.date));

      return res.json(entries);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to fetch entries" });
    }
  });

  /**
   * POST /api/entries — create a new entry
   */
  app.post("/api/entries", requireAuth, async (req, res) => {
    try {
      const {
        date,
        mood,
        durationMinutes,
        notes,
        skills,
        videoUrl,
        mediaType,
        xpAwarded,
      } = req.body;

      if (!date || mood === undefined || durationMinutes === undefined) {
        return res.status(400).json({ message: "date, mood, and durationMinutes are required" });
      }

      const [entry] = await db
        .insert(diaryEntries)
        .values({
          userId: req.user!.userId,
          date,
          mood,
          durationMinutes,
          notes: notes || null,
          skills: skills || [],
          videoUrl: videoUrl || null,
          mediaType: mediaType || null,
          xpAwarded: xpAwarded || 0,
        })
        .returning();

      return res.status(201).json(entry);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to create entry" });
    }
  });

  /**
   * PUT /api/entries/:id — update an entry (must belong to the user)
   */
  app.put("/api/entries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        date,
        mood,
        durationMinutes,
        notes,
        skills,
        videoUrl,
        mediaType,
        xpAwarded,
      } = req.body;

      const existing = await db
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, req.user!.userId)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ message: "Entry not found" });
      }

      const updates: Partial<typeof diaryEntries.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (date !== undefined) updates.date = date;
      if (mood !== undefined) updates.mood = mood;
      if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
      if (notes !== undefined) updates.notes = notes;
      if (skills !== undefined) updates.skills = skills;
      if (videoUrl !== undefined) updates.videoUrl = videoUrl;
      if (mediaType !== undefined) updates.mediaType = mediaType;
      if (xpAwarded !== undefined) updates.xpAwarded = xpAwarded;

      const [updated] = await db
        .update(diaryEntries)
        .set(updates)
        .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, req.user!.userId)))
        .returning();

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to update entry" });
    }
  });

  /**
   * DELETE /api/entries/:id — delete an entry (must belong to the user)
   */
  app.delete("/api/entries/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await db
        .select()
        .from(diaryEntries)
        .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, req.user!.userId)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ message: "Entry not found" });
      }

      await db
        .delete(diaryEntries)
        .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, req.user!.userId)));

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to delete entry" });
    }
  });

  // ─── WAITLIST ─────────────────────────────────────────────────────────────

  /**
   * POST /api/waitlist — add email to waitlist (no auth required)
   */
  app.post("/api/waitlist", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "A valid email address is required" });
      }

      await db.insert(waitlist).values({ email: email.toLowerCase() }).onConflictDoNothing();

      return res.json({ success: true, message: "You're on the list! We'll be in touch." });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Failed to join waitlist" });
    }
  });

  // ─── AI INSIGHTS ─────────────────────────────────────────────────────────

  app.post("/api/ai-insights", requireAuth, async (req, res) => {
    try {
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: "Please provide at least one diary entry for analysis." });
      }

      const entrySummaries = entries
        .map(
          (entry: { date: string; mood: number; duration: number; reflection: string; skills: { category: string; notes: string }[] }) =>
            `Date: ${entry.date}, Mood: ${entry.mood}/5, Duration: ${entry.duration} min, Reflection: "${entry.reflection}", Skills: ${entry.skills.map((s) => `${s.category} (${s.notes})`).join(", ")}`
        )
        .join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert soccer coach and sports psychologist. Analyze the player's training diary entries and provide personalized insights.",
          },
          {
            role: "user",
            content: `Analyze these training diary entries and respond with a JSON object containing:
- "insights": an array of 3-5 personalized insight strings about the player's training patterns
- "weeklyTip": a single actionable tip for the upcoming week
- "moodAnalysis": a brief analysis of how mood correlates with training performance
- "skillRecommendation": a specific skill area to focus on based on the entries

Training entries:
${entrySummaries}

Respond ONLY with valid JSON, no markdown or extra text.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "No response received from AI." });
      }

      const parsed = JSON.parse(content);
      return res.json(parsed);
    } catch (error: any) {
      console.error("AI Insights error:", error);
      if (error instanceof SyntaxError) {
        return res.status(500).json({ message: "Failed to parse AI response." });
      }
      return res.status(500).json({ message: error.message || "Failed to generate insights." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
