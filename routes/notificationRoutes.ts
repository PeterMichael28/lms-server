import express from 'express'

import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { getAllNotification, updateNotificationStatus } from '../controllers/NotificationController';

const notificationRouter = express.Router()


 
notificationRouter.get('/get-all-notification', isAuthenticated, authorizeRoles('admin'),  getAllNotification)
notificationRouter.put('/update-notification- status/:id', isAuthenticated, authorizeRoles('admin'),  updateNotificationStatus)





export default notificationRouter
