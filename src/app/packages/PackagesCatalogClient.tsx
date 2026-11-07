"use client";

import { useState, useMemo } from "react";
import { PackageCard } from "@/components/PackageCard";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";

interface Props {
  initialPackages: any[];
}

export function PackagesCatalogClient({ initialPackages }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDestination, setSelectedDestination] = useState("All");

  const categories = ["All", "Family", "Honeymoon", "Luxury", "Group"];
  const destinations = ["All", "Munnar", "Alleppey", "Thekkady", "Wayanad", "Madurai", "Kochi"];

  const filtered = useMemo(() => {
    return initialPackages.filter((pkg) => {
      // Category filter
      if (selectedCategory !== "All" && pkg.category !== selectedCategory) {
        return false;
      }

      // Destination filter
      if (selectedDestination !== "All") {
        const hasDest = pkg.destinations.some((d: string) =>
          d.toLowerCase().includes(selectedDestination.toLowerCase())
        );
        if (!hasDest) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = pkg.title.toLowerCase().includes(term);
        const matchesDesc = pkg.description.toLowerCase().includes(term);
        const matchesSummary = pkg.destination_summary.toLowerCase().includes(term);
        const matchesCode = pkg.id.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesSummary && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [initialPackages, searchTerm, selectedCategory, selectedDestination]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search destination, e.g. Munnar, Houseboat..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Destination Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          >
            {destinations.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Kerala & South Destinations" : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filtered.length} holiday packages</span>
        <span className="text-emerald-700 font-medium">All prices include private AC car, twin sharing & 5% GST</span>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <SlidersHorizontal className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No packages match your search</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your category or destination filters, or submit a custom holiday enquiry.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSelectedDestination("All");
              setSearchTerm("");
            }}
            className="mt-4 bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
