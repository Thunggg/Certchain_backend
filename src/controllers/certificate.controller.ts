import { createHash } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { mintCertificateService } from '~/services/certificate.service'
import { ApiSuccess } from '~/ultis/ApiSuccess'
import { NotFoundError } from '~/ultis/CustomErrors'

export const mintCertificateController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) throw new NotFoundError('File not found')
  const ownerAddress = req.body.owner

  const result = await mintCertificateService({ owner: ownerAddress, file: req.file })

  res.status(200).json(new ApiSuccess(200, 'Certificate minted successfully', HTTP_STATUS.OK, result, new Date().toISOString()))
}
