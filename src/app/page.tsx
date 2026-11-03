"use client";

import {
  ArrowDownRight, ArrowLeft, ArrowRight, Bookmark, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Compass, DollarSign, Ellipsis, ExternalLink, Globe2, Heart,
  Hotel, Map, MapPin, Menu, MessageCircle, Minus, Pencil, Plane, Plus, Search, Send,
  Settings2, Sparkles, Sun, Ticket, Trash2, Utensils, Wallet, X,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type Place = {
  id: string;
  name: string;
  kind: "Attraction" | "Food" | "Stay" | "Experience";
  time: string;
  duration: string;
  cost: number;
  note: string;
  completed: boolean;
  image: string;
  verified: boolean;
};
type Day = { id: string; date: string; title: string; places: Place[]; note: string };
type Expense = { id: string; title: string; category: string; amount: number; date: string };
type Trip = {
  id: string;
  city: string;
  country: string;
  origin: string;
  dates: string;
  image: string;
  budget: number;
  travelers: number;
  style: string;
  transport: string;
  accommodation: string;
  status: string;
  days: Day[];
  expenses: Expense[];
};
type Section = "Overview" | "My trips" | "Itinerary" | "Explore" | "Saved places" | "Budget planner" | "AI assistant" | "Settings";

const photos = {
  amalfi: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=85",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=85",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
  lisbon: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  coast: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
  museum: "https://images.unsplash.com/photo-1566139884669-1c0c61a11b49?auto=format&fit=crop&w=800&q=80",
};

const sampleTrip: Trip = {
  id: "trip-amalfi",
  city: "Amalfi Coast",
  country: "Italy",
  origin: "",
  dates: "Jun 12 – 18, 2026",
  image: photos.amalfi,
  budget: 2400,
  travelers: 2,
  style: "Slow & scenic",
  transport: "Walk & public transport",
  accommodation: "Small hotel or guesthouse",
  status: "Planning",
  days: [
    { id: "day-1", date: "FRI, JUN 12", title: "Arrival in Positano", note: "Keep it easy after the journey.", places: [
      { id: "p1", name: "Check in & settle in", kind: "Stay", time: "14:00", duration: "1h", cost: 0, note: "Leave room for a slow start.", completed: false, image: photos.coast, verified: false },
      { id: "p2", name: "Wander the old lanes", kind: "Attraction", time: "16:00", duration: "1.5h", cost: 0, note: "A gentle introduction to the town.", completed: false, image: photos.amalfi, verified: false },
      { id: "p3", name: "Dinner overlooking the sea", kind: "Food", time: "19:30", duration: "1.5h", cost: 72, note: "A relaxed first-night dinner.", completed: false, image: photos.food, verified: false },
    ] },
    { id: "day-2", date: "SAT, JUN 13", title: "Coastal views & slow mornings", note: "A little exploring, plenty of time to linger.", places: [
      { id: "p4", name: "Coffee & cornetto", kind: "Food", time: "09:00", duration: "45m", cost: 18, note: "Take breakfast at your own pace.", completed: false, image: photos.food, verified: false },
      { id: "p5", name: "Path of the Gods", kind: "Experience", time: "10:30", duration: "3h", cost: 24, note: "Check local trail conditions before setting out.", completed: false, image: photos.coast, verified: false },
      { id: "p6", name: "Free afternoon in Positano", kind: "Attraction", time: "15:00", duration: "2h", cost: 0, note: "Swim, browse, or do absolutely nothing.", completed: false, image: photos.amalfi, verified: false },
    ] },
    { id: "day-3", date: "SUN, JUN 14", title: "A day in Amalfi", note: "Take the ferry if conditions allow.", places: [
      { id: "p7", name: "Amalfi Cathedral & piazza", kind: "Attraction", time: "10:00", duration: "2h", cost: 16, note: "A suggested stop — verify opening hours locally.", completed: false, image: photos.rome, verified: false },
      { id: "p8", name: "Long lunch in Amalfi", kind: "Food", time: "13:00", duration: "1.5h", cost: 64, note: "Choose a spot when you arrive.", completed: false, image: photos.food, verified: false },
    ] },
  ],
  expenses: [
    { id: "e1", title: "Boutique stay · deposit", category: "Accommodation", amount: 460, date: "Jun 12" },
    { id: "e2", title: "Ferry tickets", category: "Transport", amount: 48, date: "Jun 13" },
    { id: "e3", title: "Dinner reservation", category: "Food", amount: 72, date: "Jun 12" },
    { id: "e4", title: "Trail guide", category: "Activities", amount: 24, date: "Jun 13" },
  ],
};

const initialTrips = [
  sampleTrip,
  { ...sampleTrip, id: "trip-rome", city: "Rome", country: "Italy", dates: "Sep 8 – 12, 2026", image: photos.rome, budget: 1200, status: "Draft", days: [], expenses: [] },
  { ...sampleTrip, id: "trip-kyoto", city: "Kyoto", country: "Japan", dates: "Oct 18 – 26, 2026", image: photos.kyoto, budget: 3200, status: "Draft", days: [], expenses: [] },
];

const popularDestinations = [
  { city: "Lisbon", country: "Portugal", image: photos.lisbon, tag: "City & coast", price: "€€", description: "Sun-washed streets, soulful food, and the long way home." },
  { city: "Kyoto", country: "Japan", image: photos.kyoto, tag: "Culture", price: "€€", description: "Quiet temples, leafy lanes, and moments that slow you down." },
  { city: "Amalfi Coast", country: "Italy", image: photos.amalfi, tag: "Coastal escape", price: "€€€", description: "Small coastal towns made for beautiful, unhurried days." },
  { city: "Paris", country: "France", image: photos.paris, tag: "Romantic", price: "€€€", description: "A neighborhood at a time. No checklist required." },
];

const categoryColors: Record<string, string> = {
  Accommodation: "#e7a985", Food: "#9bc0a8", Transport: "#9eb2d8",
  Activities: "#c5a6d9", Shopping: "#e3c278", Other: "#9da3a0",
};

const money = (amount: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export default function Triply() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("Overview");
  const [trips, setTrips] = useState(initialTrips);
  const [activeTripId, setActiveTripId] = useState(sampleTrip.id);
  const [savedPlaces, setSavedPlaces] = useState<string[]>(["Kyoto", "Lisbon"]);
  const [query, setQuery] = useState("");
  const [showTripWizard, setShowTripWizard] = useState(false);
  const [tripPrefill, setTripPrefill] = useState<{ destination: string; country: string } | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("triply-workspace-v1");
        if (saved) {
          const data = JSON.parse(saved);
          if (Array.isArray(data.trips)) setTrips(data.trips);
          if (Array.isArray(data.savedPlaces)) setSavedPlaces(data.savedPlaces);
        }
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get("trip")) setActiveTripId(queryParams.get("trip")!);
        if (queryParams.get("page") === "landing") setSection("Explore");
      } catch (error) {
        console.error("Could not load the saved Triply workspace.", error);
      }
    });
    void fetch("/api/trip-planner")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check the AI provider configuration.");
        return response.json();
      })
      .then((result) => { if (active) setDemoMode(!result.configured); })
      .catch((error: unknown) => console.error("Triply configuration check failed.", error));
    return () => { active = false; window.cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!trips.length) return;
    try { localStorage.setItem("triply-workspace-v1", JSON.stringify({ trips, savedPlaces })); }
    catch (error) { console.error("Could not save your Triply workspace.", error); }
  }, [trips, savedPlaces]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeTrip = trips.find((trip) => trip.id === activeTripId) ?? trips[0] ?? sampleTrip;
  const activePlaces = activeTrip.days.flatMap((day) => day.places);
  const estimatedTotal = activePlaces.reduce((sum, place) => sum + place.cost, 0);
  const spent = activeTrip.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(0, activeTrip.budget - spent);
  const filteredDestinations = popularDestinations.filter((destination) => `${destination.city} ${destination.country} ${destination.tag}`.toLowerCase().includes(query.toLowerCase()));

  const updateTrip = (id: string, updater: (trip: Trip) => Trip) => {
    setTrips((current) => current.map((trip) => trip.id === id ? updater(trip) : trip));
  };
  const updatePlace = (placeId: string, updater: (place: Place) => Place) => {
    updateTrip(activeTrip.id, (trip) => ({ ...trip, days: trip.days.map((day) => ({ ...day, places: day.places.map((place) => place.id === placeId ? updater(place) : place) })) }));
  };
  const removePlace = (placeId: string) => {
    updateTrip(activeTrip.id, (trip) => ({ ...trip, days: trip.days.map((day) => ({ ...day, places: day.places.filter((place) => place.id !== placeId) })) }));
    setToast("Activity removed");
  };
  const addPlace = (dayId: string) => {
    updateTrip(activeTrip.id, (trip) => ({ ...trip, days: trip.days.map((day) => day.id === dayId ? { ...day, places: [...day.places, { id: makeId("place"), name: "New activity", kind: "Experience", time: "15:00", duration: "1h", cost: 0, note: "", completed: false, image: photos.coast, verified: false }] } : day) }));
    setToast("Activity added to your day");
  };
  const addDay = () => {
    updateTrip(activeTrip.id, (trip) => {
      const year = trip.dates.match(/\b20\d{2}\b/)?.[0] ?? String(new Date().getFullYear());
      const startDate = new Date(`${year} ${trip.dates.split("–")[0].split(",")[0].trim()}`);
      const nextDate = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
      nextDate.setDate(nextDate.getDate() + trip.days.length);
      const dayNumber = trip.days.length + 1;
      const nextDay: Day = { id: makeId("day"), date: nextDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase(), title: `Day ${dayNumber} · ${trip.city}`, note: "A gentle mix of exploring and unplanned time.", places: [] };
      return { ...trip, days: [...trip.days, nextDay] };
    });
    setToast("Day added to your itinerary");
  };
  const createTrip = (values: { destination: string; country: string; origin: string; start: string; end: string; budget: number; travelers: number; style: string; transport: string; accommodation: string; interests: string; description: string }) => {
    const duration = Math.max(1, Math.min(14, Math.ceil((new Date(values.end).getTime() - new Date(values.start).getTime()) / 86_400_000) || 1));
    const startDate = new Date(`${values.start}T12:00:00`);
    const days: Day[] = Array.from({ length: duration }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        id: makeId("day"),
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase(),
        title: index === 0 ? `Arrive in ${values.destination}` : `Day ${index + 1} · ${values.destination}`,
        note: index === 0 ? "Take it easy after the journey." : "A gentle pace, with room to explore.",
        places: [],
      };
    });
    const trip: Trip = { id: makeId("trip"), city: values.destination, country: values.country || "Your destination", origin: values.origin, dates: `${new Date(`${values.start}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(`${values.end}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${new Date(values.start).getFullYear()}`, image: photos.rome, budget: values.budget, travelers: values.travelers, style: values.style, transport: values.transport, accommodation: values.accommodation, status: "Planning", days, expenses: [] };
    setTrips((current) => [trip, ...current]);
    setActiveTripId(trip.id);
    setSection("Itinerary");
    setShowTripWizard(false);
    void generateItinerary(trip, values.interests, values.description);
  };

  const generateItinerary = async (trip: Trip, interests: string, description: string) => {
    setAssistantBusy(true);
    try {
      const response = await fetch("/api/trip-planner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: trip.city, country: trip.country, origin: trip.origin, dates: trip.dates, dayCount: trip.days.length, travelers: trip.travelers, budget: trip.budget, style: trip.style, transport: trip.transport, accommodation: trip.accommodation, interests, description }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not generate an itinerary.");
      const generatedDays: Day[] = result.itinerary.days.map((day: { title: string; note: string; activities: { name: string; kind: Place["kind"]; time: string; duration: string; cost: number; note: string }[] }, index: number) => ({
        ...trip.days[index],
        title: day.title,
        note: day.note,
        places: day.activities.map((activity) => ({ id: makeId("place"), ...activity, completed: false, image: activity.kind === "Food" ? photos.food : activity.kind === "Attraction" ? photos.rome : photos.coast, verified: false })),
      }));
      updateTrip(trip.id, (current) => ({ ...current, days: generatedDays }));
      setToast(result.mode === "demo" ? "Demo itinerary created — suggestions are unverified" : "AI itinerary generated — suggestions are unverified");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Itinerary generation failed.");
    } finally {
      setAssistantBusy(false);
    }
  };

  const addExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const expense = { id: makeId("expense"), title: String(form.get("title")).trim(), category: String(form.get("category")), amount: Number(form.get("amount")), date: String(form.get("date") || "Today") };
    if (!expense.title || !Number.isFinite(expense.amount) || expense.amount <= 0) return;
    updateTrip(activeTrip.id, (trip) => ({ ...trip, expenses: [expense, ...trip.expenses] }));
    setShowExpenseModal(false);
    setToast("Expense added");
  };

  const askAssistant = async (prompt = assistantPrompt) => {
    if (!prompt.trim()) return;
    setAssistantPrompt(prompt);
    setAssistantBusy(true);
    setAssistantReply("");
    try {
      const response = await fetch("/api/trip-assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, trip: activeTrip }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The assistant request failed.");
      setAssistantReply(result.reply);
    } catch (error) {
      setAssistantReply(error instanceof Error ? error.message : "The assistant request failed.");
    } finally {
      setAssistantBusy(false);
    }
  };

  const toggleSaved = (city: string) => {
    setSavedPlaces((current) => current.includes(city) ? current.filter((place) => place !== city) : [...current, city]);
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await createSupabaseBrowserClient().auth.signOut();
        if (error) throw error;
      }
    } catch (error) {
      setToast(error instanceof Error ? `Could not sign out: ${error.message}` : "Could not sign out. Please try again.");
      return;
    }
    localStorage.removeItem("triply-demo-session");
    router.push("/welcome");
  };

  const nav: { name: Section; icon: typeof Compass }[] = [
    { name: "Overview", icon: Compass }, { name: "My trips", icon: Plane },
    { name: "Explore", icon: Globe2 }, { name: "Saved places", icon: Heart },
    { name: "Budget planner", icon: Wallet }, { name: "AI assistant", icon: Sparkles },
  ];

  return (
    <div className="triply-app">
      <aside className={`trip-sidebar ${mobileNav ? "open" : ""}`}>
        <button className="trip-brand" onClick={() => setSection("Overview")}><span className="trip-brand-mark"><Plane size={17} fill="currentColor" /></span>triply<span className="brand-period">.</span></button>
        <button className="trip-workspace"><span className="workspace-emoji">✦</span><span><b>My travels</b><small>Personal workspace</small></span><ChevronDown size={14} /></button>
        <div className="trip-nav-label">YOUR SPACE</div>
        <nav className="trip-nav">{nav.map(({ name, icon: Icon }) => <button key={name} onClick={() => { setSection(name); setMobileNav(false); }} className={`trip-nav-item ${section === name || (name === "My trips" && section === "Itinerary") ? "active" : ""}`}><Icon size={17} strokeWidth={1.8} /><span>{name}</span>{name === "Saved places" && savedPlaces.length > 0 && <small>{savedPlaces.length}</small>}</button>)}</nav>
        <div className="trip-nav-label upcoming-label">UP NEXT</div>
        {trips.slice(0, 3).map((trip) => <button key={trip.id} className={`upcoming-trip ${trip.id === activeTripId ? "selected" : ""}`} onClick={() => { setActiveTripId(trip.id); setSection("Itinerary"); setMobileNav(false); }}><span className="upcoming-thumb" style={{ backgroundImage: `url(${trip.image})` }} /><span><b>{trip.city}</b><small>{trip.dates.split(",")[0]}</small></span><span className="trip-status-dot" /></button>)}
        <div className="sidebar-bottom">
          <div className="sidebar-weather"><div><Sun size={16} /><b>Good day for a getaway</b></div><small>Weather varies by destination · check locally</small></div>
          <button className={`trip-nav-item ${section === "Settings" ? "active" : ""}`} onClick={() => setSection("Settings")}><Settings2 size={17} /><span>Settings</span></button>
          <button className="trip-user" onClick={() => setSection("Settings")}><span className="trip-avatar">E</span><span><b>Edi Jozic</b><small>Free explorer</small></span><Ellipsis size={17} /></button>
        </div>
      </aside>
      {mobileNav && <button className="trip-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
      <main className="trip-main">
        <header className="trip-topbar"><div className="trip-breadcrumb"><button className="trip-menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19} /></button><span>My travels</span><ChevronRight size={14} /><b>{section === "Itinerary" ? activeTrip.city : section}</b></div><div className="topbar-right"><button className="top-search" onClick={() => { setSection("Explore"); document.getElementById("destination-search")?.focus(); }}><Search size={15} /><span>Where to next?</span><kbd>⌘ K</kbd></button><button className="top-icon" onClick={() => setToast("You’re all caught up")} aria-label="Notifications"><span className="notification-dot" />◌</button><button className="top-avatar">E</button></div></header>
        <div className="trip-page">
          {section === "Overview" && <Overview trips={trips} activeTrip={activeTrip} activePlaces={activePlaces} remaining={remaining} onCreate={() => { setTripPrefill(null); setShowTripWizard(true); }} onOpen={(id) => { setActiveTripId(id); setSection("Itinerary"); }} onExplore={() => setSection("Explore")} />}
          {section === "My trips" && <TripsPage trips={trips} onCreate={() => { setTripPrefill(null); setShowTripWizard(true); }} onOpen={(id) => { setActiveTripId(id); setSection("Itinerary"); }} onDelete={(id) => { const trip = trips.find((item) => item.id === id); if (!trip || !window.confirm(`Delete your trip to ${trip.city}?`)) return; const remainingTrips = trips.filter((item) => item.id !== id); setTrips(remainingTrips); if (id === activeTripId && remainingTrips[0]) setActiveTripId(remainingTrips[0].id); setToast("Trip deleted"); }} />}
          {section === "Itinerary" && <ItineraryPage trip={activeTrip} onBack={() => setSection("My trips")} onAddPlace={addPlace} onAddDay={addDay} onReorder={(dayId, fromId, toId) => updateTrip(activeTrip.id, (trip) => ({ ...trip, days: trip.days.map((day) => { if (day.id !== dayId) return day; const places = [...day.places]; const from = places.findIndex((place) => place.id === fromId); const to = places.findIndex((place) => place.id === toId); if (from < 0 || to < 0 || from === to) return day; const [moved] = places.splice(from, 1); places.splice(to, 0, moved); return { ...day, places }; }) }))} onUpdatePlace={updatePlace} onRemovePlace={removePlace} onUpdateNote={(dayId, note) => updateTrip(activeTrip.id, (trip) => ({ ...trip, days: trip.days.map((day) => day.id === dayId ? { ...day, note } : day) }))} onNavigate={setSection} />}
          {section === "Explore" && <ExplorePage query={query} setQuery={setQuery} destinations={filteredDestinations} savedPlaces={savedPlaces} onToggleSaved={toggleSaved} onPlan={(city, country) => { setTripPrefill({ destination: city, country }); setShowTripWizard(true); }} />}
          {section === "Saved places" && <SavedPage savedPlaces={savedPlaces} onToggle={toggleSaved} onExplore={() => setSection("Explore")} />}
          {section === "Budget planner" && <BudgetPage trip={activeTrip} remaining={remaining} spent={spent} estimated={estimatedTotal} onAddExpense={() => setShowExpenseModal(true)} onRemoveExpense={(id) => { updateTrip(activeTrip.id, (trip) => ({ ...trip, expenses: trip.expenses.filter((item) => item.id !== id) })); setToast("Expense removed"); }} />}
          {section === "AI assistant" && <AssistantPage trip={activeTrip} prompt={assistantPrompt} setPrompt={setAssistantPrompt} reply={assistantReply} busy={assistantBusy} demoMode={demoMode} onAsk={askAssistant} />}
          {section === "Settings" && <SettingsPage demoMode={demoMode} onSignOut={signOut} />}
        </div>
      </main>
      {showTripWizard && <TripWizard onClose={() => setShowTripWizard(false)} onCreate={createTrip} prefill={tripPrefill} />}
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onSubmit={addExpense} />}
      {toast && <div className="trip-toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

function Overview({ trips, activeTrip, activePlaces, remaining, onCreate, onOpen, onExplore }: { trips: Trip[]; activeTrip: Trip; activePlaces: Place[]; remaining: number; onCreate: () => void; onOpen: (id: string) => void; onExplore: () => void }) {
  return <>
    <div className="welcome-strip"><div><span className="tiny-eyebrow">TUESDAY, NOVEMBER 3</span><h1>Your next chapter <i>awaits.</i></h1><p>All your travel inspiration, thoughtfully in one place.</p></div><button className="coral-button" onClick={onCreate}><Sparkles size={16} /> Plan a new trip <ArrowRight size={15} /></button></div>
    <section className="hero-trip" style={{ backgroundImage: `linear-gradient(90deg, #102122ed 0%, #102122b8 45%, #10212214 100%), url(${activeTrip.image})` }}>
      <div className="hero-copy"><span className="hero-kicker"><span /> YOUR NEXT ADVENTURE</span><h2>{activeTrip.city}<br /><i>{activeTrip.country}</i></h2><div className="hero-trip-meta"><span><CalendarDays size={14} />{activeTrip.dates}</span><span><Plane size={14} />{activeTrip.travelers} travelers</span></div><button className="hero-open" onClick={() => onOpen(activeTrip.id)}>Open trip <ArrowRight size={14} /></button></div>
      <div className="hero-trip-note"><span>YOUR TRIP, YOUR PACE</span><strong>{activeTrip.style}</strong><small>Made for little detours.</small></div>
      <div className="hero-image-credit">AMALFI COAST · ITALY</div>
    </section>
    <div className="overview-stats"><StatCard label="Trips planned" value={trips.length.toString().padStart(2, "0")} caption="Your story so far" icon={<Plane size={16} />} tone="coral" /><StatCard label="Places saved" value="12" caption="Across 5 destinations" icon={<Bookmark size={16} />} tone="blue" /><StatCard label="Trip budget" value={money(activeTrip.budget)} caption={`${money(remaining)} still to plan`} icon={<Wallet size={16} />} tone="green" /><StatCard label="Activities planned" value={activePlaces.length.toString().padStart(2, "0")} caption="A lovely little itinerary" icon={<Ticket size={16} />} tone="purple" /></div>
    <div className="overview-columns">
      <section className="trip-panel upcoming-panel"><div className="section-heading"><div><span className="tiny-eyebrow">YOUR TRAVEL PLANS</span><h2>A few places on your mind</h2></div><button className="plain-link" onClick={() => onOpen(activeTrip.id)}>View itinerary <ArrowRight size={14} /></button></div><div className="mini-trip-list">{trips.slice(0, 3).map((trip) => <button key={trip.id} className="mini-trip-row" onClick={() => onOpen(trip.id)}><span className="mini-trip-photo" style={{ backgroundImage: `url(${trip.image})` }} /><span className="mini-trip-content"><span className="mini-trip-dates">{trip.dates}</span><b>{trip.city}, {trip.country}</b><small>{trip.days.reduce((sum, day) => sum + day.places.length, 0)} activities · {trip.status}</small></span><span className="mini-trip-arrow"><ArrowRight size={15} /></span></button>)}</div></section>
      <section className="trip-panel inspiration-panel"><div className="section-heading"><div><span className="tiny-eyebrow">A LITTLE INSPIRATION</span><h2>Somewhere new?</h2></div><Compass size={18} className="soft-icon" /></div><div className="inspiration-photo" style={{ backgroundImage: `linear-gradient(0deg,#101d1cdd,transparent 70%),url(${photos.lisbon})` }}><span>PORTUGAL · CITY BREAK</span><strong>Lisbon, at your own pace</strong><button onClick={onExplore}>Explore this destination <ArrowRight size={13} /></button></div><div className="inspiration-foot"><Sparkles size={14} /><span>Made for the way <b>you</b> like to travel.</span></div></section>
    </div>
    <section className="discover-section"><div className="section-heading"><div><span className="tiny-eyebrow">THE WORLD, YOUR WAY</span><h2>Where will you wander?</h2></div><button className="plain-link" onClick={onExplore}>Explore destinations <ArrowRight size={14} /></button></div><div className="destination-cards">{popularDestinations.slice(0, 3).map((destination) => <DestinationCard key={destination.city} destination={destination} saved={false} onToggle={() => {}} onPlan={() => onExplore()} />)}</div></section>
    <div className="overview-bottom"><span><Sparkles size={14} />Every trip starts with a little curiosity.</span><span>All prices shown are estimates · verify details before booking</span></div>
  </>;
}

function StatCard({ label, value, caption, icon, tone }: { label: string; value: string; caption: string; icon: ReactNode; tone: string }) {
  return <div className="overview-stat"><div className="stat-label">{label}<span className={`stat-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{caption}</small></div>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="trip-page-title"><div><span className="tiny-eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function TripsPage({ trips, onCreate, onOpen, onDelete }: { trips: Trip[]; onCreate: () => void; onOpen: (id: string) => void; onDelete: (id: string) => void }) {
  return <><PageTitle eyebrow="ALL YOUR ADVENTURES" title="My trips" description="Every journey, from first idea to final sunset." action={<button className="coral-button" onClick={onCreate}><Plus size={16} /> Plan a trip</button>} /><div className="trip-card-grid">{trips.map((trip) => <article className="trip-card" key={trip.id}><button className="trip-card-photo" style={{ backgroundImage: `linear-gradient(0deg,#111d1cd9,transparent 68%),url(${trip.image})` }} onClick={() => onOpen(trip.id)}><span className="trip-card-tag">{trip.status}</span><span className="trip-card-place">{trip.city}<small>{trip.country}</small></span><span className="trip-card-open"><ArrowRight size={15} /></span></button><div className="trip-card-body"><div className="trip-card-meta"><span><CalendarDays size={13} />{trip.dates}</span><button aria-label={`Delete ${trip.city} trip`} onClick={() => onDelete(trip.id)}><Trash2 size={14} /></button></div><div className="trip-card-details"><span><MapPin size={13} />{trip.days.length} days</span><span><Wallet size={13} />{money(trip.budget)} budget</span><span><Ticket size={13} />{trip.days.reduce((sum, day) => sum + day.places.length, 0)} plans</span></div></div></article>)}<button className="trip-card new-trip-card" onClick={onCreate}><span><Plus size={24} /></span><b>Your next adventure?</b><small>Let’s dream something up.</small></button></div></>;
}

function ItineraryPage({ trip, onBack, onAddPlace, onAddDay, onReorder, onUpdatePlace, onRemovePlace, onUpdateNote, onNavigate }: { trip: Trip; onBack: () => void; onAddPlace: (dayId: string) => void; onAddDay: () => void; onReorder: (dayId: string, fromId: string, toId: string) => void; onUpdatePlace: (placeId: string, updater: (place: Place) => Place) => void; onRemovePlace: (placeId: string) => void; onUpdateNote: (dayId: string, note: string) => void; onNavigate: (section: Section) => void }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [mapPlace, setMapPlace] = useState<Place | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [weather, setWeather] = useState<{ city: string; forecast?: { temperatureC: number; condition: string }; message: string } | null>(null);
  const currentWeather = weather?.city === trip.city ? weather : null;
  const days = trip.days;
  const day = days[selectedDay];
  const total = days.flatMap((item) => item.places).reduce((sum, place) => sum + place.cost, 0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/weather?city=${encodeURIComponent(trip.city)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as { forecast?: { temperatureC: number; condition: string }[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Forecast unavailable right now.");
        const forecast = result.forecast?.[0];
        if (!forecast) throw new Error("No near-term forecast is available.");
        setWeather({ city: trip.city, forecast, message: "Near-term only · verify locally" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setWeather({ city: trip.city, message: error instanceof Error ? error.message : "Forecast unavailable right now." });
      });
    return () => controller.abort();
  }, [trip.city]);
  const saveActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPlace) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const time = String(form.get("time") ?? "");
    const duration = String(form.get("duration") ?? "").trim();
    const cost = Number(form.get("cost"));
    const note = String(form.get("note") ?? "").trim();
    if (!name || !time || !duration || !Number.isFinite(cost) || cost < 0) return;
    onUpdatePlace(editingPlace.id, (place) => ({ ...place, name, time, duration, cost, note }));
    setEditingPlace(null);
  };
  return <>
    <button className="back-link" onClick={onBack}><ArrowLeft size={14} /> All trips</button>
    <div className="itinerary-title-row"><div><span className="tiny-eyebrow">{trip.country.toUpperCase()} · {trip.style.toUpperCase()}</span><h1>{trip.city}<span className="title-dot">.</span></h1><div className="itinerary-meta"><span><CalendarDays size={14} />{trip.dates}</span><span><Plane size={14} />{trip.travelers} travelers</span><span><Wallet size={14} />{money(trip.budget)} budget</span></div></div><div className="itinerary-actions"><button className="outline-button" onClick={() => onNavigate("Budget planner")}><Wallet size={14} /> Budget</button><button className="coral-button" onClick={() => onNavigate("AI assistant")}><Sparkles size={14} /> Ask Triply</button></div></div>
    <div className="trip-tabs"><button className="selected"><CalendarDays size={14} />Itinerary</button><button onClick={() => onNavigate("Budget planner")}><Wallet size={14} />Budget</button><button onClick={() => onNavigate("Explore")}><Map size={14} />Explore</button><button onClick={() => onNavigate("AI assistant")}><MessageCircle size={14} />Assistant</button></div>
    <div className="itinerary-layout">
      <section className="itinerary-main">
        <div className="day-selector">{days.map((item, index) => <button key={item.id} className={index === selectedDay ? "selected" : ""} onClick={() => setSelectedDay(index)}><small>{item.date.split(",")[0]}</small><b>{item.date.split(" ").slice(-1)[0]}</b><span>{item.places.length} plans</span></button>)}<button className="add-day" onClick={() => { onAddDay(); setSelectedDay(days.length); }}><Plus size={15} /><span>Add day</span></button></div>
        {day ? <>
          <div className="day-intro"><div><span className="tiny-eyebrow">{day.date}</span><h2>{day.title}</h2><input aria-label="Day notes" className="day-note-input" value={day.note} onChange={(event) => onUpdateNote(day.id, event.target.value)} /></div><div className="day-weather"><Sun size={19} /><b>{currentWeather?.forecast ? `${currentWeather.forecast.condition} · ${Math.round(currentWeather.forecast.temperatureC)}°C` : currentWeather?.message ?? "Checking forecast availability…"}</b><small>{currentWeather?.forecast ? currentWeather.message : "Forecasts are only available for the near term."}</small></div></div>
          <div className="schedule-label"><span>YOUR DAY, YOUR PACE</span><button onClick={() => onAddPlace(day.id)}><Plus size={14} /> Add activity</button></div>
          <div className="schedule-list">{day.places.map((place, index) => <ActivityCard key={place.id} place={place} onToggle={() => onUpdatePlace(place.id, (item) => ({ ...item, completed: !item.completed }))} onRemove={() => onRemovePlace(place.id)} onEdit={() => setEditingPlace(place)} onShowMap={() => setMapPlace(place)} onReorder={(fromId) => onReorder(day.id, fromId, place.id)} isLast={index === day.places.length - 1} />)}{day.places.length === 0 && <div className="empty-day"><Sparkles size={20} /><b>A fresh day, full of possibility.</b><span>Ask Triply to create a gentle itinerary for this day.</span><button className="coral-button" onClick={() => onNavigate("AI assistant")}>Plan this day <ArrowRight size={14} /></button></div>}</div>
          <button className="add-activity-wide" onClick={() => onAddPlace(day.id)}><Plus size={15} /> Add another activity</button>
        </> : <div className="empty-day"><Plane size={22} /><b>Let’s make this trip yours.</b><span>Choose an AI-generated itinerary or add places one by one.</span><button className="coral-button" onClick={() => onNavigate("AI assistant")}><Sparkles size={14} /> Generate an itinerary</button></div>}
      </section>
      <aside className="itinerary-side">
        <div className="map-card"><div className="map-preview"><div className="map-grid" /><div className="map-water" /><svg className="map-route" viewBox="0 0 300 180" preserveAspectRatio="none"><path d="M56 126 C82 115,80 73,121 79 S157 123,191 97 S218 49,251 56" fill="none" stroke="#d97d69" strokeWidth="2.5" strokeDasharray="5 5" /></svg>{(day?.places ?? []).slice(0, 5).map((place, index) => <button key={place.id} className={`map-marker marker-${index}`} onClick={() => setMapPlace(place)} aria-label={`View ${place.name}`}><MapPin size={14} fill="currentColor" /></button>)}<span className="map-label map-label-one">{trip.city}</span><span className="map-label map-label-two">{trip.country}</span><div className="map-water-label">MAP PREVIEW</div><div className="map-placeholder"><Map size={14} /> Illustrative only · locations unverified</div></div><div className="map-card-foot"><div><Map size={14} /><span><b>Your trip map</b><small>{day?.places.length ?? 0} suggested places today</small></span></div><button aria-label="Open map details" onClick={() => setMapPlace(day?.places[0] ?? null)}><ExternalLink size={14} /></button></div></div>
        {mapPlace && <div className="selected-map-place"><button className="close-map-place" onClick={() => setMapPlace(null)}><X size={14} /></button><span className="tiny-eyebrow">SUGGESTED PLACE · NOT VERIFIED</span><b>{mapPlace.name}</b><small>Address and exact location unavailable in demo mode. Verify before traveling.</small></div>}
        <div className="trip-summary-card"><span className="tiny-eyebrow">A LITTLE OVERVIEW</span><h3>This trip, so far.</h3><div className="summary-row"><span><CalendarDays size={14} />Days planned</span><b>{trip.days.length} days</b></div><div className="summary-row"><span><Ticket size={14} />Activities</span><b>{trip.days.flatMap((item) => item.places).length}</b></div><div className="summary-row"><span><DollarSign size={14} />Estimated activities</span><b>{money(total)}</b></div><div className="summary-budget"><div><span>Trip budget</span><b>{money(trip.budget)}</b></div><div className="summary-progress"><span style={{ width: `${Math.min(100, total / Math.max(trip.budget, 1) * 100)}%` }} /></div><small>Estimates only · verify locally</small></div><button className="summary-budget-link" onClick={() => onNavigate("Budget planner")}>Open budget planner <ArrowRight size={13} /></button></div>
        <div className="trip-note-card"><Sparkles size={15} /><p><b>A note on recommendations</b><br />AI suggestions are starting points, not verified listings. Check opening hours, availability, and prices before you go.</p></div>
      </aside>
    </div>
    {editingPlace && <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingPlace(null); }}><form className="expense-modal activity-edit-modal" onSubmit={saveActivity}><div className="expense-modal-head"><div><span className="tiny-eyebrow">MAKE IT YOURS</span><h2>Edit activity</h2></div><button type="button" className="modal-close" onClick={() => setEditingPlace(null)} aria-label="Close activity editor"><X size={17} /></button></div><label className="wizard-field"><span>ACTIVITY</span><input name="name" required maxLength={120} defaultValue={editingPlace.name} /></label><div className="wizard-row"><label className="wizard-field"><span>TIME</span><input type="time" name="time" required defaultValue={editingPlace.time} /></label><label className="wizard-field"><span>DURATION</span><input name="duration" required maxLength={30} defaultValue={editingPlace.duration} /></label></div><label className="wizard-field"><span>ESTIMATED COST · EUR</span><input type="number" name="cost" required min="0" step="0.01" defaultValue={editingPlace.cost} /></label><label className="wizard-field"><span>YOUR NOTE</span><textarea name="note" rows={3} maxLength={300} defaultValue={editingPlace.note} /></label><div className="wizard-footer"><button type="button" className="wizard-back" onClick={() => setEditingPlace(null)}>Cancel</button><button className="coral-button"><Check size={14} /> Save activity</button></div></form></div>}
  </>;
}

function ActivityCard({ place, onToggle, onRemove, onEdit, onShowMap, onReorder, isLast }: { place: Place; onToggle: () => void; onRemove: () => void; onEdit: () => void; onShowMap: () => void; onReorder: (fromId: string) => void; isLast: boolean }) {
  const icon = place.kind === "Food" ? <Utensils size={14} /> : place.kind === "Stay" ? <Hotel size={14} /> : place.kind === "Attraction" ? <Compass size={14} /> : <Sparkles size={14} />;
  return <div className="activity-row" draggable onDragStart={(event) => { event.dataTransfer.setData("text/place-id", place.id); event.dataTransfer.effectAllowed = "move"; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const fromId = event.dataTransfer.getData("text/place-id"); if (fromId) onReorder(fromId); }}><div className="activity-timeline"><button className={`timeline-check ${place.completed ? "done" : ""}`} onClick={onToggle} aria-label={place.completed ? "Mark incomplete" : "Mark complete"}>{place.completed && <Check size={11} />}</button>{!isLast && <span />}</div><div className={`activity-content ${place.completed ? "completed" : ""}`}><div className="activity-topline"><span className="activity-time">{place.time}</span><span className={`activity-kind kind-${place.kind.toLowerCase()}`}>{icon}{place.kind}</span><button className="activity-options" aria-label={`Edit ${place.name}`} onClick={onEdit}><Pencil size={13} /></button><button className="activity-options" aria-label={`Remove ${place.name}`} onClick={onRemove}><Ellipsis size={17} /></button></div><button className="activity-card" onClick={onShowMap}><div className="activity-photo" style={{ backgroundImage: `url(${place.image})` }} /><div className="activity-card-copy"><div><h3>{place.name}</h3>{!place.verified && <span className="unverified-label">SUGGESTED · VERIFY LOCALLY</span>}</div><p>{place.note || "Add a note or check this place before you go."}</p><div className="activity-meta"><span><span className="mini-clock">◷</span>{place.duration}</span><span><Wallet size={12} />{place.cost ? `~${money(place.cost)} est.` : "Free / not priced"}</span><span><MapPin size={12} />Location unverified</span></div></div><ChevronRight className="activity-arrow" size={15} /></button></div></div>;
}

function ExplorePage({ query, setQuery, destinations, savedPlaces, onToggleSaved, onPlan }: { query: string; setQuery: (query: string) => void; destinations: typeof popularDestinations; savedPlaces: string[]; onToggleSaved: (city: string) => void; onPlan: (city: string, country: string) => void }) {
  const [filter, setFilter] = useState("All moods");
  const moods = ["All moods", "City & coast", "Culture", "Coastal escape", "Romantic"];
  const visible = filter === "All moods" ? destinations : destinations.filter((destination) => destination.tag === filter);
  return <><PageTitle eyebrow="A WORLD OF POSSIBILITY" title="Find your somewhere" description="Thoughtful inspiration for wherever your heart's leaning." action={<div className="demo-data-chip"><span />Sample destinations · details unverified</div>} /><div className="explore-hero"><div><span className="tiny-eyebrow">TAKE THE SCENIC ROUTE</span><h2>Less itinerary.<br /><i>More feeling.</i></h2><p>A few places we think you might love — and space to make them your own.</p></div><span className="explore-hero-caption">CURATED FOR THE CURIOUS</span></div><div className="explore-tools"><label className="destination-search"><Search size={16} /><input id="destination-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a place, country, or feeling..." /><kbd>⌘ K</kbd></label><div className="mood-filters">{moods.map((mood) => <button key={mood} className={filter === mood ? "active" : ""} onClick={() => setFilter(mood)}>{mood}</button>)}</div></div><div className="explore-feature"><div className="feature-image" style={{ backgroundImage: `linear-gradient(0deg,#12201fd9,transparent 65%),url(${photos.kyoto})` }}><span>THIS WEEK’S SLOW TRAVEL PICK</span><strong>Kyoto, beyond the guidebook</strong><small>Find stillness in temple gardens and quiet morning lanes.</small></div><div className="feature-copy"><Sparkles size={18} /><h3>Travel like you mean it.</h3><p>Save what speaks to you. Triply can help turn a collection of little sparks into a journey.</p><button className="plain-link" onClick={() => onPlan("Kyoto", "Japan")}>Plan a trip to Kyoto <ArrowRight size={14} /></button><div className="feature-note">Suggestions are inspirational and not verified listings.</div></div></div><div className="section-heading explore-list-heading"><div><span className="tiny-eyebrow">A FEW PLACES TO BEGIN</span><h2>Go where the feeling takes you.</h2></div><span className="results-count">{visible.length} destinations</span></div><div className="destination-grid">{visible.map((destination) => <DestinationCard key={destination.city} destination={destination} saved={savedPlaces.includes(destination.city)} onToggle={() => onToggleSaved(destination.city)} onPlan={() => onPlan(destination.city, destination.country)} />)}</div></>;
}

function DestinationCard({ destination, saved, onToggle, onPlan }: { destination: (typeof popularDestinations)[number]; saved: boolean; onToggle: () => void; onPlan: () => void }) {
  return <article className="destination-card"><div className="destination-image" style={{ backgroundImage: `url(${destination.image})` }}><span className="destination-price">{destination.price}</span><button className={`save-heart ${saved ? "saved" : ""}`} onClick={onToggle} aria-label={saved ? `Unsave ${destination.city}` : `Save ${destination.city}`}><Heart size={16} fill={saved ? "currentColor" : "none"} /></button><span className="destination-tag">{destination.tag}</span></div><div className="destination-copy"><div><h3>{destination.city}</h3><small>{destination.country}</small></div><p>{destination.description}</p><button onClick={onPlan}>Plan a trip <ArrowRight size={13} /></button></div></article>;
}

function SavedPage({ savedPlaces, onToggle, onExplore }: { savedPlaces: string[]; onToggle: (city: string) => void; onExplore: () => void }) {
  const savedDestinations = popularDestinations.filter((destination) => savedPlaces.includes(destination.city));
  return <><PageTitle eyebrow="LITTLE SPARKS OF INSPIRATION" title="Saved places" description="The places you want to come back to." action={<button className="outline-button" onClick={onExplore}><Compass size={14} /> Explore places</button>} />{savedDestinations.length ? <div className="destination-grid">{savedDestinations.map((destination) => <DestinationCard key={destination.city} destination={destination} saved onToggle={() => onToggle(destination.city)} onPlan={onExplore} />)}</div> : <div className="empty-state"><Bookmark size={24} /><h2>Your saved places will live here.</h2><p>Keep a little list of places that make you feel something.</p><button className="coral-button" onClick={onExplore}>Find somewhere <ArrowRight size={14} /></button></div>}</>;
}

function BudgetPage({ trip, remaining, spent, estimated, onAddExpense, onRemoveExpense }: { trip: Trip; remaining: number; spent: number; estimated: number; onAddExpense: () => void; onRemoveExpense: (id: string) => void }) {
  const categoryTotals = Object.keys(categoryColors).map((category) => ({ name: category, value: trip.expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0), color: categoryColors[category] })).filter((item) => item.value > 0);
  const dailyData = trip.expenses.reduce<{ day: string; spend: number }[]>((data, expense) => {
    const existing = data.find((item) => item.day === expense.date);
    if (existing) existing.spend += expense.amount;
    else data.push({ day: expense.date, spend: expense.amount });
    return data;
  }, []);
  const progress = Math.min(100, Math.round(spent / Math.max(trip.budget, 1) * 100));
  return <><PageTitle eyebrow={`YOUR MONEY, YOUR WAY · ${trip.city.toUpperCase()}`} title="Budget planner" description="A little clarity for the spending side of travel." action={<button className="coral-button" onClick={onAddExpense}><Plus size={15} /> Add expense</button>} /><div className="budget-trip-picker"><span><MapPin size={14} />Planning for</span><b>{trip.city}, {trip.country}</b><span className="budget-currency">EUR · estimates & actuals</span></div><div className="budget-hero-cards"><div className="budget-hero-main"><span className="tiny-eyebrow">TRIP BUDGET</span><strong>{money(trip.budget)}</strong><div className="budget-meter"><span style={{ width: `${progress}%` }} /></div><div className="budget-breakdown"><span><i className="spent-dot" />{money(spent)} actual spending</span><span><i className="remaining-dot" />{money(remaining)} remaining</span></div><small>Activity estimates so far: ~{money(estimated)} · not verified prices</small></div><div className="budget-hero-small"><span className="budget-small-icon coral"><Wallet size={16} /></span><small>ACTUAL SPENDING</small><strong>{money(spent)}</strong><span>Across {trip.expenses.length} recorded expenses</span></div><div className="budget-hero-small"><span className="budget-small-icon green"><ArrowDownRight size={16} /></span><small>LEFT TO SPEND</small><strong>{money(remaining)}</strong><span>{progress}% of your budget used</span></div></div><div className="budget-charts"><section className="trip-panel budget-pie-panel"><div className="section-heading"><div><span className="tiny-eyebrow">WHERE IT GOES</span><h2>Spending by category</h2></div><span className="actual-chip">ACTUAL</span></div>{categoryTotals.length ? <><div className="budget-pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryTotals} innerRadius={58} outerRadius={83} paddingAngle={3} dataKey="value" stroke="none">{categoryTotals.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: "#fbf8f2", border: "1px solid #e8e2d9", borderRadius: 8, color: "#253332", fontSize: 11 }} /></PieChart></ResponsiveContainer><div className="pie-center"><b>{money(spent)}</b><small>spent</small></div></div><div className="category-legend">{categoryTotals.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{money(item.value)}</b></div>)}</div></> : <div className="chart-empty">Add an expense to see your spending categories.</div>}</section><section className="trip-panel daily-spend-panel"><div className="section-heading"><div><span className="tiny-eyebrow">A DAY AT A TIME</span><h2>Daily spending</h2></div><span className="actual-chip">ACTUAL</span></div>{dailyData.length ? <div className="daily-spend-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dailyData} margin={{ left: -20, right: 5, top: 10, bottom: 0 }}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d98270" stopOpacity={.23} /><stop offset="100%" stopColor="#d98270" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e9e3da" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#858c87", fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#858c87", fontSize: 9 }} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: "#fbf8f2", border: "1px solid #e8e2d9", borderRadius: 8, color: "#253332", fontSize: 11 }} /><Area type="monotone" dataKey="spend" stroke="#d98270" strokeWidth={2} fill="url(#spendFill)" /></AreaChart></ResponsiveContainer></div> : <div className="chart-empty">Your daily spending will appear once you add expenses.</div>}</section></div><section className="trip-panel expenses-panel"><div className="section-heading"><div><span className="tiny-eyebrow">KEEP IT ALL TOGETHER</span><h2>Recent expenses</h2></div><span className="actual-chip">ACTUAL</span></div><div className="expense-table"><div className="expense-table-head"><span>WHAT</span><span>CATEGORY</span><span>DATE</span><span>AMOUNT</span><span /></div>{trip.expenses.map((expense) => <div className="expense-row" key={expense.id}><span className="expense-title"><i style={{ background: categoryColors[expense.category] ?? categoryColors.Other }} /><b>{expense.title}</b></span><span className="expense-category">{expense.category}</span><span className="expense-date">{expense.date}</span><strong>{money(expense.amount)}</strong><button onClick={() => onRemoveExpense(expense.id)} aria-label={`Delete ${expense.title}`}><Trash2 size={13} /></button></div>)}{trip.expenses.length === 0 && <div className="chart-empty">No actual expenses yet. Add one to start tracking.</div>}</div></section><div className="estimate-note"><CircleHelp size={15} /><span><b>A note on numbers:</b> AI activity costs are rough estimates, not quotes. Your actual expenses are recorded separately. Currency conversion isn’t configured.</span></div></>;
}

function AssistantPage({ trip, prompt, setPrompt, reply, busy, demoMode, onAsk }: { trip: Trip; prompt: string; setPrompt: (prompt: string) => void; reply: string; busy: boolean; demoMode: boolean; onAsk: (prompt?: string) => void }) {
  const prompts = ["Make tomorrow feel a little less rushed", "Help us find an alternative if it rains", "What should we keep in mind for this destination?", "Can we trim our trip budget?"];
  return <><PageTitle eyebrow={`YOUR TRAVEL COMPANION · ${trip.city.toUpperCase()}`} title="A little help along the way" description="Ask about your trip, find your rhythm, or rethink a day." action={<span className="demo-data-chip"><span />{demoMode ? "DEMO MODE" : "AI CONNECTED"}</span>} /><div className="assistant-trip-context"><span className="context-trip-thumb" style={{ backgroundImage: `url(${trip.image})` }} /><span><b>{trip.city}, {trip.country}</b><small>{trip.dates} · {trip.travelers} travelers</small></span><span className="context-status">Trip context on</span></div><div className="assistant-layout"><section className="trip-panel assistant-chat"><div className="assistant-greeting"><span className="assistant-star"><Sparkles size={19} /></span><div><b>Hi Edi. Where should we start?</b><p>I can help you think through the trip. I won’t change your itinerary unless you confirm.</p></div></div><div className="assistant-suggestions">{prompts.map((suggestion) => <button key={suggestion} onClick={() => onAsk(suggestion)}><Sparkles size={13} />{suggestion}<ArrowRight size={13} /></button>)}</div>{reply && <div className="assistant-response"><div><Sparkles size={14} /><b>TRIPLY ASSISTANT</b><small>Suggestions, not verified local facts</small></div><p>{reply}</p></div>}<form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); onAsk(); }}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={2} placeholder="Ask anything about your trip..." /><div><span>Trip details stay in your workspace</span><button disabled={busy || !prompt.trim()} aria-label="Send message">{busy ? <span className="spinner" /> : <Send size={15} />}</button></div></form></section><aside className="assistant-aside"><div className="assistant-context-card"><span className="tiny-eyebrow">YOUR TRIP AT A GLANCE</span><h3>{trip.city}, {trip.country}</h3><p>{trip.days.length} days planned · {trip.days.flatMap((day) => day.places).length} suggested activities · {money(trip.budget)} budget</p><div className="context-divider" /><b>Little things I can help with</b><ul><li>Reshape a day to feel calmer</li><li>Compare activity ideas</li><li>Think through a rainy-day plan</li><li>Talk through your budget</li></ul></div><div className="assistant-safety"><CircleHelp size={15} /><p>AI ideas are not verified real-world listings. Confirm addresses, opening times, safety, and prices from reliable local sources.</p></div></aside></div></>;
}

function SettingsPage({ demoMode, onSignOut }: { demoMode: boolean; onSignOut: () => void }) {
  return <><PageTitle eyebrow="MAKE TRIPLY YOURS" title="Your settings" description="A few details about your workspace and integrations." /><div className="settings-layout"><section className="trip-panel settings-card"><div className="settings-section"><div><h2>Your profile</h2><p>Your travel profile and preferences.</p></div><div className="settings-profile"><span className="trip-avatar large">E</span><span><b>Edi Jozic</b><small>edi@example.com · {demoMode ? "Demo account" : "Supabase account"}</small></span><button className="outline-button">Edit profile</button></div></div><div className="settings-section"><div><h2>Travel style</h2><p>Help us make suggestions feel more like you.</p></div><div className="settings-chips"><button className="selected">Slow & scenic</button><button>Food first</button><button>Culture & history</button><button>Outdoors</button></div></div><div className="settings-section"><div><h2>Connected services</h2><p>Optional services for your travels.</p></div><div className="service-row"><Globe2 size={17} /><span><b>Map provider</b><small>Demo map preview · no location API configured</small></span><span className="service-badge">Not connected</span></div><div className="service-row"><Sparkles size={17} /><span><b>AI trip planner</b><small>{demoMode ? "Deterministic demo suggestions" : "Anthropic API configured"}</small></span><span className={`service-badge ${demoMode ? "" : "connected"}`}>{demoMode ? "Demo mode" : "Connected"}</span></div><div className="service-row"><Sun size={17} /><span><b>Weather forecast</b><small>Weather unavailable until configured</small></span><span className="service-badge">Not connected</span></div></div><div className="settings-section"><div><h2>Session</h2><p>End your current demo session.</p></div><button className="outline-button sign-out-button" onClick={onSignOut}>Sign out</button></div></section><aside className="settings-side"><div className="pro-card"><Sparkles size={18} /><span className="tiny-eyebrow">TRAVEL WITH MORE EASE</span><h3>More room for the good stuff.</h3><p>Bring your friends into the plan, keep all the details together, and travel with a little more peace of mind.</p><button className="plain-link">Explore Triply Plus <ArrowRight size={13} /></button></div><div className="settings-disclaimer">Demo data is saved in this browser only. Supabase persistence and collaboration need live project credentials.</div></aside></div></>;
}

function TripWizard({ onClose, onCreate, prefill }: { onClose: () => void; onCreate: (values: { destination: string; country: string; origin: string; start: string; end: string; budget: number; travelers: number; style: string; transport: string; accommodation: string; interests: string; description: string }) => void; prefill: { destination: string; country: string } | null }) {
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState(prefill?.destination ?? "");
  const [country, setCountry] = useState(prefill?.country ?? "");
  const [origin, setOrigin] = useState("");
  const [start, setStart] = useState("2026-11-20");
  const [end, setEnd] = useState("2026-11-25");
  const [budget, setBudget] = useState(1400);
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState("Slow & scenic");
  const [transport, setTransport] = useState("Walk & public transport");
  const [accommodation, setAccommodation] = useState("Small hotel or guesthouse");
  const [interests, setInterests] = useState("Architecture, local food, beautiful views");
  const [description, setDescription] = useState("");
  const styles = ["Slow & scenic", "Culture & history", "Food & gastronomy", "Adventure", "Romantic", "Family"];
  const validDates = start && end && new Date(end) > new Date(start);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!destination.trim() || !validDates) return;
    onCreate({ destination: destination.trim(), country: country.trim(), origin: origin.trim(), start, end, budget, travelers, style, transport, accommodation, interests, description });
  };
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="trip-wizard" onSubmit={submit}><div className="wizard-top"><div className="wizard-brand"><span className="trip-brand-mark"><Plane size={13} fill="currentColor" /></span>triply<span className="brand-period">.</span><span className="wizard-tag">A NEW ADVENTURE</span></div><button type="button" className="modal-close" onClick={onClose}><X size={17} /></button></div><div className="wizard-progress"><span style={{ width: `${step === 1 ? 36 : step === 2 ? 72 : 100}%` }} /></div><div className="wizard-content"><span className="tiny-eyebrow">STEP {step} OF 3</span>{step === 1 && <><h2>Where are you dreaming of?</h2><p>Somewhere familiar, or somewhere entirely new.</p><label className="wizard-field"><span>DESTINATION</span><div className="input-with-icon"><MapPin size={16} /><input autoFocus value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="A city, country, or coast" /></div></label><label className="wizard-field"><span>COUNTRY <small>OPTIONAL</small></span><input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" /></label><label className="wizard-field"><span>STARTING FROM <small>OPTIONAL</small></span><input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Your home city or airport" /></label><div className="wizard-suggestion-row"><span>Little sparks:</span>{["Rome", "Lisbon", "Kyoto"].map((city) => <button type="button" key={city} onClick={() => { setDestination(city); setCountry(city === "Kyoto" ? "Japan" : city === "Lisbon" ? "Portugal" : "Italy"); }}>{city}</button>)}</div></>}{step === 2 && <><h2>Make room for what matters.</h2><p>Dates, budget, and who’s coming along for the memories.</p><div className="wizard-row"><label className="wizard-field"><span>DEPARTURE</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="wizard-field"><span>RETURN</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>{!validDates && <small className="form-warning">Return date should be after departure.</small>}<div className="wizard-row"><label className="wizard-field"><span>TRIP BUDGET · EUR</span><div className="input-with-icon"><span className="currency-sign">€</span><input type="number" min={1} value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></div></label><label className="wizard-field"><span>TRAVELERS</span><div className="stepper"><button type="button" onClick={() => setTravelers(Math.max(1, travelers - 1))}><Minus size={13} /></button><b>{travelers}</b><button type="button" onClick={() => setTravelers(Math.min(12, travelers + 1))}><Plus size={13} /></button></div></label></div><div className="wizard-row"><label className="wizard-field"><span>GETTING AROUND</span><select value={transport} onChange={(event) => setTransport(event.target.value)}>{["Walk & public transport", "Train", "Rental car", "Cycling", "Flexible"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="wizard-field"><span>STAY STYLE</span><select value={accommodation} onChange={(event) => setAccommodation(event.target.value)}>{["Small hotel or guesthouse", "Apartment", "Hostel", "Resort", "Flexible"].map((item) => <option key={item}>{item}</option>)}</select></label></div></>}{step === 3 && <><h2>What makes a trip feel like yours?</h2><p>Choose your pace, then tell us what you’re drawn to.</p><div className="style-choices">{styles.map((item) => <button type="button" key={item} className={style === item ? "selected" : ""} onClick={() => setStyle(item)}>{item}{style === item && <Check size={13} />}</button>)}</div><label className="wizard-field"><span>THINGS YOU LOVE</span><input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Food, art, quiet walks..." /></label><label className="wizard-field"><span>THE DREAM IN YOUR OWN WORDS</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell us what you hope to feel, see, and taste..." /></label></>}</div><div className="wizard-footer"><button type="button" className="wizard-back" onClick={() => step === 1 ? onClose() : setStep(step - 1)}>{step === 1 ? "Maybe later" : <><ChevronLeft size={14} /> Back</>}</button>{step < 3 ? <button type="button" className="coral-button" disabled={step === 1 ? !destination.trim() : !validDates} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={14} /></button> : <button className="coral-button"><Sparkles size={14} /> Create my trip</button>}</div></form></div>;
}

function ExpenseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="expense-modal" onSubmit={onSubmit}><div className="expense-modal-head"><div><span className="tiny-eyebrow">ACTUAL SPENDING</span><h2>Add an expense</h2></div><button type="button" className="modal-close" onClick={onClose}><X size={17} /></button></div><label className="wizard-field"><span>WHAT WAS IT?</span><input name="title" required maxLength={100} placeholder="e.g. Dinner by the water" /></label><div className="wizard-row"><label className="wizard-field"><span>CATEGORY</span><select name="category">{Object.keys(categoryColors).map((category) => <option key={category}>{category}</option>)}</select></label><label className="wizard-field"><span>AMOUNT · EUR</span><input type="number" name="amount" required min="0.01" step="0.01" placeholder="0.00" /></label></div><label className="wizard-field"><span>DATE</span><input name="date" placeholder="Today or Jun 12" /></label><div className="wizard-footer"><button type="button" className="wizard-back" onClick={onClose}>Cancel</button><button className="coral-button"><Plus size={14} /> Add expense</button></div></form></div>;
}
