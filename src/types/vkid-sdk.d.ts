export {}

declare global {
  interface Window {
    VKIDSDK?: VkIdSdk
  }
}

interface VkIdOneTap {
  render: (options: Record<string, unknown>) => VkIdOneTap
  on: (event: string, handler: (payload?: Record<string, string>) => void) => VkIdOneTap
}

interface VkIdSdk {
  Config: {
    init: (options: Record<string, unknown>) => void
  }
  ConfigResponseMode: {
    Callback: string
  }
  ConfigSource: {
    LOWCODE: string
  }
  WidgetEvents: {
    ERROR: string
  }
  OneTapInternalEvents: {
    LOGIN_SUCCESS: string
  }
  OneTap: new () => VkIdOneTap
  Auth: {
    exchangeCode: (code: string, deviceId: string) => Promise<Record<string, unknown>>
  }
}
