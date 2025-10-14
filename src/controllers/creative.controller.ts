import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { leaseCreativeService, mintCreativeService } from '~/services/creative.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'

export const mintCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File
  const ownerAddress = req.body.owner
  const issuerName = req.body.issuerName

  const result = await mintCreativeService({ owner: ownerAddress, issuerName, file })

  res.status(200).json(new ApiSuccess(200, 'Creative minted successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}

export const leaseCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const tokenId = req.body.tokenId
  const user = req.body.user
  const expires = req.body.expires

  const result = await leaseCreativeService({ tokenId, user, expires })

  res.status(200).json(new ApiSuccess(200, 'Creative leased successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}