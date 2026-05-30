import crypto from "crypto"

export const TBANK_INIT_URL = "https://securepay.tinkoff.ru/v2/Init"
export const TBANK_GET_QR_URL = "https://securepay.tinkoff.ru/v2/GetQr"

export type TbankConfig = NonNullable<ReturnType<typeof tbankConfig>>

type TokenValue = string | number | boolean | null | undefined | object

function tokenString(value: TokenValue) {
  if (value === null || value === undefined) return null
  if (typeof value === "object") return null
  return String(value)
}

export function createTbankToken(payload: Record<string, TokenValue>, password: string) {
  const pairs = Object.entries({ ...payload, Password: password })
    .filter(([key, value]) => key !== "Token" && tokenString(value) !== null)
    .sort(([a], [b]) => a.localeCompare(b))

  const base = pairs.map(([, value]) => tokenString(value)).join("")
  return crypto.createHash("sha256").update(base, "utf8").digest("hex")
}

export function verifyTbankToken(payload: Record<string, TokenValue>, password: string) {
  const expected = createTbankToken(payload, password)
  const actual = typeof payload.Token === "string" ? payload.Token : ""
  if (!actual || actual.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

export function tbankConfig() {
  const terminalKey = process.env.TBANK_TERMINAL_KEY
  const password = process.env.TBANK_PASSWORD
  if (!terminalKey || !password) return null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nashlo.ru"
  return {
    terminalKey,
    password,
    apiToken: process.env.TBANK_API_TOKEN || "",
    successUrl: process.env.TBANK_SUCCESS_URL || `${appUrl}/payment/success`,
    failUrl: process.env.TBANK_FAIL_URL || `${appUrl}/payment/fail`,
    notificationUrl: process.env.TBANK_NOTIFICATION_URL || `${appUrl}/api/payments/tbank/webhook`,
  }
}

/** SVG QR СБП после успешного Init — @see https://developer.tbank.ru/eacq/api/get-qr */
export async function fetchTbankSbpQrSvg(
  paymentId: number | string,
  config: TbankConfig,
): Promise<string | null> {
  const payload = {
    TerminalKey: config.terminalKey,
    PaymentId: Number(paymentId),
    DataType: "IMAGE",
  }
  const token = createTbankToken(payload, config.password)
  const res = await fetch(TBANK_GET_QR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
    },
    body: JSON.stringify({ ...payload, Token: token }),
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.Success || typeof data.Data !== "string") {
    console.warn("tbank GetQr failed:", data.Message || data.Details)
    return null
  }
  return data.Data
}

export function promotionDays(serviceType: string) {
  const normalized = serviceType.toLowerCase()
  if (normalized.includes("month") || normalized.includes("30")) return 30
  if (normalized.includes("week") || normalized.includes("7")) return 7
  return null
}
