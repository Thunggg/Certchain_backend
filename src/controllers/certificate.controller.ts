import { createHash } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { ErrorCodes } from '~/constants/errorCodes'
import {
  getCertificateByOwnerAddressService,
  mintCertificateService,
  verifyCertificateByQueryService,
  verifyCertificateService
} from '~/services/certificate.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'
import { NotFoundError } from '~/ultis/CustomErrors'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  getCertificateByOwnerAddressReqQuery,
  mintCertificateReqBody,
  verifyCertificateReqBody,
  verifyCertificateReqQuery
} from '~/models/requests/certificate'

export const mintCertificateController = async (
  req: Request<ParamsDictionary, any, mintCertificateReqBody>,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) throw new NotFoundError('File not found')
  const ownerAddress = req.body.owner

  const result = await mintCertificateService({ owner: ownerAddress, file: req.file })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Certificate minted successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}

export const verifyCertificateController = async (
  req: Request<ParamsDictionary, any, verifyCertificateReqBody>,
  res: Response,
  next: NextFunction
) => {
  const tokenId = req.body.tokenId
  const file = req.file as Express.Multer.File

  const result = await verifyCertificateService({ tokenId, file })

  if (result.onChainMatch === false) throw new NotFoundError('Certificate not found')

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Certificate verified successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}

export const verifyCertificateByQueryController = async (
  req: Request<ParamsDictionary, any, any, verifyCertificateReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const tokenId = Number(req.query.tokenId)
  const contractAddress = req.query.contractAddress
  const chainId = Number(req.query.chainId)
  const type = req.query.type

  const result = await verifyCertificateByQueryService({ tokenId, contractAddress, chainId, type })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Certificate verified successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}

export const getCertificateByOwnerAddressController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ownerAddress = String(req.query.ownerAddress)
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 10)
  
  const result = await getCertificateByOwnerAddressService({ ownerAddress, page, limit })

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        'Certificates fetched successfully',
        HTTP_STATUS.OK,
        result,
        new Date().toISOString()
      )
    )
}