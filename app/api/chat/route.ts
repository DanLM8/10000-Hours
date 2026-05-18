import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SkillContext {
  name: string;
  totalHours: number;
  streak: number;
  dailyGoalMin: number;
  weeklyGoalMin: number;
  recentNotes: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(ctx: SkillContext): string {
  const weeklyGoalHrs = (ctx.weeklyGoalMin / 60).toFixed(1);
  const dailyGoalHrs = (ctx.dailyGoalMin / 60).toFixed(1);
  const percentToGoal = ((ctx.totalHours / 10000) * 100).toFixed(2);

  const notesSection =
    ctx.recentNotes.length > 0
      ? `Recent session notes:\n${ctx.recentNotes.map((n, i) => `  ${i + 1}. "${n}"`).join("\n")}`
      : "No session notes logged yet.";

  return `You are a deliberate practice coach inside the app "10,000 Hours" — a skill mastery tracker based on the principle that world-class expertise requires roughly 10,000 hours of focused practice.

Your role is to give the user concise, motivating, and actionable coaching advice for their specific skill. Be warm but direct. Avoid generic advice — always tie your response to their actual data.

Current skill context:
- Skill: ${ctx.name}
- Total hours logged: ${ctx.totalHours.toFixed(1)} hrs (${percentToGoal}% of 10,000 hr goal)
- Current streak: ${ctx.streak} day${ctx.streak !== 1 ? "s" : ""}
- Daily goal: ${dailyGoalHrs} hrs/day (${ctx.dailyGoalMin} min)
- Weekly goal: ${weeklyGoalHrs} hrs/week (${ctx.weeklyGoalMin} min)
${notesSection}

Guidelines:
- Keep responses concise (2–4 short paragraphs max unless the user asks for a detailed plan)
- If asked for a practice routine or schedule, format it clearly with bullet points or numbered steps
- Celebrate streaks and milestones genuinely, not patronisingly
- If the user is early in their journey (under 100 hrs), focus on building habits and foundations
- If the user asks about goals, suggest specific, measurable adjustments based on their current pace
- Never mention that you're Claude or an AI — you are simply their coach`;
}

export async function POST(req: NextRequest) {
  const { messages, skillContext } = (await req.json()) as {
    messages: Message[];
    skillContext: SkillContext;
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: buildSystemPrompt(skillContext),
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
