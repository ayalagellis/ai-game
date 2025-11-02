import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message } = error;

  // Log error details
  console.error('Error:', {
    statusCode,
    message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send error response with more details in development
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && !isDevelopment 
        ? 'Internal Server Error' 
        : message,
      ...(isDevelopment && statusCode === 500 && { 
        details: error.stack,
        originalMessage: message
      }),
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
