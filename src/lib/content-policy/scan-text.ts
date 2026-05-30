import { HARD_BLOCK_PATTERNS, REVIEW_PATTERNS, type ContentPatternRule } from "@/lib/content-policy/patterns"

export type ProhibitedTextScan = {
  hardFlags: string[]
  reviewFlags: string[]
  hardCodes: string[]
  reviewCodes: string[]
}

function collectMatches(text: string, rules: ContentPatternRule[]) {
  const matched: ContentPatternRule[] = []
  for (const rule of rules) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(text)) matched.push(rule)
  }
  return matched
}

export function scanProhibitedText(text: string): ProhibitedTextScan {
  const hard = collectMatches(text, HARD_BLOCK_PATTERNS)
  const review = collectMatches(text, REVIEW_PATTERNS)
  return {
    hardFlags: hard.map((r) => r.reason),
    reviewFlags: review.map((r) => r.reason),
    hardCodes: [...new Set(hard.map((r) => r.code))],
    reviewCodes: [...new Set(review.map((r) => r.code))],
  }
}
