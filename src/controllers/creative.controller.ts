import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { ErrorCodes } from '~/constants/errorCodes'
import { getCreativeByOwnerAddressService, leaseCreativeService, mintCreativeService } from '~/services/creative.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'

export const mintCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File
  const ownerAddress = req.body.owner
  const issuerName = req.body.issuerName ?? req.body.ownerName
  const title = req.body.title
  const description = req.body.description

  const result = await mintCreativeService({ owner: ownerAddress, issuerName, title, description, file })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Creative minted successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}

export const leaseCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const tokenId = req.body.tokenId
  const user = req.body.user
  const expires = req.body.expires

  const result = await leaseCreativeService({ tokenId, user, expires })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Creative leased successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}

export const getCreativeByOwnerAddressController = async (req: Request, res: Response, next: NextFunction) => {
  const ownerAddress = String(req.query.ownerAddress)
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 10)

  const result = await getCreativeByOwnerAddressService({ ownerAddress, page, limit })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Creatives fetched successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}