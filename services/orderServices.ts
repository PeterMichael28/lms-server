import {  NextFunction, Response } from 'express'
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import orderModel from '../models/order';


export const createNewOrder = CatchAsyncError(
    async (data: any, next: NextFunction, res: Response) => {
       const order = await orderModel.create(data)

       res.status( 201 ).json( {
        success: true,
        order
     })
     }
    );

        // get all orders
export const getAllOrdersServices = async (res: Response) => {
    const orders = await orderModel.find().sort({createdAt: -1})

    res.status( 201 ).json( {
        success: true,
        orders
    })
}