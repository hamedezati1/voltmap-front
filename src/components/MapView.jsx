import React, { useEffect, useRef } from "react";

export default function MapView({ stations, onPinClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!window.L) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [35.7219, 51.3347],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((s) => {
      const isAvailable = s.status === "available";
      const color = isAvailable ? "#2ECC71" : "#F39C12";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width: 36px; height: 36px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 2px solid white;
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">⚡</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([s.lat, s.lng], { icon }).addTo(map).bindPopup(`
          <div style="font-family: Vazirmatn, sans-serif; direction: rtl; min-width: 160px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${
              s.name
            }</div>
            <div style="font-size: 12px; color: #888; margin-bottom: 6px;">${
              s.city
            }</div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 11px; background: ${
                isAvailable ? "#e8faf0" : "#fef3e2"
              }; color: ${
        isAvailable ? "#27AE60" : "#E67E22"
      }; padding: 2px 8px; border-radius: 12px;">${
        isAvailable ? "خالی" : "شلوغ"
      }</span>
              <span style="font-size: 11px; color: #555;">${s.power}kW · ${
        s.type
      }</span>
            </div>
          </div>
        `);

      marker.on("click", () => {
        if (onPinClick) onPinClick(s);
      });

      markersRef.current.push(marker);
    });
  }, [stations]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}
