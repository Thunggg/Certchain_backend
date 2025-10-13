import { checkSchema } from 'express-validator'
import { validate } from '~/ultis/validation'
import { USERS_MESSAGES } from '~/constants/messages'

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
