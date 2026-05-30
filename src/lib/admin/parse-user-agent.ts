export type UserAgentSummary = {
  browser: string
  os: string
  mobile: boolean
  label: string
}

export function parseUserAgentSummary(ua: string | null | undefined): UserAgentSummary {
  if (!ua?.trim()) {
    return { browser: "—", os: "—", mobile: false, label: "—" }
  }

  const s = ua.trim()
  const mobile = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(s)

  let browser = "Браузер"
  if (/Edg\//i.test(s)) browser = "Edge"
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera"
  else if (/YaBrowser/i.test(s)) browser = "Яндекс"
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = "Chrome"
  else if (/Firefox\//i.test(s)) browser = "Firefox"
  else if (/Safari\//i.test(s) && !/Chrome/i.test(s)) browser = "Safari"
  else if (/MSIE|Trident/i.test(s)) browser = "IE"

  let os = "ОС"
  if (/Windows NT 10/i.test(s)) os = "Windows"
  else if (/Windows/i.test(s)) os = "Windows"
  else if (/Mac OS X|Macintosh/i.test(s)) os = mobile ? "iOS" : "macOS"
  else if (/Android/i.test(s)) os = "Android"
  else if (/iPhone|iPad|iPod/i.test(s)) os = "iOS"
  else if (/Linux/i.test(s)) os = "Linux"

  const label = `${browser} · ${os}${mobile ? " · моб." : ""}`
  return { browser, os, mobile, label }
}
