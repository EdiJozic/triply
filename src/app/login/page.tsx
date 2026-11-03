"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Compass, LoaderCircle, Plane, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const enterDemo = () => {
    localStorage.setItem("triply-demo-session", "true");
    router.push("/");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      if (!isSupabaseConfigured()) {
        setMessage("Supabase isn’t configured. Continue in demo mode, or add your project URL and anon key to .env.local.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login?type=recovery` });
        if (error) throw error;
        setSuccess(true);
        setMessage("If an account exists for that email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(true);
        setMessage("Account created. Check your email to confirm your address.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <main className="auth-page"><section className="auth-photo"><Link href="/welcome" className="auth-brand"><span className="trip-brand-mark"><Plane size={15} fill="currentColor" /></span>triply<span>.</span></Link><div className="auth-photo-copy"><span>TRAVEL SMARTER. EXPERIENCE MORE.</span><h1>Make a little<br /><i>room for wonder.</i></h1><p>The trip you’ve been dreaming of is closer than you think.</p><div className="auth-proof"><span><Check size={12} />A calmer way to plan</span><span><Check size={12} />Your plans, all in one place</span><span><Check size={12} />Made for your kind of travel</span></div></div><small className="auth-photo-credit">A SLOW MORNING, SOMEWHERE IN ITALY</small></section><section className="auth-form-side"><div className="auth-form"><div className="auth-welcome-icon"><Compass size={18} /></div><h2>{mode === "login" ? "Welcome back" : mode === "signup" ? "Come on in." : "Reset your password"}</h2><p>{mode === "login" ? "Let’s pick up where you left off." : mode === "signup" ? "Your next adventure starts right here." : "We’ll send a reset link to your inbox."}</p>{mode !== "reset" && <div className="auth-mode-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button></div>}<form onSubmit={submit}><label className="wizard-field"><span>EMAIL ADDRESS</span><input type="email" name="email" autoComplete="email" placeholder="you@somewhere.com" required /></label>{mode !== "reset" && <label className="wizard-field"><span>PASSWORD</span><input type="password" name="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" required /></label>}{mode === "login" && <button type="button" className="forgot-password" onClick={() => { setMode("reset"); setMessage(""); }}>Forgot password?</button>}{message && <div className={`auth-alert ${success ? "success" : ""}`}>{message}</div>}<button className="coral-button auth-submit" disabled={busy}>{busy ? <LoaderCircle size={14} className="spin" /> : <>{mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}<ArrowRight size={14} /></>}</button></form>{mode === "reset" && <button className="demo-link" onClick={() => { setMode("login"); setMessage(""); }}>Back to sign in</button>}<div className="auth-divider"><span />OR<span /></div><button className="demo-button" onClick={enterDemo}><Sparkles size={14} /> Continue with the demo workspace <ArrowRight size={13} /></button><small className="auth-disclaimer">Demo trips stay in this browser. Supabase is ready to configure for private accounts.</small></div></section></main>;
}
