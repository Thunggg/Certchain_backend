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
  if (file.size > fileSize) {
    return next(new BadRequestError('File size must be less than 10Mb'))
  }

  next()
}

export const mintCertificateValidator = validate(
  checkSchema(
    {
      owner: {
        isEthereumAddress: {
          errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
        }
      }
    },
    ['body']
  )
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

export const verifyCertificateByQueryValidator = validate(
  checkSchema(
    {
      tokenId: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.TOKEN_ID_IS_REQUIRED
        },
        isInt: {
          errorMessage: USERS_MESSAGES.TOKEN_ID_IS_NOT_VALID
        },
        custom: {
          options: (value) => {
            if (value < 0) {
              throw new BadRequestError(USERS_MESSAGES.TOKEN_ID_IS_NOT_VALID)
            }
            return true
          }
        }
      },
      contractAddress: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONTRACT_ADDRESS_IS_REQUIRED
        },
        isEthereumAddress: {
          errorMessage: USERS_MESSAGES.CONTRACT_ADDRESS_IS_NOT_VALID
        }
      },
      chainId: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CHAIN_ID_IS_REQUIRED
        },
        isInt: {
          errorMessage: USERS_MESSAGES.CHAIN_ID_IS_NOT_VALID
        }
      },
      type: {
        optional: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.TYPE_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.TYPE_IS_NOT_VALID
        }
      },
      sig: {
        optional: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.SIG_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.SIG_IS_NOT_VALID
        }
      }
    },
    ['query']
  )
)

export const getCertificateByOwnerAddressValidator = validate(
  checkSchema({
    ownerAddress: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.OWNER_IS_REQUIRED
      },
      isEthereumAddress: {
        errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
      }
    }
  },
    ['body']
  ) 
)