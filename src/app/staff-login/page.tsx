"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, LockKeyhole, ShieldCheck } from "lucide-react";

const demoAccounts = [
  { label: "Admin", email: "admin@spicecoast.in" },
  { label: "Editor", email: "editor@spicecoast.in" },
  { label: "Consultant", email: "consultant@spicecoast.in" },
];

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState("SpiceCoastDemo!2026");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed");
      router.replace("/admin"); router.refresh();
    } catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Sign-in failed"); }
    finally { setPending(false); }
  }

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900 sm:py-16">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
      <section className="hidden bg-emerald-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Compass /></span>SpiceCoast Holidays</Link>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-emerald-200">Staff workspace</p><h1 className="text-4xl font-semibold leading-tight">One calm place to publish packages and answer travellers.</h1><p className="mt-5 max-w-md text-emerald-100">Protected access for Company A&apos;s package editors, tour consultants, and administrators.</p></div>
        <p className="flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck className="h-4 w-4" /> Signed, HTTP-only 8-hour sessions</p>
      </section>
      <section className="p-7 sm:p-12">
        <Link href="/" className="mb-10 flex items-center gap-2 text-sm font-semibold text-emerald-800 lg:hidden"><Compass className="h-5 w-5" /> SpiceCoast Holidays</Link>
        <div className="mb-8"><span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="h-5 w-5" /></span><h2 className="text-3xl font-semibold tracking-tight">Staff sign in</h2><p className="mt-2 text-sm text-slate-500">Use a reviewer account to test role-based access.</p></div>
        <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Demo accounts">{demoAccounts.map((account) => <button key={account.email} type="button" onClick={() => setEmail(account.email)} className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${email === account.email ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{account.label}</button>)}</div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
          <label className="block text-sm font-medium">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength={12} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" /></label>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={pending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{pending ? "Signing in…" : "Sign in to staff CMS"}</button>
        </form>
        <p className="mt-6 text-xs leading-5 text-slate-500">Demo password for all reviewer accounts: <strong className="text-slate-700">SpiceCoastDemo!2026</strong></p>
      </section>
    </div>
  </main>;
}
