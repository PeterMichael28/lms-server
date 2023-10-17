import {  Response } from 'express'
import courseModel from '../models/course';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';


export const createCourse = CatchAsyncError(
    async (data: any, res: Response) => {
       const course = await courseModel.create(data)

        res.status( 201 ).json( {
            success: true,
            course
       })
     }
    );

    // get all courses
export const getAllCoursesServices = async (res: Response) => {
    const courses = await courseModel.find().sort({createdAt: -1})

    res.status( 201 ).json( {
        success: true,
        courses
    })
}