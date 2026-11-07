import Link from "next/link";
import { ShieldCheck, Phone, Mail, MapPin, Compass, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: About Company A */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SpiceCoast Holidays</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Company A, Kochi. A demonstration portal for Kerala backwater voyages, Munnar tea plantation stays, and South Indian heritage trails, based on the supplied client brief.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 p-2.5 rounded-lg">
              <Clock className="w-4 h-4 shrink-0" />
              <span>1-Hour Enquiry Reply Guarantee during business hours</span>
            </div>
          </div>

          {/* Col 2: Popular Circuits */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Popular Circuits</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/packages/munnar-thekkady-alleppey-houseboat" className="hover:text-emerald-400 transition">
                  Munnar & Alleppey Houseboat (6D/5N)
                </Link>
              </li>
              <li>
                <Link href="/packages/wayanad-misty-hills-luxury-retreat" className="hover:text-emerald-400 transition">
                  Wayanad Rainforest & Villa Retreat (4D/3N)
                </Link>
              </li>
              <li>
                <Link href="/packages/madurai-rameswaram-kanyakumari-pilgrim" className="hover:text-emerald-400 transition">
                  Madurai, Rameswaram & Kanyakumari (5D/4N)
                </Link>
              </li>
              <li>
                <Link href="/packages/kerala-grand-heritage-backwaters-beach" className="hover:text-emerald-400 transition">
                  Grand Kerala: Fort Kochi to Marari Beach (7D/6N)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Kochi HQ Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Kochi Headquarters</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>SpiceCoast House, MG Road, Ravipuram, Kochi, Kerala 682016</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 484 238 9000 / +91 98460 12345</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>holidays@spicecoast.in</span>
              </div>
            </div>
          </div>

          {/* Col 4: Trust, DPDP Compliance & Staff */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Compliance & Staff</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-200">DPDP Consent Safeguard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Digital follow-up consent is captured with each web enquiry. Staff inbox access is restricted by signed sessions and role checks.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded font-medium transition"
                >
                  <span>Operator CMS & Staff Studio Login →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} SpiceCoast Holidays Pvt Ltd (Company A, Kochi). All rights reserved. Prices shown on twin-sharing basis including 5% GST.
          </div>
          <div className="flex gap-4">
            <Link href="/packages" className="hover:text-slate-400">Packages</Link>
            <Link href="/blog" className="hover:text-slate-400">Travel Blog</Link>
            <Link href="/admin" className="hover:text-slate-400">Staff Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
