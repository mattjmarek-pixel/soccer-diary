import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ai-insights", async (req, res) => {
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
        model: "gpt-5-mini",
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
        temperature: 0.7,
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
