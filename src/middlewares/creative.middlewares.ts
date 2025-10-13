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
      }
    },
    ['body']
  )
)
