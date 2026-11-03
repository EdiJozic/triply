import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  destination: z.string().trim().min(1).max(100),
  country: z.string().max(100).default(""),
  origin: z.string().max(100).default(""),
  dates: z.string().max(100).default(""),
  dayCount: z.number().int().min(1).max(14),
  travelers: z.number().int().min(1).max(12),
  budget: z.number().positive().max(1_000_000),
  style: z.string().max(80),
  transport: z.string().max(80).default("Flexible"),
  accommodation: z.string().max(100).default("Flexible"),
  interests: z.string().max(500).default(""),
  description: z.string().max(1500).default(""),
});
const itinerarySchema = z.object({
  overview: z.string().min(1).max(800),
  days: z.array(z.object({
    title: z.string().min(1).max(100),
    note: z.string().max(240),
    activities: z.array(z.object({
      name: z.string().min(1).max(120),
      kind: z.enum(["Attraction", "Food", "Stay", "Experience"]),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      duration: z.string().max(30),
      cost: z.number().min(0).max(100_000),
      note: z.string().max(300),
    })).max(8),
  })).max(14),
});

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please provide a destination and valid trip details." }, { status: 400 });
  const input = parsed.data;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const days = Array.from({ length: input.dayCount }, (_, index) => ({
      title: index === 0 ? `Arrive in ${input.destination}` : `Day ${index + 1} · ${input.destination}`,
      note: index === 0 ? "Keep the first day light and leave room to settle in." : "A gentle mix of exploring and unplanned time.",
      activities: [
        { name: `Explore a walkable neighborhood in ${input.destination}`, kind: "Attraction" as const, time: "10:00", duration: "1.5h", cost: 0, note: "Illustrative idea only. Choose a safe, accessible route locally." },
        { name: `Enjoy a relaxed local lunch`, kind: "Food" as const, time: "12:30", duration: "1.5h", cost: Math.round(input.budget / Math.max(input.dayCount * input.travelers, 1) * 0.12), note: "Restaurant and price are not verified; check locally." },
        { name: `Unhurried afternoon in ${input.destination}`, kind: "Experience" as const, time: "15:30", duration: "2h", cost: 0, note: `Shape this around ${input.interests || input.style}. Details are unverified.` },
      ],
    }));
    return NextResponse.json({ mode: "demo", itinerary: { overview: `A relaxed ${input.dayCount}-day trip to ${input.destination}, paced around ${input.style}. Suggestions are illustrative and not verified local facts.`, days } });
  }
  try {
    const anthropic = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-7-sonnet-latest",
      max_tokens: 5000,
      system: "You are Triply, a thoughtful travel-planning assistant. Return only valid JSON matching the requested schema. All suggested venues, locations, hours, availability and prices are unverified ideas; never imply they are real or checked. Use broad activity categories and conservative cost estimates in the supplied currency. Plan a relaxed, practical pace and include daily free time.",
      messages: [{ role: "user", content: `Create exactly ${input.dayCount} itinerary days as JSON in this shape: {"overview":"string","days":[{"title":"string","note":"string","activities":[{"name":"string","kind":"Attraction|Food|Stay|Experience","time":"HH:MM","duration":"string","cost":0,"note":"string"}]}]}. Each day should have 2-4 activities. Destination: ${input.destination}, ${input.country}. Starting from: ${input.origin || "not provided"}. Date range: ${input.dates}. Travelers: ${input.travelers}. Total trip budget: ${input.budget} EUR. Style: ${input.style}. Transport preference: ${input.transport}. Accommodation preference: ${input.accommodation}. Interests: ${input.interests}. Additional wishes: ${input.description}. Treat prices as clearly labeled rough estimates, not quotes. Do not invent opening times or booking availability.` }],
    });
    const text = completion.content.filter((part) => part.type === "text").map((part) => part.text).join("").replace(/^```(?:json)?\s*|\s*```$/g, "");
    const decoded: unknown = JSON.parse(text);
    const itinerary = itinerarySchema.parse(decoded);
    if (itinerary.days.length !== input.dayCount) return NextResponse.json({ error: "The AI provider returned an itinerary with the wrong number of days. Please retry." }, { status: 502 });
    return NextResponse.json({ mode: "live", itinerary });
  } catch (error) {
    console.error("Trip itinerary generation failed:", error);
    return NextResponse.json({ error: "Could not generate a validated itinerary. Check the AI provider configuration and try again." }, { status: 502 });
  }
}
