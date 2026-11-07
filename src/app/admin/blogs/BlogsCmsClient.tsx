"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ExternalLink,
  X,
} from "lucide-react";

interface Props {
  initialBlogs: any[];
  packages: any[];
}

export function BlogsCmsClient({ initialBlogs, packages }: Props) {
  const [blogs] = useState<any[]>(initialBlogs);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  function openNewBlog() {
    setEditingBlog({
      title: "",
      excerpt: "",
      content: "",
      category: "Hill Stations",
      featured_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000",
      author: "Ananya Pillai",
      related_package_ids: ["PKG-KL-07"],
      seo_title: "",
      seo_description: "",
      status: "published",
    });
    setIsEditing(true);
  }

  async function handleSaveBlog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBlog),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");

      alert("Blog post published & linked to packages!");
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            In-House Content &amp; SEO Engine
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Travel Blogs &amp; Package Attribution
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every blog post lives on our own domain and leads readers directly to the corresponding holiday package.
          </p>
        </div>

        <button
          onClick={openNewBlog}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {/* Blogs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogs.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  {b.category}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  {b.id}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 line-clamp-2">{b.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{b.excerpt}</p>

              <div className="pt-2">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Linked Holiday Packages:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {b.related_package_ids.map((pkgId: string) => (
                    <span
                      key={pkgId}
                      className="bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-200"
                    >
                      {pkgId}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">By {b.author}</span>
              <Link
                href={`/blog/${b.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
              >
                <span>Read Public Post</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Blog Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Write New Guide &amp; Link Packages</h3>
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingBlog.title}
                  onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingBlog.category}
                    onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Backwaters & Houseboats">Backwaters &amp; Houseboats</option>
                    <option value="Hill Stations">Hill Stations</option>
                    <option value="Heritage & Temples">Heritage &amp; Temples</option>
                    <option value="Travel Tips">Travel Tips</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Link to Package</label>
                  <select
                    value={editingBlog.related_package_ids[0] || ""}
                    onChange={(e) => setEditingBlog({ ...editingBlog, related_package_ids: [e.target.value] })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}: {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Excerpt *</label>
                <input
                  type="text"
                  required
                  value={editingBlog.excerpt}
                  onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Article Content (Markdown supported) *</label>
                <textarea
                  rows={6}
                  required
                  value={editingBlog.content}
                  onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
                >
                  {saving ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
