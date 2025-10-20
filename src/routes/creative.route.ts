import { Router } from "express";
import { getCreativeByOwnerAddressController, leaseCreativeController, mintCreativeController } from "~/controllers/creative.controller";
import { uploadFileValidator } from "~/middlewares/certificate.middlewares";
import { getCreativeByOwnerAddressValidator, leaseCreativeValidator, mintCreativeValidator } from "~/middlewares/creative.middlewares";
import { wrapRequestHandler } from "~/ultis/handlers";

const creativeRouter = Router()

// POST /api/creative/mint
creativeRouter.post('/mint', uploadFileValidator, mintCreativeValidator, wrapRequestHandler(mintCreativeController))

// POST /api/creative/
creativeRouter.post('/lease', leaseCreativeValidator, wrapRequestHandler(leaseCreativeController))

// GET /api/creative/get-creative-by-owner-address
creativeRouter.get('/get-creative-by-owner-address', getCreativeByOwnerAddressValidator, wrapRequestHandler(getCreativeByOwnerAddressController))

export default creativeRouter