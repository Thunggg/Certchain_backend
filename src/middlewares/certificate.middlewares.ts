import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import { NotFoundError } from '~/ultis/CustomErrors'
import { validate } from '~/ultis/validation'

export const mintCertificateValidator = validate(
  checkSchema({
    owner: {
      isEthereumAddress: {
        errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
      }
    }
  })
)
