"use client";

import { Button } from "@/components/ui/button";
import { getRouteShareParts } from "@/lib/constants/route-share";
import { formatShareDateIST, formatShareTimeIST } from "@/lib/date-time";
import { Share2 } from "lucide-react";

type Props = {
  rideId: string;
  fromCity: string;
  toCity: string;
  departureTime: Date;
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
  seatsAvailable,
  driverName,
  driverPhone,
  vehicleInfo,
}: Props) {
  const handleShare = () => {
    const { fromPart, toPart } = getRouteShareParts(fromCity, toCity);
    const { dateStr, relativeStr } = formatShareDateIST(departureTime);
    const timeStr = formatShareTimeIST(departureTime);

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
