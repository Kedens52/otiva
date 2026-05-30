import { AuditAction } from "@/lib/admin/audit"

const LABELS: Record<string, string> = {
  [AuditAction.ADMIN_LOGIN_SUCCESS]: "Успешный вход в админку",
  [AuditAction.ADMIN_LOGIN_FAILED]: "Неудачный вход в админку",
  [AuditAction.ADMIN_LOGOUT]: "Выход из админки",
  [AuditAction.ADMIN_STAFF_CREATED]: "Создан сотрудник",
  [AuditAction.ADMIN_STAFF_ROLE_CHANGED]: "Изменена роль сотрудника",
  [AuditAction.ADMIN_STAFF_CODE_RESET]: "Сброшен код сотрудника",
  [AuditAction.ADMIN_STAFF_SUSPENDED]: "Сотрудник приостановлен",
  [AuditAction.ADMIN_STAFF_ACTIVATED]: "Сотрудник активирован",
  [AuditAction.ADMIN_STAFF_REVOKED]: "Доступ сотрудника отозван",
  [AuditAction.ADMIN_LISTING_APPROVED]: "Объявление одобрено",
  [AuditAction.ADMIN_LISTING_REJECTED]: "Объявление отклонено",
  [AuditAction.ADMIN_WANT_TO_BUY_APPROVED]: "«Хочу купить» одобрено",
  [AuditAction.ADMIN_WANT_TO_BUY_REJECTED]: "«Хочу купить» отклонено",
  [AuditAction.ADMIN_WANT_TO_BUY_CLOSED]: "«Хочу купить» закрыто",
  [AuditAction.ADMIN_USER_BLOCKED]: "Пользователь заблокирован",
  [AuditAction.ADMIN_USER_UNBLOCKED]: "Пользователь разблокирован",
  [AuditAction.ADMIN_USER_RESTRICTED]: "Ограничения на аккаунт",
  [AuditAction.ADMIN_USER_UNRESTRICTED]: "Ограничения сняты",
  [AuditAction.ADMIN_USER_CHATS_LIST_VIEWED]: "Просмотр списка чатов пользователя",
  [AuditAction.ADMIN_USER_CHAT_CONVERSATION_VIEWED]: "Просмотр переписки пользователя",
  [AuditAction.ADMIN_REPORT_STATUS_CHANGED]: "Изменён статус жалобы",
  [AuditAction.ADMIN_SUPPORT_CONVERSATIONS_VIEWED]: "Просмотр обращений в поддержку",
  [AuditAction.ADMIN_SUPPORT_REPLY_SENT]: "Ответ в поддержке",
  [AuditAction.ADMIN_SETTINGS_VIEWED]: "Просмотр настроек",
  [AuditAction.ADMIN_SETTINGS_UPDATED]: "Настройки изменены",
  [AuditAction.ADMIN_BUSINESS_CLIENT_CREATED]: "Создан бизнес-клиент",
  [AuditAction.ADMIN_PERMISSION_DENIED]: "Отказ в доступе",
  [AuditAction.ADMIN_OWNER_BOOTSTRAP]: "Первичная настройка владельца",
}

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action
}

export const AUDIT_ACTION_OPTIONS = Object.entries(LABELS).map(([value, label]) => ({
  value,
  label,
}))
