// Простой парсер User-Agent для отображения устройства в сессиях
export function parseDevice(ua: string | null): string {
  if (!ua) return 'Неизвестное устройство'
  if (/iPhone/i.test(ua))   return 'iPhone, ' + ((/Safari/i.test(ua) && !/Chrome/i.test(ua)) ? 'Safari' : 'Chrome')
  if (/iPad/i.test(ua))     return 'iPad, ' + ((/Safari/i.test(ua) && !/Chrome/i.test(ua)) ? 'Safari' : 'Chrome')
  if (/Android/i.test(ua))  return 'Android, ' + (/Chrome/i.test(ua) ? 'Chrome' : 'Browser')
  if (/Windows/i.test(ua))  return 'Windows, ' + (/Edge/i.test(ua) ? 'Edge' : /Firefox/i.test(ua) ? 'Firefox' : 'Chrome')
  if (/Mac/i.test(ua))      return 'Mac, ' + ((/Safari/i.test(ua) && !/Chrome/i.test(ua)) ? 'Safari' : 'Chrome')
  if (/Linux/i.test(ua))    return 'Linux, ' + (/Firefox/i.test(ua) ? 'Firefox' : 'Chrome')
  return 'Браузер'
}
