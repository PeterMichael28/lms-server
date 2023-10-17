import express from 'express'

import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { EditCourse, getAllCourses, getSingleCourse, uploadCourse, getCourseByUser, addQuestion, addAnswer, addReview, replyReview, getAllCoursesAdmin, deleteCourse, generateVideoUrl } from '../controllers/courseController';
const courseRouter = express.Router()


 
courseRouter.post('/create-course', isAuthenticated, authorizeRoles("admin"), uploadCourse)
courseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles("admin"), EditCourse)
courseRouter.put('/add-review-reply', isAuthenticated, authorizeRoles("admin"), replyReview)
courseRouter.get('/get-course/:id', getSingleCourse)
courseRouter.get('/get-courses', getAllCourses)
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser)
courseRouter.put('/add-question', isAuthenticated, addQuestion)
courseRouter.put('/add-answer', isAuthenticated, addAnswer)
courseRouter.put('/add-review/:id', isAuthenticated, addReview)
courseRouter.get('/get-all-courses', isAuthenticated, authorizeRoles("admin"), getAllCoursesAdmin)
courseRouter.delete('/delete-course/:id', isAuthenticated, authorizeRoles("admin"), deleteCourse)
courseRouter.post("/getVdoCipherOTP", generateVideoUrl);





export default courseRouter
