import { NextFunction, Request, Response } from 'express'
import { MongoError, MongoServerError } from 'mongodb'
import { ErrorCodes } from '~/constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { BaseError } from '~/ultis/CustomErrors'
import { ApiError, ApiErrorResponseWithStatus } from '~/ultis/ApiError'
import { Error as MongooseError } from 'mongoose'

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
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
      .status(HTTP_STATUS.CONFLICT)
      .json(
        new ApiError(
          ErrorCodes.CONFLICT,
          `${field} already exists`,
          HTTP_STATUS.CONFLICT,
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

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const formattedErrors = Object.keys(err.errors).map((field) => {
      const fieldError = err.errors[field] as MongooseError.ValidatorError
      return {
        field,
        message: fieldError.message,
        value: fieldError.value
      }
    })
    const apiError = new ApiError(
      ErrorCodes.VALIDATION,
      'Validation error',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      new Date().toISOString(),
      formattedErrors
    )
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(apiError.toResponse())
  }

  //default error
  const status = typeof (err as any)?.status === 'number' ? (err as any).status : HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message =
    (err as any)?.message && typeof (err as any).message === 'string'
      ? (err as any).message
      : 'Internal server error'

  const apiError = new ApiError(ErrorCodes.INTERNAL, message, status, new Date().toISOString(), [])
  return res.status(status).json(apiError.toResponse())
}
