export interface ApiSuccessResponse<T> {
  success: true
  code: number
  message: string
  status: number
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
  timestamp: string
}

export class ApiSuccess<T> {
  public success: boolean = true
  public code: number
  public message: string
  public status: number
  public data: T
  public meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
  public timestamp: string

  constructor(
    code: number,
    message: string,
    status: number,
    data: T,
    timestamp: string,
    meta?: {
      page?: number
      limit?: number
      total?: number
      totalPages?: number
    }
  ) {
    this.code = code
    this.message = message
    this.status = status
    this.data = data
    this.timestamp = timestamp
    this.meta = meta
  }

  toResponse(): ApiSuccessResponse<T> {
    const response: ApiSuccessResponse<T> = {
      success: true,
      code: this.code,
      message: this.message,
      status: this.status,
      data: this.data,
      meta: this.meta,
      timestamp: this.timestamp
    }
    return response
  }
}
