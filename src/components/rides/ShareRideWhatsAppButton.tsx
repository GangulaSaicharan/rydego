// "use client";

// import { Button } from "@/components/ui/button";
// import { getRouteShareParts } from "@/lib/constants/route-share";
// import { formatShareDateIST, formatShareTimeIST } from "@/lib/date-time";
// import { Share2 } from "lucide-react";

// type Props = {
//   rideId: string;
//   fromCity: string;
//   toCity: string;
//   stopsCities?: string[];
//   departureTime: Date;
//   seatsAvailable: number;
//   driverName: string | null;
//   driverPhone: string | null;
//   vehicleInfo?: string | null;
// };

// export function ShareRideWhatsAppButton({
//   rideId,
//   fromCity,
//   toCity,
//   stopsCities,
//   departureTime,
//   seatsAvailable,
//   driverName,
//   driverPhone,
//   vehicleInfo,
// }: Props) {
//   const handleShare = () => {
//     const intermediateStops = (stopsCities ?? []).map((s) => s.trim()).filter(Boolean);
//     const { fromPart, toPart } =
//       intermediateStops.length > 0 ? { fromPart: fromCity, toPart: toCity } : getRouteShareParts(fromCity, toCity);
//     const { dateStr, relativeStr } = formatShareDateIST(departureTime);
//     const timeStr = formatShareTimeIST(departureTime);

//     // Public ride details page: view details, contact & book (no login required to view)
//     const url =
//       typeof window !== "undefined"
//         ? `${window.location.origin}/rides/${rideId}`
//         : `/rides/${rideId}`;

//     // Build emojis at runtime so they survive encoding (wa.me URL can mangle UTF-8)
//     const E = {
//       car: String.fromCodePoint(0x1f697),
//       calendar: String.fromCodePoint(0x1f4c5),
//       clock: String.fromCodePoint(0x23f0),
//       seat: String.fromCodePoint(0x1f4ba),
//       point: String.fromCodePoint(0x1f449),
//       link: String.fromCodePoint(0x1f517),
//       routeMap: String.fromCodePoint(0x1f5fa, 0xfe0f),
//       pin: String.fromCodePoint(0x1f4cd),
//       stop: String.fromCodePoint(0x1f6d1),
//       check: String.fromCodePoint(0x2705),
//     };

//     const message = [
//       `${E.car} *CAR AVAILABLE* ${E.car}`,
//       "",
//      `${E.calendar} *Date:* ${dateStr} ${relativeStr ? ` ${relativeStr}` : ""}`,
//       "",
//       `${E.clock} *Time:* ${timeStr}`,
//       "",
//       `${E.pin} From: *${fromPart}*`,
//       ...(intermediateStops.length > 0
//         ? ["", `${E.stop} Stops/Via: *${intermediateStops?.join(", ")}*`]
//         : []),
//       "",
//       `${E.pin} To: *${toPart}*`,
//       "",
//       `${E.seat} *Seats available:* ${seatsAvailable}`,
//       "",
//       `${E.check} Book now — ${E.link}:`,
//       url,
//     ]
//       .filter((line) => line !== undefined)
//       .join("\n");

//     // Prefer Web Share API so message (with emojis) is passed directly — no URL encoding issues
//     if (typeof navigator !== "undefined" && navigator.share) {
//       navigator
//         .share({
//           text: message,
//         })
//         .catch(() => {
//           openWhatsAppFallback(message);
//         });
//     } else {
//       openWhatsAppFallback(message);
//     }
//   };

//   function openWhatsAppFallback(text: string) {
//     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
//     window.open(whatsappUrl, "_blank", "noopener,noreferrer");
//   }

//   return (
//     <Button
//       type="button"
//       variant="outline"
//       size="sm"
//       onClick={handleShare}
//       className="gap-2"
//     >
//       <Share2 className="h-4 w-4" />
//       Share via WhatsApp
//     </Button>
//   );
// }




"use client";

import { Button } from "@/components/ui/button";
import { getRouteShareParts } from "@/lib/constants/route-share";
import { formatShareDateIST, formatShareTimeIST } from "@/lib/date-time";
import { Share2 } from "lucide-react";

type Props = {
  rideId: string;
  fromCity: string;
  toCity: string;
  stopsCities?: string[];
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
  stopsCities,
  departureTime,
  seatsAvailable,
  driverName,
  driverPhone,
  vehicleInfo,
}: Props) {
  const handleShare = () => {
    const intermediateStops = (stopsCities ?? []).map((s) => s.trim()).filter(Boolean);
    const { fromPart, toPart } =
      intermediateStops.length > 0 ? { fromPart: fromCity, toPart: toCity } : getRouteShareParts(fromCity, toCity);
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
      routeMap: String.fromCodePoint(0x1f5fa, 0xfe0f),
      pin: String.fromCodePoint(0x1f4cd),
      stop: String.fromCodePoint(0x1f6d1),
      check: String.fromCodePoint(0x2705),
    };

    const message = [
      `${E.car} *CAR AVAILABLE* ${E.car}`,
      "",
      `*Date:* ${dateStr}`,
      `${relativeStr ? ` ${relativeStr}` : ""}`,
      `${timeStr}`,
      `${E.pin} From: *${fromPart}*`,
      ...(intermediateStops.length > 0
        ? [`${E.stop} Stops/Via: *${intermediateStops?.join(", ")}*`]
        : []),
      `${E.pin} To: *${toPart}*`,
      `${E.seat} *Seats available:* ${seatsAvailable}`,
      `${E.check} Book now:`,
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
      Share
    </Button>
  );
}
