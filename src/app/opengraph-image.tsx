import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Нашло — бесплатные объявления рядом"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "linear-gradient(135deg, rgb(17,24,39) 0%, rgb(234,88,12) 55%, rgb(251,191,36) 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "190px",
            height: "64px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.14)",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          НАШЛО
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "900px" }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 800 }}>
            Бесплатные объявления рядом
          </div>
          <div style={{ marginTop: 20, fontSize: 32, lineHeight: 1.3, opacity: 0.92 }}>
            Товары, авто, недвижимость и услуги на одной площадке.
          </div>
        </div>
      </div>
    ),
    size,
  )
}
