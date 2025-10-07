import { Request, Response } from 'express'

export const mintCertificate = async (req: Request, res: Response) => {
  return res.status(200).json({ message: 'Certificate minted successfully' })
}
