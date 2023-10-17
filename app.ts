import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
require('dotenv').config()
export const app = express()
import {ErrorMiddleware} from "./middleware/error"
import userRouter from './routes/userRoutes';
import courseRouter from './routes/courseRoutes';
import orderRouter from './routes/orderRoutes';
import analyticsRouter from './routes/analyticRoutes';
import notificationRouter from './routes/notificationRoutes';
import layoutRouter from './routes/layoutRoutes';
import { rateLimit } from 'express-rate-limit'




// body parser
app.use( express.json( { limit: "50mb" } ) );

// cookie parser
app.use( cookieParser() );


//cors
app.use( cors( {
        origin: ["http://localhost:3000/", "https://localhost:3000/", "http://localhost:3000"],
        credentials: true,
} ) );


// routes
app.use("/api/v1", userRouter, courseRouter, orderRouter, notificationRouter, analyticsRouter, layoutRouter)



// testing api route
app.get( "/test", ( req: Request, res: Response, next: NextFunction ) => {
    res.status( 200 ).json( {
        success: true,
        message: "API is working"
    } );
} );


// unknown route
app.all("*", ( req: Request, res: Response, next: NextFunction ) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any
    err.statusCode = 404
    next(err)
})
// api requests limit
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
})



 // it's for ErrorHandling
 app.use(limiter);
 app.use(ErrorMiddleware);