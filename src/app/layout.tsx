import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpiceCoast Holidays | Kerala & South India Tour Specialist",
  description: "Bespoke Kerala and South India holiday packages, backwaters, hill stations, and authentic cultural experiences.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
