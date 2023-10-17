import ErrorHandler from '../utils/ErrorHandler'
import  { NextFunction, Request, Response } from 'express'

export const ErrorMiddleware =  ( err: any, req: Request, res: Response, next: NextFunction ) => {
    // if error code doesnt exist, set it to default 500
    err.statusCode = err.statusCode || 500
    err.message = err.message || 'Internal Server Error'


    // wrong mongodb id
    if ( err.name === 'CastError' ) {
        const message = `Resource not found, Invalid ${err.path}`
        err = new ErrorHandler(message, 400)
    }

    // Duplicate key error
    if ( err.code === 11000 ) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message, 400)
    }

      // wrong jwt error
  if (err.name === "JsonWebTokenError") {
    const message = `Your jwt is invalid please try again letter`;
    err = new ErrorHandler(message, 400);
  }

  // jwt expired
  if (err.name === "TokenExpiredError") {
    const message = `Your jwt is expired please try again letter!`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message,
  });
} 