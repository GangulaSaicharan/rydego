"use client";

import { Button } from "@/components/ui/button";
import { getRouteShareParts } from "@/lib/constants/route-share";
import { Share2 } from "lucide-react";

function formatShareDate(departureTime: Date): { dateStr: string; relativeStr: string } {
  const d = new Date(departureTime);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDate = new Date(d);
  depDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((depDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let relativeStr = "";
  if (diffDays === 0) relativeStr = "Today";
  else if (diffDays === 1) relativeStr = "Tomorrow";
  else if (diffDays === 2) relativeStr = "Day after tomorrow";
  else if (diffDays > 2 && diffDays <= 7) relativeStr = `In ${diffDays} days`;

  const hour = d.getHours();
  const timeOfDay =
    hour >= 4 && hour < 12
      ? "Morning"
      : hour >= 12 && hour < 17
        ? "Afternoon"
        : hour >= 17 && hour < 21
          ? "Evening"
          : "Night";
  if (relativeStr) relativeStr = `${relativeStr} ${timeOfDay}`;

  return { dateStr, relativeStr: relativeStr.trim() };
}

function formatShareTime(departureTime: Date, fromSlot: string | null): string {
  if (fromSlot && fromSlot.trim()) return fromSlot.trim();
  const d = new Date(departureTime);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return mins > 0 ? `${h}:${String(mins).padStart(2, "0")} ${ampm}` : `${h} ${ampm}`;
}

type Props = {
  rideId: string;
  fromCity: string;
  toCity: string;
  departureTime: Date;
  fromSlot: string | null;
  seatsAvailable: number;
  driverName: string | null;
  driverPhone: string | null;
  vehicleInfo?: string | null;
};

export function ShareRideWhatsAppButton({
  rideId,
  fromCity,
  toCity,
  departureTime,
  fromSlot,
  seatsAvailable,
  driverName,
  driverPhone,
  vehicleInfo,
}: Props) {
  const handleShare = () => {
    const { fromPart, toPart } = getRouteShareParts(fromCity, toCity);
    const { dateStr, relativeStr } = formatShareDate(departureTime);
    const timeStr = formatShareTime(departureTime, fromSlot);

    // Public ride details page: view details, contact & book (no login required to view)
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/rides/${rideId}`
        : `/rides/${rideId}`;

    // Build emojis at runtime so they survive encoding (wa.me URL can mangle UTF-8)
    const E = {
      car: String.fromCodePoint(0x1f697),
      calendar: String.fromCodePoint(0x1f4c5),
      clock: String.fromCodePoint(0x23f0),
      seat: String.fromCodePoint(0x1f4ba),
      point: String.fromCodePoint(0x1f449),
      link: String.fromCodePoint(0x1f517),
    };

    const message = [
      `${E.car} *CAB AVAILABLE* ${E.car}`,
      "",
      `${E.calendar} *Date:* ${dateStr}`,
      ...(relativeStr ? [relativeStr, ""] : [""]),
      `${E.clock} *Time:* ${timeStr}`,
      "",
      "*From*",
      fromPart,
      "",
      "*To*",
      toPart,
      "",
      `${E.seat} *Seats available:* ${seatsAvailable}`,
      "",
      `${E.point} Book now — ${E.link} View details & contact:`,
      url,
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    // Prefer Web Share API so message (with emojis) is passed directly — no URL encoding issues
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          text: message,
        })
        .catch(() => {
          openWhatsAppFallback(message);
        });
    } else {
      openWhatsAppFallback(message);
    }
  };

  function openWhatsAppFallback(text: string) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share via WhatsApp
    </Button>
  );
}
