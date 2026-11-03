import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({ city: z.string().trim().min(1).max(100) });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Provide a destination city." }, { status: 400 });
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return NextResponse.json({ configured: false, error: "Weather forecast is unavailable until an API key is configured." }, { status: 503 });
  try {
    const endpoint = new URL("https://api.openweathermap.org/data/2.5/forecast");
    endpoint.searchParams.set("q", parsed.data.city);
    endpoint.searchParams.set("appid", key);
    endpoint.searchParams.set("units", "metric");
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenWeather request failed:", response.status, detail.slice(0, 400));
      return NextResponse.json({ error: "Weather could not be retrieved for this destination." }, { status: response.status === 404 ? 404 : 502 });
    }
    const data = await response.json();
    return NextResponse.json({
      configured: true,
      city: data.city?.name,
      forecast: data.list.slice(0, 8).map((item: { dt: number; main: { temp: number }; weather: { description: string }[]; pop: number }) => ({
        at: new Date(item.dt * 1000).toISOString(),
        temperatureC: item.main.temp,
        condition: item.weather[0]?.description ?? "Unknown",
        precipitationProbability: item.pop,
      })),
    });
  } catch (error) {
    console.error("OpenWeather request failed:", error);
    return NextResponse.json({ error: "Could not reach the weather service." }, { status: 502 });
  }
}
