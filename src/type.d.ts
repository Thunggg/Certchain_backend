import { Request } from 'express'
import UserModel, { UserDoc } from '~/models/schemas/User.schema'
import { TokenPayload } from './models/requests/User.request'

declare module 'express' {
  interface Request {
    user?: UserDoc
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
    decode_email_verify_token?: TokenPayload
  }
}
