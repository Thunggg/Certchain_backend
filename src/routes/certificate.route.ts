import { Router } from 'express'
import { mintCertificateController, verifyCertificateController } from '~/controllers/certificate.controller'
import { mintCertificateValidator, uploadFileValidator, verifyCertificateValidator } from '~/middlewares/certificate.middlewares'
import { wrapRequestHandler } from '~/ultis/handlers'

const mintRouter = Router()

mintRouter.post('/certificate', mintCertificateValidator, uploadFileValidator,wrapRequestHandler(mintCertificateController))
mintRouter.post('/verify-certificate', uploadFileValidator, wrapRequestHandler(verifyCertificateController))


export default mintRouter
