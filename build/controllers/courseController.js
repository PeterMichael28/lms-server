"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCoursesAdmin = exports.replyReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.EditCourse = exports.uploadCourse = void 0;
const course_1 = __importDefault(require("../models/course"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const cloudinary_1 = __importDefault(require("cloudinary"));
const courseService_1 = require("../services/courseService");
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const notification_1 = __importDefault(require("../models/notification"));
const axios_1 = __importDefault(require("axios"));
// upload course
exports.uploadCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data?.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, courseService_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// edit course
exports.EditCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;
        const courseData = await course_1.default.findById(courseId);
        if (thumbnail && !thumbnail.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(courseData.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
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
        const course = await course_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, { new: true });
        res.status(201).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get single course without purchasing
exports.getSingleCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCacheExists = await redis_1.redis.get(courseId);
        if (isCacheExists) {
            const course = JSON.parse(isCacheExists);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = await course_1.default
                .findById(courseId)
                .select("-courseData.videoUrl, -courseData.suggestion, -courseData.questions, -courseData.links");
            await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 684800);
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get all course without purchasing
exports.getAllCourses = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const isCacheExists = await redis_1.redis.get("allCourses");
        if (isCacheExists) {
            const courses = JSON.parse(isCacheExists);
            // console.log('cache', courses)
            res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const courses = await course_1.default
                .find()
                .select("-courseData.videoUrl, -courseData.suggestion, -courseData.questions, -courseData.links");
            //  console.log('not-cached', courses)
            await redis_1.redis.set("allCourses", JSON.stringify(courses));
            res.status(200).json({
                success: true,
                courses,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course content for valid users
exports.getCourseByUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const allUserCourses = req.user?.courses;
        const courseId = req.params.id;
        const courseExists = allUserCourses?.find((course) => course._id.toString() === courseId);
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligoble to access this course", 404));
        }
        const course = await course_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addQuestion = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { question, contentId, courseId } = req.body;
        const course = await course_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        //  create a new question obj
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        // add the question to the course content
        courseContent.questions.push(newQuestion);
        //    notification
        await notification_1.default.create({
            user: req.user?._id,
            title: 'New Question ',
            message: `You have a new question in ${courseContent?.title}`
        });
        // save the updated course
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addAnswer = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const user = req.user;
        const { answer, contentId, courseId, questionId } = req.body;
        const course = await course_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler_1.default("invalid content id", 400));
        }
        //    get the current question
        const question = courseContent?.questions.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler_1.default("invalid question id", 400));
        }
        //  create a new answer object
        const newAnswer = {
            user: req.user,
            answer,
        };
        // add the answer to the question
        question.questionReplies?.push(newAnswer);
        //    notification
        await notification_1.default.create({
            user: req.user?._id,
            title: 'New Question Answer',
            message: `You have a new answer to a question in ${courseContent?.title}`
        });
        // save the updated course
        await course?.save();
        if (user?._id === question?.user?.id) {
            //    create a notification model
        }
        else {
            const data = {
                name: question?.user?.name,
                title: courseContent?.title,
            };
            const html = ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendMail_1.default)({
                    email: question?.user?.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new ErrorHandler_1.default(error.message, 400));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.addReview = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const user = req.user;
        const userCoursesList = req.user?.courses;
        const { userId, rating, review } = req.body;
        const courseId = req?.params?.id;
        const courseExists = userCoursesList?.some((course) => course._id.toString() === courseId.toString());
        if (!courseExists) {
            return next(new ErrorHandler_1.default("You are not eligoble to access this course", 404));
        }
        const course = await course_1.default.findById(courseId);
        const newReview = {
            user: req.user,
            comment: review,
            rating,
        };
        course?.reviews?.push(newReview);
        // ratings
        let avg = 0;
        course?.reviews.forEach((element) => {
            avg += element.rating;
        });
        if (course) {
            course.ratings = +(avg / course.reviews.length).toFixed(1);
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.replyReview = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const user = req.user;
        const { comment, reviewId, courseId } = req.body;
        const course = await course_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 404));
        }
        //    get the current review
        const review = course?.reviews?.find((item) => item._id.equals(reviewId));
        if (!review) {
            return next(new ErrorHandler_1.default("invalid review id", 400));
        }
        //  create a new review object
        const newAnswer = {
            user: req.user,
            comment,
        };
        if (!review.reviewReplies) {
            review.reviewReplies = [];
        }
        // add the answer to the question
        review.reviewReplies?.push(newAnswer);
        // save the updated course
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//   
// get all courses- admin
exports.getAllCoursesAdmin = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, courseService_1.getAllCoursesServices)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete course
exports.deleteCourse = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params?.id;
        const course = course_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default('Course does not exists', 404));
        }
        await course.deleteOne({ id: courseId });
        await redis_1.redis.del(courseId);
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// generate video url
exports.generateVideoUrl = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
