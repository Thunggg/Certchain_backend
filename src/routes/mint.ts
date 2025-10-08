import { Router } from 'express'
import { mintCertificateController } from '~/controllers/mint.controller'
import { wrapRequestHandler } from '~/ultis/handlers'

const mintRouter = Router()

mintRouter.post('/certificate', wrapRequestHandler(mintCertificateController))

export default mintRouter
