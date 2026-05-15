import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Pokhara Tours and Travel — Discover the heart of Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #0284c7 0%, #075985 60%, #0c4a6e 100%)",
          fontFamily: "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(254, 136, 0, 0.18)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.08)",
            filter: "blur(80px)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            P
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Pokhara Tours and Travel
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            Discover the heart of Nepal
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              maxWidth: 880,
            }}
          >
            Curated journeys to Pokhara, the Annapurnas, Everest, Chitwan and beyond.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              borderRadius: 9999,
              background: "#fe8800",
              fontSize: 22,
              fontWeight: 700,
              color: "white",
            }}
          >
            Plan your trip →
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 500,
            }}
          >
            pokharatours.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
