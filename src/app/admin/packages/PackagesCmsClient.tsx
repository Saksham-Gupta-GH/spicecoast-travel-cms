"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Copy,
  Edit2,
  Eye,
  History,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";

interface Props {
  initialPackages: any[];
}

export function PackagesCmsClient({ initialPackages }: Props) {
  const [packages] = useState<any[]>(initialPackages);
  const [editingPkg, setEditingPkg] = useState<any | null>(null);
  const [historyPkg, setHistoryPkg] = useState<any | null>(null);
  const [previewPkg, setPreviewPkg] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Quick 1-Click Duplicate Package (Addresses: "add a package in 5 minutes without calling anyone")
  async function handleDuplicate(pkgId: string) {
    if (!confirm(`Duplicate package ${pkgId}? A new draft copy will be created instantly.`)) return;

    try {
      const res = await fetch(`/api/packages/${pkgId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to duplicate");

      setMessage(`Package duplicated successfully! New Draft ID: ${data.package_id}`);
      // Refresh list
      const updatedRes = await fetch("/api/packages");
      const updatedData = await updatedRes.json();
      if (updatedData.data) {
        // Need full details
        window.location.reload();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Rollback to specific version
  async function handleRollback(pkgId: string, versionId: number) {
    if (!confirm(`Restore package ${pkgId} to version ${versionId}? Current state will be archived as a new version.`)) return;

    try {
      const res = await fetch(`/api/packages/${pkgId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Rollback failed");

      alert(`Restored successfully! Package is now on version ${data.new_version}.`);
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Save package & seasonal prices
  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPkg) return;

    setSaving(true);
    try {
      const isNew = !editingPkg.id || editingPkg.id === "NEW";
      const url = isNew ? "/api/packages" : `/api/packages/${editingPkg.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPkg),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");

      setMessage("Package and seasonal pricing successfully updated!");
      setEditingPkg(null);
      window.location.reload();
    } catch (err: any) {
      alert("Save error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openNewPackage() {
    setEditingPkg({
      id: "NEW",
      title: "New Kerala Holiday Circuit",
      tagline: "Custom crafted holiday through God's Own Country.",
      description: "Experience the best of Kerala with private transfers and boutique resort stays.",
      duration_days: 5,
      duration_nights: 4,
      destination_summary: "Kochi • Munnar • Alleppey",
      destinations: ["Munnar", "Alleppey", "Kochi"],
      category: "Family",
      featured_image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200",
      gallery: [],
      inclusions: [
        "Private AC vehicle with dedicated chauffeur",
        "Accommodation on twin sharing basis with breakfast",
        "Overnight houseboat cruise with traditional Kerala meals",
      ],
      exclusions: ["Airfare", "Personal laundry & phone calls"],
      hotel_standard_name: "Standard 3-Star Resorts",
      hotel_deluxe_name: "Deluxe 4-Star Plantations",
      hotel_luxury_name: "Luxury 5-Star Heritage Retreats",
      status: "draft",
      seasonal_prices: [
        {
          season_name: "Peak Season (Winter)",
          period_label: "01 Dec – 31 Jan",
          standard_price_pp: 28500,
          deluxe_price_pp: 32500,
          luxury_price_pp: 46000,
        },
        {
          season_name: "Regular Season",
          period_label: "01 Feb – 31 May",
          standard_price_pp: 24200,
          deluxe_price_pp: 28900,
          luxury_price_pp: 39500,
        },
        {
          season_name: "Monsoon Season",
          period_label: "01 Jun – 30 Sep",
          standard_price_pp: 21500,
          deluxe_price_pp: 24900,
          luxury_price_pp: 34000,
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Package CMS Studio • Zero Freelancer Dependency
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Itineraries, Tariffs &amp; Version Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a package, adjust seasonal prices in 5 minutes, preview before publishing, or roll back to any past version.
          </p>
        </div>

        <button
          onClick={openNewPackage}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Code / Status</th>
                <th className="py-3.5 px-4">Package Title &amp; Circuit</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Seasonal Deluxe Tariff (pp)</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4 text-right">CMS Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900">{pkg.id}</div>
                    <div className="mt-1">
                      {pkg.status === "published" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Published
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Draft Mode
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 text-sm">{pkg.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{pkg.destination_summary}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">
                      {pkg.category} Circuit
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-800">
                    {pkg.duration_days}D / {pkg.duration_nights}N
                  </td>

                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {pkg.seasonal_prices.map((sp: any, i: number) => (
                        <div key={i} className="text-[11px] flex items-center justify-between gap-3">
                          <span className="text-slate-500 truncate max-w-[120px]">{sp.season_name.split(" ")[0]}:</span>
                          <span className="font-mono font-bold text-slate-800">
                            ₹{sp.deluxe_price_pp?.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      onClick={() => setHistoryPkg(pkg)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition"
                    >
                      <History className="w-3 h-3" />
                      <span>v{pkg.current_version} ({pkg.versions.length} edits)</span>
                    </button>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Live Preview Button */}
                      <button
                        onClick={() => setPreviewPkg(pkg)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition"
                        title="Live Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* 1-Click Duplicate */}
                      <button
                        onClick={() => handleDuplicate(pkg.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition"
                        title="Duplicate in 1-Click"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingPkg(pkg)}
                        className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
                        title="Edit Package & Tariffs"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package & Seasonal Pricing Editor Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  5-Minute CMS Tariff Editor
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingPkg.id === "NEW" ? "Create New Holiday Package" : `Edit ${editingPkg.title} (${editingPkg.id})`}
                </h3>
              </div>
              <button
                onClick={() => setEditingPkg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Package Title *</label>
                  <input
                    type="text"
                    required
                    value={editingPkg.title}
                    onChange={(e) => setEditingPkg({ ...editingPkg, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingPkg.status}
                    onChange={(e) => setEditingPkg({ ...editingPkg, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Unlisted)</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration Days / Nights *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingPkg.duration_days}
                      onChange={(e) => setEditingPkg({ ...editingPkg, duration_days: parseInt(e.target.value, 10) })}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingPkg.duration_nights}
                      onChange={(e) => setEditingPkg({ ...editingPkg, duration_nights: parseInt(e.target.value, 10) })}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingPkg.category}
                    onChange={(e) => setEditingPkg({ ...editingPkg, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="Family">Family</option>
                    <option value="Honeymoon">Honeymoon</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Group">Group</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Route Circuit</label>
                  <input
                    type="text"
                    value={editingPkg.destination_summary}
                    onChange={(e) => setEditingPkg({ ...editingPkg, destination_summary: e.target.value })}
                    placeholder="Munnar • Thekkady • Alleppey"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={editingPkg.tagline}
                  onChange={(e) => setEditingPkg({ ...editingPkg, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              {/* Seasonal Prices Table Editor */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Seasonal Tariff Matrix (Twin Sharing pp)
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                    5% GST Assumption
                  </span>
                </div>

                <div className="space-y-2">
                  {editingPkg.seasonal_prices?.map((sp: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Season Label</span>
                        <input
                          type="text"
                          value={sp.season_name}
                          onChange={(e) => {
                            const updated = [...editingPkg.seasonal_prices];
                            updated[idx].season_name = e.target.value;
                            setEditingPkg({ ...editingPkg, seasonal_prices: updated });
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Standard Tier pp</span>
                        <input
                          type="number"
                          value={sp.standard_price_pp}
                          onChange={(e) => {
                            const updated = [...editingPkg.seasonal_prices];
                            updated[idx].standard_price_pp = parseInt(e.target.value, 10);
                            setEditingPkg({ ...editingPkg, seasonal_prices: updated });
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Deluxe Tier pp</span>
                        <input
                          type="number"
                          value={sp.deluxe_price_pp}
                          onChange={(e) => {
                            const updated = [...editingPkg.seasonal_prices];
                            updated[idx].deluxe_price_pp = parseInt(e.target.value, 10);
                            setEditingPkg({ ...editingPkg, seasonal_prices: updated });
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-emerald-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Luxury Tier pp</span>
                        <input
                          type="number"
                          value={sp.luxury_price_pp}
                          onChange={(e) => {
                            const updated = [...editingPkg.seasonal_prices];
                            updated[idx].luxury_price_pp = parseInt(e.target.value, 10);
                            setEditingPkg({ ...editingPkg, seasonal_prices: updated });
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Changelog Summary (For Version History)</label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted Peak December tariffs for 2026/27 holiday season"
                  value={editingPkg.change_summary || ""}
                  onChange={(e) => setEditingPkg({ ...editingPkg, change_summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-bold text-white shadow-md transition"
                >
                  {saving ? "Saving Changes..." : "Publish & Increment Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History & Rollback Modal */}
      {historyPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[80vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  Audit &amp; Rollback
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Version History: {historyPkg.title}
                </h3>
              </div>
              <button
                onClick={() => setHistoryPkg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {historyPkg.versions?.map((v: any) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Version {v.version_number}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{v.change_summary}</p>
                    <span className="text-[10px] text-slate-400">By {v.created_by}</span>
                  </div>

                  {v.version_number !== historyPkg.current_version && (
                    <button
                      onClick={() => handleRollback(historyPkg.id, v.version_number)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  CMS Live Preview Mode
                </span>
                <span className="text-xs text-slate-400 font-mono">({previewPkg.id})</span>
              </div>
              <button
                onClick={() => setPreviewPkg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-[21/9] rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src={previewPkg.featured_image}
                  alt={previewPkg.title}
                  width={1200}
                  height={514}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">{previewPkg.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{previewPkg.tagline}</p>
              </div>

              {/* Pricing table preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Season</th>
                      <th className="p-3">Standard (3★)</th>
                      <th className="p-3 bg-emerald-50 text-emerald-900">Deluxe (4★)</th>
                      <th className="p-3">Luxury (5★)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewPkg.seasonal_prices?.map((sp: any, i: number) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{sp.season_name}</td>
                        <td className="p-3 font-mono">₹{sp.standard_price_pp.toLocaleString("en-IN")}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800 bg-emerald-50/40">
                          ₹{sp.deluxe_price_pp.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 font-mono">₹{sp.luxury_price_pp.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewPkg(null)}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
