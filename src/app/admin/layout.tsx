"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Compass,
  Inbox,
  Package,
  FileText,
  Clock,
  History,
  LayoutDashboard,
  ExternalLink,
  UserCheck,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Role Switcher State
  const [currentRole, setCurrentRole] = useState<"admin" | "editor" | "consultant">("admin");

  const roles = [
    {
      id: "admin",
      label: "Jawahar Kurian (Founder & MD)",
      role: "admin",
      badge: "Founder-MD (Full Access)",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      id: "editor",
      label: "Ananya Pillai (Content Editor)",
      role: "editor",
      badge: "Editor (Packages & Blogs)",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      id: "consultant",
      label: "Mathew Varghese (Sr Consultant)",
      role: "consultant",
      badge: "Consultant (Enquiries & Quotes)",
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  ];

  const navItems = [
    { href: "/admin", label: "Executive Dashboard", icon: LayoutDashboard },
    { href: "/admin/enquiries", label: "Enquiries & AI Triage", icon: Inbox, count: "3" },
    { href: "/admin/packages", label: "Package CMS & Pricing", icon: Package },
    { href: "/admin/quotes", label: "Quote Builder", icon: FileText },
    { href: "/admin/blogs", label: "Blog & Guides CMS", icon: Layers },
    { href: "/admin/logs", label: "Audit & Activity Log", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Admin Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-105 transition">
                <Compass className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>Company A CMS</span>
                  <span className="text-emerald-400 text-xs font-normal">Kochi</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">SpiceCoast Holidays</div>
              </div>
            </Link>

            <span className="hidden sm:inline text-slate-700">|</span>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-white transition bg-slate-800/80 px-2.5 py-1 rounded-md"
            >
              <span>View Public Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 hidden md:inline">Simulate Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as any)}
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center uppercase">
              {currentRole[0]}
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 py-1.5 border-t border-slate-800 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count && (
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
