"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Inbox, Package, FileText, History, LayoutDashboard, ExternalLink, Layers, LogOut } from "lucide-react";
import type { StaffSession } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Executive Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin/enquiries", label: "Enquiries & AI Triage", icon: Inbox, roles: ["admin", "consultant"] },
  { href: "/admin/packages", label: "Package CMS & Pricing", icon: Package, roles: ["admin", "editor"] },
  { href: "/admin/quotes", label: "Quote Builder", icon: FileText, roles: ["admin", "consultant"] },
  { href: "/admin/blogs", label: "Blog & Guides CMS", icon: Layers, roles: ["admin", "editor"] },
  { href: "/admin/logs", label: "Audit & Activity Log", icon: History, roles: ["admin"] },
] as const;

export function AdminShell({ session, children }: { session: StaffSession; children: React.ReactNode }) {
  const pathname = usePathname();
  const visibleNav = navItems.filter((item) => (item.roles as readonly string[]).includes(session.role));
  return <div className="min-h-screen bg-slate-100 text-slate-800">
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4"><Link href="/" className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600"><Compass className="h-5 w-5" /></span><span><strong className="block text-sm">Company A CMS</strong><small className="block text-[10px] text-slate-400">SpiceCoast Holidays</small></span></Link><Link href="/" target="_blank" className="hidden items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white sm:flex">Public portal <ExternalLink className="h-3 w-3" /></Link></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-semibold">{session.name}</p><p className="text-[10px] capitalize text-emerald-400">{session.role}</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-bold uppercase">{session.name[0]}</span><form action="/api/auth/logout" method="post"><button className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" title="Sign out" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></form></div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-slate-800 px-4 py-1.5 text-xs sm:px-6 lg:px-8">{visibleNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 font-medium ${pathname === item.href ? "bg-emerald-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{item.label}</Link>; })}</nav>
    </header>
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
  </div>;
}
