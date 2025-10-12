import { createHash } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { mintCertificateService, verifyCertificateByQueryService, verifyCertificateService } from '~/services/certificate.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'
import { BadRequestError, NotFoundError } from '~/ultis/CustomErrors'
import { ParamsDictionary } from 'express-serve-static-core'
import { mintCertificateReqBody, verifyCertificateReqBody, verifyCertificateReqQuery } from '~/models/requests/certificate'

export const mintCertificateController = async (req: Request<ParamsDictionary, any, mintCertificateReqBody>, res: Response, next: NextFunction) => {
  if (!req.file) throw new NotFoundError('File not found')
  const ownerAddress = req.body.owner

  const result = await mintCertificateService({ owner: ownerAddress, file: req.file })

  res.status(200).json(new ApiSuccess(200, 'Certificate minted successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}

export const verifyCertificateController = async (req: Request<ParamsDictionary, any, verifyCertificateReqBody>, res: Response, next: NextFunction) => {
  const tokenId = req.body.tokenId
  const file = req.file as Express.Multer.File

  const result = await verifyCertificateService({ tokenId, file })

  if(result.onChainMatch === false) throw new NotFoundError('Certificate not found')

  res.status(200).json(new ApiSuccess(200, 'Certificate verified successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}

export const verifyCertificateByQueryController = async (req: Request<ParamsDictionary, any, any, verifyCertificateReqQuery>, res: Response, next: NextFunction) => {
  try {
  const tokenId = req.query.tokenId
  const contractAddress = req.query.contractAddress
  const chainId = req.query.chainId
  const type = req.query.type

  const result = await verifyCertificateByQueryService({ tokenId, contractAddress, chainId, type })

  res.status(200).json(new ApiSuccess(200, 'Certificate verified successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
  }catch(err) {
    next(err)
  }
}