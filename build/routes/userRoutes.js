"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const userRouter = express_1.default.Router();
userRouter.post('/registration', userController_1.registerUser);
userRouter.post('/activate-user', userController_1.activateUser);
userRouter.post('/socialauth', userController_1.socialAuth);
userRouter.post('/login', userController_1.loginUser);
userRouter.get('/logout', auth_1.isAuthenticated, userController_1.logOutUser);
userRouter.get('/refreshtoken', auth_1.isAuthenticated, userController_1.updateAccessToken);
userRouter.get('/userinfo', auth_1.isAuthenticated, userController_1.getUserInfo);
userRouter.put('/updateuser', auth_1.isAuthenticated, userController_1.updateUserInfo);
userRouter.put('/update-user-password', auth_1.isAuthenticated, userController_1.updateUserPassword);
userRouter.put('/update-user-picture', auth_1.isAuthenticated, userController_1.updateUserPicture);
userRouter.get('/get-all-users', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), userController_1.getAllUsers);
userRouter.put('/update-user-role', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), userController_1.updateUserRole);
userRouter.delete('/delete-user/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), userController_1.deleteUser);
exports.default = userRouter;
