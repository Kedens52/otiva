/* global self, clients */
// Service worker: только push-уведомления Nashlo/Нашло (не кэш приложения).

self.addEventListener("push", (event) => {
  let data = { title: "Нашло", body: "", url: "/chat", tag: "nashlo" }
  try {
    if (event.data) {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    }
  } catch (_) {
    try {
      const t = event.data?.text()
      if (t) data.body = t
    } catch (_) {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/nashlo-logo.svg",
      badge: "/nashlo-logo.svg",
      tag: data.tag || "nashlo",
      data: { url: data.url || "/chat" },
      vibrate: [80, 40, 80],
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const path = event.notification?.data?.url || "/chat"
  const target = new URL(path, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) return c.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
