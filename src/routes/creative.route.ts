import { Router } from "express";
import { mintCreativeController } from "~/controllers/creative.controller";
import { uploadFileValidator } from "~/middlewares/certificate.middlewares";
import { mintCreativeValidator } from "~/middlewares/creative.middlewares";
import { wrapRequestHandler } from "~/ultis/handlers";

const creativeRouter = Router()

// POST /api/creative/mint
creativeRouter.post('/mint', uploadFileValidator, mintCreativeValidator, wrapRequestHandler(mintCreativeController))

export default creativeRouter