import { ImageResponse } from "next/og";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants/brand";

export const runtime = "edge";

export const alt = APP_NAME;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row", // Horizontal layout
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "0 80px",
          border: "20px solid #f8fafc",
        }}
      >
        {/* Logo Container on the Left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "320px",
            height: "320px",
            background: "#ffffff",
            padding: "20px",
            borderRadius: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={APP_NAME}
            width="240"
            height="240"
            style={{ borderRadius: "24px" }}
          />
        </div>

        {/* Content Container on the Right */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "60px",
            justifyContent: "center",
            maxWidth: "640px",
          }}
        >
          <h1
            style={{
              fontSize: "92px",
              fontWeight: "bold",
              color: "#0f172a",
              margin: "0 0 16px 0",
              letterSpacing: "-0.04em",
            }}
          >
            Rydixo
          </h1>
          <p
            style={{
              fontSize: "36px",
              color: "#64748b",
              margin: 0,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Share rides, save money. Trip sharing platform.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
