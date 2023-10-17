import courseModel, { ICourse } from "../models/course";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import { createCourse, getAllCoursesServices } from "../services/courseService";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import notificationModel from "../models/notification";
import axios from "axios";

// upload course
export const uploadCourse = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const data = req.body;
   const thumbnail = data?.thumbnail;

   if (thumbnail) {
    const myCloud = await cloudinary.v2.uploader.upload(
     thumbnail,
     {
      folder: "courses",
     }
    );

    data.thumbnail = {
     public_id: myCloud.public_id,
     url: myCloud.secure_url,
    };
   }
   createCourse(data, res, next);
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// edit course
export const EditCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const thumbnail = data.thumbnail;

      const courseId = req.params.id;

      const courseData = await courseModel.findById(courseId) as any;

      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: courseData?.thumbnail.public_id,
          url: courseData?.thumbnail.url,
        };
      }

      const course = await courseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single course without purchasing
export const getSingleCourse = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const courseId = req.params.id;

   const isCacheExists = await redis.get(courseId);

   if (isCacheExists) {
    const course = JSON.parse(isCacheExists);

    res.status(200).json({
     success: true,
     course,
    });
   } else {
    const course = await courseModel
     .findById(courseId)
     .select(
      "-courseData.videoUrl, -courseData.suggestion, -courseData.questions, -courseData.links"
     );

    await redis.set(courseId, JSON.stringify(course), "EX", 684800);
    res.status(200).json({
     success: true,
     course,
    });
   }
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// get all course without purchasing
export const getAllCourses = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const isCacheExists = await redis.get("allCourses");
   if (isCacheExists) {
    const courses = JSON.parse(isCacheExists);
    // console.log('cache', courses)

    res.status(200).json({
     success: true,
     courses,
    });
   } else {
    const courses = await courseModel
     .find()
     .select(
      "-courseData.videoUrl, -courseData.suggestion, -courseData.questions, -courseData.links"
     );
    //  console.log('not-cached', courses)
    await redis.set("allCourses", JSON.stringify(courses));
    res.status(200).json({
     success: true,
     courses,
    });
   }
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// get course content for valid users
export const getCourseByUser = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const allUserCourses = req.user?.courses;
   const courseId = req.params.id;

   const courseExists = allUserCourses?.find(
    (course: any) => course._id.toString() === courseId
   );
   if (!courseExists) {
    return next(
     new ErrorHandler(
      "You are not eligoble to access this course",
      404
     )
    );
   }

   const course = await courseModel.findById(courseId);
   const content = course?.courseData;

   res.status(200).json({
    success: true,
    content,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// adding question in a course
interface IQuestion {
 question: string;
 courseId: string;
 contentId: string;
}

export const addQuestion = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { question, contentId, courseId } =
    req.body as IQuestion;
   const course = await courseModel.findById(courseId);
   if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return next(
     new ErrorHandler("invalid content id", 400)
    );
   }

   const courseContent = course?.courseData?.find(
    (item: any) => item._id.equals(contentId)
   );

   if (!courseContent) {
    return next(
     new ErrorHandler("invalid content id", 400)
    );
   }

   //  create a new question obj
   const newQuestion: any = {
    user: req.user,
    question,
    questionReplies: [],
   };

   // add the question to the course content
   courseContent.questions.push(newQuestion);

//    notification
await notificationModel.create( {
    user: req.user?._id,
    title: 'New Question ',
    message: `You have a new question in ${ courseContent?.title }`
 })
 

   // save the updated course
   await course?.save();

   res.status(200).json({
    success: true,
    course,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// adding answer to course question
interface IAnswer {
 answer: string;
 courseId: string;
 contentId: string;
 questionId: string;
}

export const addAnswer = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const user = req.user;
   const { answer, contentId, courseId, questionId } =
    req.body as IAnswer;
   const course = await courseModel.findById(courseId);
   if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return next(
     new ErrorHandler("invalid content id", 400)
    );
   }

   const courseContent = course?.courseData?.find(
    (item: any) => item._id.equals(contentId)
   );

   if (!courseContent) {
    return next(
     new ErrorHandler("invalid content id", 400)
    );
   }

   //    get the current question
   const question = courseContent?.questions.find(
    (item: any) => item._id.equals(questionId)
   );
   if (!question) {
    return next(
     new ErrorHandler("invalid question id", 400)
    );
   }

   //  create a new answer object

   const newAnswer: any = {
    user: req.user,
    answer,
   };

   // add the answer to the question
   question.questionReplies?.push(newAnswer);

   //    notification
await notificationModel.create( {
    user: req.user?._id,
    title: 'New Question Answer',
    message: `You have a new answer to a question in ${ courseContent?.title }`
 })
 

   // save the updated course
   await course?.save();

   if (user?._id === question?.user?.id) {
    //    create a notification model
   } else {
    const data = {
     name: question?.user?.name,
     title: courseContent?.title,
    };

    const html = ejs.renderFile(
     path.join(__dirname, "../mails/question-reply.ejs"),
     data
    );

    try {
     await sendMail({
      email: question?.user?.email,
      subject: "Question Reply",
      template: "question-reply.ejs",
      data,
     });
    } catch (error: any) {
     return next(new ErrorHandler(error.message, 400));
    }
   }

   res.status(200).json({
    success: true,
    course,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// add review in course
interface IReview {
 review: string;
 rating: number;
 userId: string;
}

export const addReview = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const user = req.user;
   const userCoursesList = req.user?.courses;
   const { userId, rating, review } = req.body as IReview;

   const courseId = req?.params?.id;
   const courseExists = userCoursesList?.some(
    (course: any) =>
     course._id.toString() === courseId.toString()
   );
   if (!courseExists) {
    return next(
     new ErrorHandler(
      "You are not eligoble to access this course",
      404
     )
    );
   }

   const course = await courseModel.findById(courseId);

   const newReview: any = {
    user: req.user,
    comment: review,
    rating,
   };

   course?.reviews?.push(newReview);

   // ratings
   let avg = 0;
   course?.reviews.forEach((element: any) => {
    avg += element.rating;
   });

   if (course) {
    course.ratings = +(avg / course.reviews.length).toFixed(
     1
    );
   }

   // save the updated course
   await course?.save();

   const notification = {
    title: "New Review Received",
    message: `${req.user?.name} has given a review on your course ${course?.name}`,
   };

   //   create notification

   res.status(200).json({
    success: true,
    course,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 500));
  }
 }
);

// adding reply to review
interface IReplyReview {
    comment: string;
    courseId: string;
    reviewId: string;
   }
   
   export const replyReview = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
     try {
      const user = req.user;
      const { comment, reviewId, courseId } =
       req.body as IReplyReview;
         const course = await courseModel.findById( courseId );
         
      if (!course) {
        return next(
         new ErrorHandler(
          "course not found",
          404
         )
        );
       }
       
        //    get the current review
      const review = course?.reviews?.find(
       (item: any) => item._id.equals(reviewId)
      );
   
      if (!review) {
       return next(
        new ErrorHandler("invalid review id", 400)
       );
      }
   
 
      //  create a new review object
   
      const newAnswer: any = {
       user: req.user,
       comment,
      };

         if ( !review.reviewReplies ) {
            review.reviewReplies = []
      }
   
      // add the answer to the question
      review.reviewReplies?.push(newAnswer);
   
      // save the updated course
      await course?.save();
   
   
      res.status(200).json({
       success: true,
       course,
      });
     } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
     }
    }
   );


//   
 // get all courses- admin

 export const getAllCoursesAdmin = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
      try {
        getAllCoursesServices(res)
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    })
  

     // delete course
     export const deleteCourse = CatchAsyncError(
        async (
         req: Request,
         res: Response,
         next: NextFunction
        ) => {
          try {
            const courseId = req.params?.id
            
            const course = courseModel.findById(courseId)
  
            if ( !course ) {
              return next(new ErrorHandler('Course does not exists', 404))
            }
  
            await course.deleteOne({id:courseId})
          await redis.del(courseId )
           
  
            res.status( 200 ).json( {
              success: true,
              message: 'Course deleted successfully'
            })
          } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
          }
        })




        // generate video url
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
