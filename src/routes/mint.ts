import { Router } from 'express'
import { mintCertificate } from '~/controllers/mint.controller'

const mintRouter = Router()

mintRouter.post('/certificate', mintCertificate)

export default mintRouter
