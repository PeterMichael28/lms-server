import  { IOrder } from "../models/order";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

import notificationModel from "../models/notification";
import cron from 'node-cron'


// get all notifications - admin only
export const getAllNotification = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
      const notification = await notificationModel.find().sort({createdAt: -1})
     
      res.status( 201 ).json( {
        success: true,
        notification
     })
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// update notifications - admin only
export const updateNotificationStatus = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
     try {

         const notificationId = req.params?.id

         const notification = await notificationModel.findById(notificationId)

         notification?.status ? notification.status = 'read' : notification?.status

         await notification?.save()
        
         const notifications = await notificationModel.find().sort({createdAt: -1})
     
         res.status( 201 ).json( {
           success: true,
           notifications
        })
     } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
     }
    }
   );

//    delete notification - admin

cron.schedule( '0 0 0 * * *', async function () {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    await notificationModel.deleteMany({status: "read", createdAt: {$lt: thirtyDaysAgo}})
})