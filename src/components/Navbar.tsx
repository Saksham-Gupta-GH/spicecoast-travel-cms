"use client";

import Link from "next/link";
import { useState } from "react";
import { Compass, Phone, Sparkles, Shield, User, Menu, X, ArrowRight } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      {/* Top micro-bar */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kochi Licensed Tour Operator • Est. 2018</span>
          </span>
          <span className="hidden md:inline text-emerald-400">•</span>
          <span className="hidden md:inline">₹30 Cr+ Curated Holidays • 4,300+ Annual Travelers</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-50 px-2.5 py-0.5 rounded text-xs font-medium transition"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Staff CMS & AI Inbox</span>
          </Link>
          <a href="tel:+914842389000" className="flex items-center gap-1 hover:text-white transition">
            <Phone className="w-3 h-3" />
            <span className="hidden sm:inline">+91 484 238 9000</span>
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>SpiceCoast</span>
              <span className="text-emerald-700 font-semibold">Holidays</span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-wider uppercase font-medium">
              Kerala & South India Specialists • Kochi
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-700">
          <Link href="/packages" className="hover:text-emerald-700 transition">
            Holiday Packages
          </Link>
          <Link href="/packages?category=Family" className="hover:text-emerald-700 transition">
            Family Tours
          </Link>
          <Link href="/packages?category=Honeymoon" className="hover:text-emerald-700 transition">
            Honeymoon Specials
          </Link>
          <Link href="/blog" className="hover:text-emerald-700 transition">
            Travel Guides & Blog
          </Link>
          <Link href="/#enquiry" className="hover:text-emerald-700 transition">
            Custom Quote
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/#enquiry"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-emerald-700/20 hover:shadow-md transition"
          >
            <span>Plan My Holiday</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-emerald-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            href="/packages"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-800 hover:text-emerald-700 py-1"
          >
            All Holiday Packages
          </Link>
          <Link
            href="/packages?category=Family"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-800 hover:text-emerald-700 py-1"
          >
            Family Tours
          </Link>
          <Link
            href="/packages?category=Honeymoon"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-800 hover:text-emerald-700 py-1"
          >
            Honeymoon Specials
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-800 hover:text-emerald-700 py-1"
          >
            Travel Guides & Blog
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-emerald-800 bg-emerald-50 p-2.5 rounded-lg"
          >
            Staff Admin & CMS Studio →
          </Link>
          <Link
            href="/#enquiry"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center bg-emerald-700 text-white font-medium py-2.5 rounded-lg"
          >
            Plan My Holiday
          </Link>
        </div>
      )}
    </header>
  );
}
