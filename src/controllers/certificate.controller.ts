import { createHash } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { mintCertificateService } from '~/services/certificate.service'
import { NotFoundError } from '~/ultis/CustomErrors'

export const mintCertificateController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) throw new NotFoundError('File not found')
  const ownerAddress = req.body.owner

  await mintCertificateService({ owner: ownerAddress, file: req.file })

  res.status(200).json({
    message: 'Certificate minted successfully'
  })
}
