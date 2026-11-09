"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Compass, FileCheck2, LockKeyhole, UserRound } from "lucide-react";

type Mode = "login" | "register";

function safeDestination() {
  const requested = new URLSearchParams(window.location.search).get("next") || "/traveller";
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/traveller";
}

export default function TravellerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("Dr. Evelyn Campbell");
  const [email, setEmail] = useState("e.campbell@edinburgh.ac.uk");
  const [quoteNumber, setQuoteNumber] = useState("SCH-2026-Q8819");
  const [password, setPassword] = useState("SpiceCoastTraveller!2026");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/traveller/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password, quoteNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to continue");
      router.replace(safeDestination());
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to continue");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[720px] overflow-hidden bg-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#6ee7b7_0,transparent_38%),radial-gradient(circle_at_80%_80%,#f59e0b_0,transparent_36%)]" />
          <Link href="/" className="relative flex items-center gap-3 font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Compass /></span>
            SpiceCoast Holidays
          </Link>
          <div className="relative max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-200">Private traveller portal</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight">Your proposal, decisions and consultant updates in one calm place.</h1>
            <div className="mt-8 space-y-4 text-sm text-emerald-50">
              {["Review the exact itinerary and database-backed price", "Approve, decline or request a change", "Keep every consultant response attached to the quote"].map((benefit) => (
                <p key={benefit} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{benefit}</p>
              ))}
            </div>
          </div>
          <p className="relative text-xs leading-5 text-emerald-200">No payment is collected here. Approval tells the Kochi consultant to continue the offline booking process.</p>
        </section>

        <section className="p-7 sm:p-12">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft className="h-4 w-4" /> Back to packages</Link>
          <div className="mb-7">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{mode === "login" ? <LockKeyhole className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</span>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{mode === "login" ? "Traveller sign in" : "Claim your quote"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{mode === "login" ? "Access quotes already linked to your verified invitation." : "Use the email and quote number supplied by your consultant."}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <button type="button" onClick={() => { setMode("login"); setError(""); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "login" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}>Sign in</button>
            <button type="button" onClick={() => { setMode("register"); setError(""); }} className={`rounded-lg px-3 py-2.5 transition ${mode === "register" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"}`}>Create account</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <label className="block text-sm font-medium text-slate-700">Full name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
            )}
            <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
            {mode === "register" && (
              <label className="block text-sm font-medium text-slate-700">Quote number<input required value={quoteNumber} onChange={(event) => setQuoteNumber(event.target.value)} placeholder="SCH-2026-Q0001" autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono uppercase outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
            )}
            <label className="block text-sm font-medium text-slate-700">Password<input required type="password" minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
            {mode === "register" && <p className="text-xs leading-5 text-slate-500">Use 12+ characters with uppercase, lowercase, a number and a symbol.</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"><FileCheck2 className="h-4 w-4" />{pending ? "Please wait…" : mode === "login" ? "Open my quotes" : "Create account & open quote"}</button>
          </form>

          <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <strong>Reviewer demo:</strong> e.campbell@edinburgh.ac.uk / SpiceCoastTraveller!2026
          </div>
        </section>
      </div>
    </main>
  );
}
