import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import { BadRequestError, NotFoundError } from '~/ultis/CustomErrors'
import { validate } from '~/ultis/validation'

export const uploadFileValidator = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File | undefined
  if (!file) {
    return next(new NotFoundError('File not found'))
  }

  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowed.includes(file.mimetype)) {
    return next(new BadRequestError('File type not supported'))
  }

  const fileSize = 1024 * 1024 * 10 // 10Mb
  if(file.size > fileSize) {
    return next(new BadRequestError('File size must be less than 10Mb'))
  }

  next()
}

export const mintCertificateValidator = validate(
  checkSchema({
    owner: {
      isEthereumAddress: {
        errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
      }
    }
  })
)

export const verifyCertificateValidator = validate(
  checkSchema({
    tokenId: {
      in: [`body`],
      notEmpty: {
        errorMessage: USERS_MESSAGES.TOKEN_ID_IS_REQUIRED
      },
      isInt: {
        errorMessage: USERS_MESSAGES.TOKEN_ID_IS_NOT_VALID
      }
    }
  })
)