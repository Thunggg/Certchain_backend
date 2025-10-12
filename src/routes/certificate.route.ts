import { Router } from 'express'
import { mintCertificateController, verifyCertificateByQueryController, verifyCertificateController } from '~/controllers/certificate.controller'
import { mintCertificateValidator, uploadFileValidator, verifyCertificateByQueryValidator } from '~/middlewares/certificate.middlewares'
import { wrapRequestHandler } from '~/ultis/handlers'

const certificateRouter = Router()

// POST /api/certificate/mint
certificateRouter.post('/mint', mintCertificateValidator, uploadFileValidator, wrapRequestHandler(mintCertificateController))

// POST /api/certificate/verify (verify by file upload)
certificateRouter.post('/verify', uploadFileValidator, wrapRequestHandler(verifyCertificateController))

// GET /api/certificate/verify (verify by query)
certificateRouter.get('/verify', verifyCertificateByQueryValidator, wrapRequestHandler(verifyCertificateByQueryController))

export default certificateRouter
