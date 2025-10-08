import { Request, Response, NextFunction, RequestHandler } from 'express'
import { ParsedQs } from 'qs'

export const wrapRequestHandler = <
  ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
  Locals extends Record<string, any> = Record<string, any>
>(
  func: (
    req: Request<ParamsDictionary, ResBody, ReqBody, ReqQuery, Locals>,
    res: Response<ResBody, Locals>,
    next: NextFunction
  ) => Promise<void>
) => {
  return async (
    req: Request<ParamsDictionary, ResBody, ReqBody, ReqQuery, Locals>,
    res: Response<ResBody, Locals>,
    next: NextFunction
  ) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
