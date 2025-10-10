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

  export class BadRequestError extends BaseError {
    readonly statusCode = HTTP_STATUS.BAD_REQUEST
    readonly errorCode = ErrorCodes.BAD_REQUEST
    readonly isOperational = true
    constructor(message: string) {
      super(message)
    }
  }

export class UploadError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST
  readonly errorCode = ErrorCodes.BAD_REQUEST
  readonly isOperational = true
  constructor(message = 'Upload error') {
    super(message)
  }
}

export class WatermarkError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST
  readonly errorCode = ErrorCodes.BAD_REQUEST
  readonly isOperational = true
  constructor(message = 'Watermark error') {
    super(message)
  }
}

export class MetadataError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST
  readonly errorCode = ErrorCodes.BAD_REQUEST
  readonly isOperational = true
  constructor(message = 'Metadata error') {
    super(message)
  }
}

export class BlockchainError extends BaseError {
  readonly statusCode = HTTP_STATUS.BAD_GATEWAY
  readonly errorCode = ErrorCodes.BLOCKCHAIN_ERROR
  readonly isOperational = true
  constructor(message = 'Blockchain error') {
    super(message)
  }
}

export class ConfigError extends BaseError {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
  readonly errorCode = ErrorCodes.INTERNAL
  readonly isOperational = true
  constructor(message = 'Invalid configuration') {
    super(message)
  }
}