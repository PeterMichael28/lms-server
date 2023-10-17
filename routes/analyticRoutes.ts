import express from 'express'

import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import {  getUserAnalytics, getCourseAnalytics, getOrderAnalytics } from '../controllers/analyticsController';

const analyticsRouter = express.Router()


 
analyticsRouter.get('/get-users-analytics', isAuthenticated, authorizeRoles('admin'),  getUserAnalytics)
analyticsRouter.get('/get-courses-analytics', isAuthenticated, authorizeRoles('admin'),  getCourseAnalytics)
analyticsRouter.get('/get-orders-analytics', isAuthenticated, authorizeRoles('admin'),  getOrderAnalytics)






export default analyticsRouter
