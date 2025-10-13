import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { mintCreativeService } from '~/services/creative.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'
import { NotFoundError } from '~/ultis/CustomErrors'

export const mintCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File
  const ownerAddress = req.body.owner
  const issuerName = req.body.issuerName

  const result = await mintCreativeService({ owner: ownerAddress, issuerName, file })

  res.status(200).json(new ApiSuccess(200, 'Creative minted successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}