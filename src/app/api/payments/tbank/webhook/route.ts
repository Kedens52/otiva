import { NextRequest, NextResponse } from "next/server"
import { tbankConfig, verifyTbankToken } from "@/lib/tbank"
import { handleTbankWebhookPayload } from "@/lib/payments/tbank-webhook-handler"

type TbankWebhook = Record<string, string | number | boolean | null | undefined | object>

export async function POST(request: NextRequest) {
  try {
    const config = tbankConfig()
    if (!config) return new NextResponse("PAYMENT_CONFIG_ERROR", { status: 500 })

    const payload = (await request.json()) as TbankWebhook
    if (!verifyTbankToken(payload, config.password)) {
      console.warn("tbank webhook: invalid token", { orderId: payload.OrderId })
      return new NextResponse("INVALID_TOKEN", { status: 403 })
    }

    const result = await handleTbankWebhookPayload(payload)
    if (result === "NO_ORDER") return new NextResponse("NO_ORDER", { status: 400 })
    if (result === "NO_PAYMENT") return new NextResponse("NO_PAYMENT", { status: 404 })

    return new NextResponse("OK")
  } catch (error) {
    console.error("tbank webhook error:", error)
    return new NextResponse("ERROR", { status: 500 })
  }
}
