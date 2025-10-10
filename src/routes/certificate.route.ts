import { Router } from 'express'
import { mintCertificateController } from '~/controllers/certificate.controller'
import { mintCertificateValidator, uploadFileValidator } from '~/middlewares/certificate.middlewares'
import { wrapRequestHandler } from '~/ultis/handlers'

const mintRouter = Router()

mintRouter.post('/certificate', mintCertificateValidator, uploadFileValidator,wrapRequestHandler(mintCertificateController))

export default mintRouter
