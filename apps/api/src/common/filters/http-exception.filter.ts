import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let errorCode = 'INTERNAL_SERVER_ERROR'
    let errorMessage = 'An unexpected error occurred'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        errorMessage = res
        errorCode = exception.name.toUpperCase().replace('EXCEPTION', '_ERROR')
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>
        if (Array.isArray(resObj.message)) {
          errorMessage = resObj.message.join(', ')
          errorCode = 'VALIDATION_ERROR'
        } else if (typeof resObj.message === 'string') {
          errorMessage = resObj.message
          errorCode =
            (resObj.error as string)?.toUpperCase().replace(/\s+/g, '_') ||
            exception.name.toUpperCase().replace('EXCEPTION', '_ERROR')
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack
      )
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
