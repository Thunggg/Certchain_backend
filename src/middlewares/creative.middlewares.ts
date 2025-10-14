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
        notEmpty: {
          errorMessage: USERS_MESSAGES.ISSUER_NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.ISSUER_NAME_IS_NOT_STRING
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
        notEmpty: {
          errorMessage: USERS_MESSAGES.TOKEN_ID_IS_REQUIRED
        },
        custom: {
          options: (value) => {
            if(!Number.isInteger(value) || value < 0) {
              throw new BadRequestError(USERS_MESSAGES.TOKEN_ID_IS_NOT_VALID)
            }
            return true
          }
        }
      },
      user: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.USER_IS_REQUIRED
        }
      },
      isEthereumAddress: {
        errorMessage: USERS_MESSAGES.USER_IS_NOT_VALID
      },
      expires: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EXPIRES_IS_REQUIRED
        }
      },
      isInt: {
        errorMessage: USERS_MESSAGES.EXPIRES_IS_NOT_VALID
      }
    },
    ['body']
  )
)
