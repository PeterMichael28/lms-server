import express, { NextFunction, Request, Response } from 'express'
import { activateUser, logOutUser, loginUser, registerUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo, updateUserPassword, updateUserPicture, getAllUsers, updateUserRole, deleteUser } from '../controllers/userController';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
const userRouter = express.Router()



userRouter.post('/registration', registerUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/socialauth', socialAuth)
userRouter.post('/login', loginUser)
userRouter.get('/logout', isAuthenticated, logOutUser)
userRouter.get('/refreshtoken', isAuthenticated, updateAccessToken)
userRouter.get('/userinfo', isAuthenticated, getUserInfo)
userRouter.put('/updateuser', isAuthenticated, updateUserInfo)
userRouter.put('/update-user-password', isAuthenticated, updateUserPassword)
userRouter.put('/update-user-picture', isAuthenticated, updateUserPicture)
userRouter.get('/get-all-users', isAuthenticated, authorizeRoles('admin'), getAllUsers)
userRouter.put('/update-user-role', isAuthenticated, authorizeRoles('admin'), updateUserRole)
userRouter.delete('/delete-user/:id', isAuthenticated, authorizeRoles('admin'), deleteUser)


export default userRouter
