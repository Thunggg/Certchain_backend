import express from 'express'
import { ContextRunner, ErrorFormatter, FieldValidationError, validationResult } from 'express-validator'
import { ApiError } from './ApiError'
import { ErrorCodes } from '../constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { AuthenticationError, BaseError } from './CustomErrors'

export const validate = (validations: ContextRunner[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const formatter: ErrorFormatter<FieldValidationError> = (error) => {
      return error as FieldValidationError
    }

    const result = validationResult(req).formatWith<FieldValidationError>(formatter)
    const errors = result.array()

    for (const e of errors) {
      if (e.path === 'authorization' || e.path === 'refresh_token' || e.path === 'email_verify_token') {
        return next(new AuthenticationError(e.msg))
      }

      const m = e?.msg
      if (m instanceof BaseError) {
        return next(m)
      }
    }

    if (!result.isEmpty()) {
      const formatedErrors = errors.map((error: FieldValidationError) => {
        const message = typeof error.msg === 'string' ? error.msg : 'Invalid value'
        return {
          field: error.path,
          message,
          value: error.value
        }
      })
      const apiError = new ApiError(
        ErrorCodes.VALIDATION,
        'Validation error',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        new Date().toISOString(),
        formatedErrors
      )
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(apiError.toResponse())
    }
    next()
  }
}
