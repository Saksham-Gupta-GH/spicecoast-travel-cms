import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

await initDatabase();

export default async function AdminLogsPage() {
  if (!(await hasRole(["admin"]))) redirect("/admin");
  const logs = await db.prepare(`
    SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100
  `).all() as any[];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
          Governance &amp; Accountability
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Staff Activity &amp; Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event log tracking all package modifications, pricing changes, AI triage reviews, and quote dispatches.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Staff Member / Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                    {log.user_name}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                    {log.entity_type}:{log.entity_id}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
