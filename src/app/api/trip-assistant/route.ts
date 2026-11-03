import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().trim().min(1).max(1800),
  trip: z.object({
    city: z.string().max(100),
    country: z.string().max(100),
    dates: z.string().max(100),
    travelers: z.number().int().min(1).max(12),
    budget: z.number().positive().max(1_000_000),
    style: z.string().max(80),
    days: z.array(z.object({
      title: z.string().max(100),
      places: z.array(z.object({ name: z.string().max(120), kind: z.string().max(40), time: z.string().max(10), cost: z.number().min(0) })).max(12),
    })).max(14),
  }),
});

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please provide a prompt and valid trip context." }, { status: 400 });
  const { prompt, trip } = parsed.data;
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      mode: "demo",
      reply: `For your ${trip.style.toLowerCase()} trip to ${trip.city}, consider making one small change at a time: ${prompt.toLowerCase().includes("budget") ? `compare your actual spending with the €${trip.budget.toLocaleString()} trip budget, then review optional activities before changing accommodations or transport.` : prompt.toLowerCase().includes("rain") ? `keep a flexible indoor alternative in mind and check the local forecast on the day. Your ${trip.days.length}-day plan currently has ${trip.days.reduce((total, day) => total + day.places.length, 0)} activities; choose one flexible stop to swap rather than packing more in.` : `leave generous transitions between activities and pick one meaningful highlight for the day. Your ${trip.city} plan is a starting point, so confirm local details before relying on any suggestion.`} I haven’t changed your saved itinerary. Would you like me to propose a specific edit for you to review?`,
    });
  }
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 25_000, maxRetries: 1 });
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-7-sonnet-latest",
      max_tokens: 900,
      system: "You are Triply's travel companion. Use the supplied trip context, make practical gentle suggestions, and state clearly that place, weather, hours and price facts are unverified unless provided. Never modify the saved trip. Ask for explicit confirmation before proposing a change as ready to apply.",
      messages: [{ role: "user", content: `Trip context: ${JSON.stringify(trip)}\n\nTraveler asks: ${prompt}` }],
    });
    const reply = response.content.filter((part) => part.type === "text").map((part) => part.text).join("").trim();
    if (!reply) return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    return NextResponse.json({ mode: "live", reply });
  } catch (error) {
    console.error("Trip assistant request failed:", error);
    return NextResponse.json({ error: "Could not reach the AI provider. Please try again." }, { status: 502 });
  }
}
