import { NextResponse } from "next/server"
import { SUPPORT_TOPIC_TREE, CLARIFY_OPTIONS } from "@/lib/support/topics"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    topics: SUPPORT_TOPIC_TREE,
    clarifyOptions: CLARIFY_OPTIONS,
  })
}
