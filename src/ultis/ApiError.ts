export interface ApiErrorResponse {
  success: false
  code: number
  message: string
  errors?: Array<{
    field: string
    message: string
    value?: string
  }>
  status: number
  timestamp: string
  stack?: string // Chỉ hiện trong development
}

export interface ApiErrorResponseWithStatus extends Omit<ApiErrorResponse, 'message'> {
  msg: { message: string; status: number }
}

export class ApiError {
  public success: boolean = false
  public code: number
  public message: string
  public errors?: Array<{
    field: string
    message: string
    value?: string
  }>
  public status: number
  public timestamp: string
  public stack?: string

  constructor(
    code: number,
    message: string,
    status: number,
    timestamp: string,
    errors?: Array<{
      field: string
      message: string
      value?: string
    }>,
    stack?: string
  ) {
    this.code = code
    this.message = message
    this.status = status
    this.timestamp = timestamp
    this.stack = stack
    this.errors = errors

    // Capture stack trace
    Error.captureStackTrace(this, ApiError)
  }

  toResponse(): ApiErrorResponse {
    const response: ApiErrorResponse = {
      success: false,
      code: this.code,
      message: this.message,
      status: this.status,
      errors: this.errors,
      timestamp: this.timestamp,
      stack: this.stack
    }

    if (process.env.NODE_ENV === 'development') {
      response.stack = this.stack
    }

    return response
  }
}
