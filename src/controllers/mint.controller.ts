import { NextFunction, Request, Response } from 'express'

export const mintCertificateController = async (req: Request, res: Response, next: NextFunction) => {
  const file = req.body
  console.log(file)
}
