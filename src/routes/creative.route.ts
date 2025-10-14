import { Router } from "express";
import { leaseCreativeController, mintCreativeController } from "~/controllers/creative.controller";
import { uploadFileValidator } from "~/middlewares/certificate.middlewares";
import { leaseCreativeValidator, mintCreativeValidator } from "~/middlewares/creative.middlewares";
import { wrapRequestHandler } from "~/ultis/handlers";

const creativeRouter = Router()

// POST /api/creative/mint
creativeRouter.post('/mint', uploadFileValidator, mintCreativeValidator, wrapRequestHandler(mintCreativeController))

// POST /api/creative/
creativeRouter.post('/lease', leaseCreativeValidator, wrapRequestHandler(leaseCreativeController))

export default creativeRouter