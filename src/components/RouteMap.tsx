"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapPin } from "lucide-react";
import { resolveRoutePoints } from "@/lib/route-points";

type Props = {
  destinations: string[];
  compact?: boolean;
};

export function RouteMap({ destinations, compact = false }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const points = useMemo(() => resolveRoutePoints(destinations), [destinations]);

  useEffect(() => {
    if (!mapElement.current || points.length === 0) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void import("leaflet").then((leafletModule) => {
      if (disposed || !mapElement.current) return;
      const L = leafletModule.default;
      const map = L.map(mapElement.current, {
        attributionControl: true,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const coordinates = points.map((point) => [point.latitude, point.longitude] as [number, number]);
      L.polyline(coordinates, { color: "#047857", weight: 4, opacity: 0.82, dashArray: "8 7" }).addTo(map);

      points.forEach((point, index) => {
        const icon = L.divIcon({
          className: "spicecoast-route-marker",
          html: `<span>${index + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        L.marker([point.latitude, point.longitude], { icon })
          .addTo(map)
          .bindTooltip(`${index + 1}. ${point.name}`, { direction: "top", offset: [0, -12] });
      });

      if (coordinates.length === 1) map.setView(coordinates[0], 10);
      else map.fitBounds(L.latLngBounds(coordinates), { padding: [36, 36] });

      cleanup = () => map.remove();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-emerald-700">Route at a glance</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Your holiday circuit</h3>
        </div>
        <ol className="flex flex-wrap gap-2 text-[11px] text-slate-600">
          {points.map((point, index) => (
            <li key={`${point.name}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900">
              <MapPin className="h-3 w-3" /> {index + 1}. {point.name}
            </li>
          ))}
        </ol>
      </div>
      <div ref={mapElement} className={compact ? "h-64 w-full" : "h-80 w-full sm:h-96"} aria-label={`Map showing ${points.map((point) => point.name).join(" to ")}`} />
    </section>
  );
}
