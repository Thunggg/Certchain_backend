import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import { validate } from '~/ultis/validation'

export const mintCertificate = validate(
  checkSchema({
    owner: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.OWNER_IS_REQUIRED
      },
      isEthereumAddress: {
        errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
      }
    }
  })
)
