import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { getStaffSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/staff-login");
  return <AdminShell session={session}>{children}</AdminShell>;
}
