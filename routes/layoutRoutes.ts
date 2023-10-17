import express from 'express'

import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import {  createLayout, updateLayout, getLayoutByType } from '../controllers/layoutController';

const layoutRouter = express.Router()


 
layoutRouter.post('/create-layout', isAuthenticated, authorizeRoles('admin'),  createLayout)
layoutRouter.put('/update-layout', isAuthenticated, authorizeRoles('admin'),  updateLayout)
layoutRouter.get('/get-layout/:type', isAuthenticated, authorizeRoles('admin'),  getLayoutByType)

export default layoutRouter
