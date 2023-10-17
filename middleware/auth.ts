import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import userModel, { IUser } from '../models/user'
import ErrorHandler from '../utils/ErrorHandler'
import {CatchAsyncError} from '../middleware/catchAsyncErrors'
import { redis } from '../utils/redis';
import { updateAccessToken } from "../controllers/userController";


// authenticated user
export const isAuthenticated = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
 


    if(!access_token){
        return next(new ErrorHandler("Ogbeni, login to continue jhors", 401));
    }
  

    const decoded: any = jwt.verify(access_token, process.env.ACCESS_TOKEN!);

    if(!decoded){
        return next(new ErrorHandler("access token not valid", 400));
    }
    // console.log('decoded', decoded)

    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
          await updateAccessToken(req, res, next);
        } catch (error) {
          return next(error);
        }
      } else {
        const user = await redis.get(decoded.id);
  
        if (!user) {
          return next(
            new ErrorHandler("Please login to access this resource", 400)
          );
        }
  
        req.user = JSON.parse(user);
  
        next();
      }
});



// validate roles

export const authorizeRoles = ( ...roles: string[] ) => {
    return ( req: Request, res: Response, next: NextFunction ) => {
        if (!roles.includes( req.user?.role || '' ) ) {
            return next(new ErrorHandler(`Role: ${req.user?.role} not permitted to access this resource`, 403))
        }
        next()
    }
}