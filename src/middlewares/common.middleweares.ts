import { NextFunction, Request, Response } from 'express'
import _ from 'lodash'

type FilterKeys<T> = Array<keyof T>

export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = _.pick(req.body, filterKeys)
    next()
  }
