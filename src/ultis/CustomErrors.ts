import { ErrorCodes } from '~/constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'

export abstract class BaseError extends Error {
  abstract readonly statusCode: number
  abstract readonly errorCode: number
  abstract readonly isOperational: boolean
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message)
    Object.setPrototypeOf(this, BaseError.prototype)
    Error.captureStackTrace(this)
  }
}

export class AuthenticationError extends BaseError {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED
  readonly errorCode = ErrorCodes.AUTHENTICATION
  readonly isOperational = true
  constructor(message: string) {
    super(message)
  }
}

export class AuthorizationError extends BaseError {
  readonly statusCode = HTTP_STATUS.FORBIDDEN
  readonly errorCode = ErrorCodes.AUTHORIZATION
  readonly isOperational = true
  constructor(message: string) {
    super(message)
  }
}

export class ConflictError extends BaseError {
  readonly statusCode = HTTP_STATUS.CONFLICT
  readonly errorCode = ErrorCodes.CONFLICT
  readonly isOperational = true
  constructor(message: string) {
    super(message)
  }
}

export class NotFoundError extends BaseError {
  readonly statusCode = HTTP_STATUS.NOT_FOUND
  readonly errorCode = ErrorCodes.NOT_FOUND
  readonly isOperational = true
  constructor(message: string) {
    super(message)
  }
}
