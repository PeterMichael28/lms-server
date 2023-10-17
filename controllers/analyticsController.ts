
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import {generateLast1YearData} from "../utils/analyticsGenerator";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import userModel from "../models/user";
import courseModel from "../models/course";
import orderModel from '../models/order';


// get users analytics - admin only 
export const getUserAnalytics = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
      const users = await generateLast1YearData(userModel)
     
      res.status( 201 ).json( {
        success: true,
        users
     })
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// get course analytics - admin only 
export const getCourseAnalytics = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
     try {
         const courses = await generateLast1YearData(courseModel)
        
         res.status( 201 ).json( {
           success: true,
           courses
        })
     } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
     }
    }
   );
   

   // get course analytics - admin only 
export const getOrderAnalytics = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
     try {
         const orders = await generateLast1YearData(orderModel)
        
         res.status( 201 ).json( {
           success: true,
           orders
        })
     } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
     }
    }
   );
   
   
   

