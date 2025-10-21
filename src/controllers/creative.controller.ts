import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { ErrorCodes } from '~/constants/errorCodes'
import { getCreativeByOwnerAddressService, leaseCreativeService, mintCreativeService } from '~/services/creative.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'

export const mintCreativeController = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file as Express.Multer.File
  const ownerAddress = req.body.owner
  const issuerName = req.body.issuerName

  const result = await mintCreativeService({ owner: ownerAddress, issuerName, file })

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
  const ownerAddress = req.body.ownerAddress
  const page = Number(req.body.page)
  const limit = Number(req.body.limit)

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