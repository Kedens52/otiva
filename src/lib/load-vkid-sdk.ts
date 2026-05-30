const VKID_SDK_URL = "https://unpkg.com/@vkid/sdk@2.6.1/dist-sdk/umd/index.js"
const SCRIPT_ID = "vkid-sdk-script"

let loadPromise: Promise<void> | null = null

export function loadVkIdSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("vkid_sdk_ssr"))
  }
  if (window.VKIDSDK) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (window.VKIDSDK) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("vkid_sdk_load_failed")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = VKID_SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("vkid_sdk_load_failed"))
    document.body.appendChild(script)
  })

  return loadPromise
}
