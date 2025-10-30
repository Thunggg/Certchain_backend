import { checkSchema } from 'express-validator'
import { validate } from '~/ultis/validation'
import { USERS_MESSAGES } from '~/constants/messages'
import { BadRequestError } from '~/ultis/CustomErrors'

export const mintCreativeValidator = validate(
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
        custom: {
          options: (_value, { req }) => {
            const hasIssuer = typeof req.body.issuerName === 'string' && req.body.issuerName.trim().length > 0
            const hasOwnerName = typeof req.body.ownerName === 'string' && req.body.ownerName.trim().length > 0
            if (!hasIssuer && !hasOwnerName) {
              throw new BadRequestError(USERS_MESSAGES.ISSUER_NAME_IS_REQUIRED)
            }
            return true
          }
        }
      },
      ownerName: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.ISSUER_NAME_IS_NOT_STRING
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Owner name length must be 1-200 characters'
        }
      },
      title: {
        optional: true,
        isString: {
          errorMessage: 'Title must be a string'
        },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: 'Title length must be 1-200 characters'
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
      }
    },
    ['body']
  )
)

export const leaseCreativeValidator = validate(
  checkSchema(
    {
      tokenId: {
        in: ['body'],
        notEmpty: {
          errorMessage: USERS_MESSAGES.TOKEN_ID_IS_REQUIRED
        },
        isInt: {
          options: { min: 0 },
          errorMessage: USERS_MESSAGES.TOKEN_ID_IS_NOT_VALID
        },
        toInt: true
      },
      user: {
        in: ['body'],
        notEmpty: {
          errorMessage: USERS_MESSAGES.USER_IS_REQUIRED
        },
        isEthereumAddress: {
          errorMessage: USERS_MESSAGES.USER_IS_NOT_VALID
        }
      },
      expires: {
        in: ['body'],
        notEmpty: {
          errorMessage: USERS_MESSAGES.EXPIRES_IS_REQUIRED
        },
        isInt: {
          options: { min: 0 },
          errorMessage: USERS_MESSAGES.EXPIRES_IS_NOT_VALID
        },
        toInt: true
      }
    },
    ['body']
  )
)

export const getCreativeByOwnerAddressValidator = validate(
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