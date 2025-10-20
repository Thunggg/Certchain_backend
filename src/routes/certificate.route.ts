import { Router } from 'express'
import { getCertificateByOwnerAddressController, mintCertificateController, verifyCertificateByQueryController, verifyCertificateController } from '~/controllers/certificate.controller'
import { getCertificateByOwnerAddressValidator, mintCertificateValidator, uploadFileValidator, verifyCertificateByQueryValidator } from '~/middlewares/certificate.middlewares'
import { wrapRequestHandler } from '~/ultis/handlers'

const certificateRouter = Router()

// POST /api/certificate/mint
certificateRouter.post('/mint', mintCertificateValidator, uploadFileValidator, wrapRequestHandler(mintCertificateController))

// POST /api/certificate/verify (verify by file upload)
certificateRouter.post('/verify', uploadFileValidator, wrapRequestHandler(verifyCertificateController))

// GET /api/certificate/verify (verify by query)
certificateRouter.get('/verify', verifyCertificateByQueryValidator, wrapRequestHandler(verifyCertificateByQueryController))

// GET /api/certificate/get-certificate-by-owner-address
certificateRouter.get('/get-certificate-by-owner-address', getCertificateByOwnerAddressValidator, wrapRequestHandler(getCertificateByOwnerAddressController))

export default certificateRouter
