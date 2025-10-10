import { NextFunction, Request, Response } from 'express'
import { MongoError, MongoServerError } from 'mongodb'
import { ErrorCodes } from '~/constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { BaseError } from '~/ultis/CustomErrors'
import { ApiError, ApiErrorResponseWithStatus } from '~/ultis/ApiError'

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Custom domain errors
  if (err instanceof BaseError) {
    const apiError = new ApiError(err.errorCode, err.message, err.statusCode, new Date().toISOString(), [])
    return res.status(err.statusCode).json(apiError.toResponse())
  }

  // Xử lý MongoDB duplicate key error (email đã tồn tại)
  if ((err as MongoError).code === 11000) {
    const field = Object.keys((err as MongoServerError).keyPattern ?? {})[0]

    const formattedErrors = Object.keys((err as MongoServerError).keyPattern).map((field) => {
      return {
        field,
        message: `${field} already exists`,
        value: (err as MongoServerError).keyValue?.[field]
      }
    })

    return res
      .status(400)
      .json(
        new ApiError(
          ErrorCodes.CONFLICT,
          `${field} already exists`,
          400,
          new Date().toISOString(),
          formattedErrors
        ).toResponse()
      )
  }

  // JWT errors
  if (err instanceof TokenExpiredError || (err as any)?.name === 'TokenExpiredError') {
    const apiError = new ApiError(
      ErrorCodes.AUTHENTICATION,
      'Token expired',
      HTTP_STATUS.UNAUTHORIZED,
      new Date().toISOString(),
      []
    )
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiError.toResponse())
  }

  if (err instanceof JsonWebTokenError || (err as any)?.name === 'JsonWebTokenError') {
    const apiError = new ApiError(
      ErrorCodes.AUTHENTICATION,
      'Invalid access token',
      HTTP_STATUS.UNAUTHORIZED,
      new Date().toISOString()
    )
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(apiError.toResponse())
  }

  //default error
  const apiError = new ApiError(
    ErrorCodes.INTERNAL,
    (err as ApiErrorResponseWithStatus).msg.message || 'Internal server error',
    (err as ApiErrorResponseWithStatus).msg.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    new Date().toISOString(),
    []
  )
  return res
    .status((err as ApiErrorResponseWithStatus).msg.status || HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(apiError.toResponse())
}
