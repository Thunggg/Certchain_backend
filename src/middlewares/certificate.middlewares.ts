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
      },
      issuerName: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.ISSUER_NAME_IS_NOT_STRING
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Issuer name length must be 1-200 characters'
        }
      },
      certificateName: {
        optional: true,
        isString: {
          errorMessage: 'Certificate name must be a string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Certificate name length must be 1-200 characters'
        }
      },
      description: {
        optional: true,
        isString: {
          errorMessage: 'Description must be a string'
        },
        trim: true,
        isLength: {
          options: { max: 1000 },
          errorMessage: 'Description must be at most 1000 characters'
        }
      },
      issueDate: {
        optional: true,
        custom: {
          options: (value) => {
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) {
              throw new BadRequestError('Issue date is not valid')
            }
            if (date.getTime() > Date.now()) {
              throw new BadRequestError('Issue date cannot be in the future')
            }
            return true
          }
        }
      },
      recipientWallet: {
        optional: true,
        isEthereumAddress: {
          errorMessage: 'Recipient wallet is not valid'
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
      },
      toInt: true
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
        toInt: true,
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
        },
        toInt: true
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
  checkSchema(
    {
      ownerAddress: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.OWNER_IS_REQUIRED
        },
        isEthereumAddress: {
          errorMessage: USERS_MESSAGES.OWNER_IS_NOT_VALID
        }
      },
      page: {
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Page must be a positive integer'
        },
        toInt: true
      },
      limit: {
        optional: true,
        isInt: {
          options: { min: 1, max: 100 },
          errorMessage: 'Limit must be an integer between 1 and 100'
        },
        toInt: true
      }
    },
    ['query']
  )
)
