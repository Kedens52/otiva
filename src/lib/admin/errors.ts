export class AdminUnauthorizedError extends Error {
  readonly statusCode = 401
  constructor(message = "Не авторизован") {
    super(message)
    this.name = "AdminUnauthorizedError"
  }
}

export class AdminForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message = "Недостаточно прав") {
    super(message)
    this.name = "AdminForbiddenError"
  }
}

export class AdminLockedError extends Error {
  readonly statusCode = 429
  constructor(message = "Вход временно ограничен. Попробуйте позже.") {
    super(message)
    this.name = "AdminLockedError"
  }
}

export class AdminConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) {
    super(message)
    this.name = "AdminConflictError"
  }
}
