"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.updateUserPicture = exports.updateUserPassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logOutUser = exports.loginUser = exports.activateUser = exports.registerUser = void 0;
const user_1 = __importDefault(require("../models/user"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const userService_1 = require("../services/userService");
const cloudinary_1 = __importDefault(require("cloudinary"));
// register user
exports.registerUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const emailAlreadyExists = await user_1.default.findOne({
            email,
        });
        if (emailAlreadyExists) {
            return next(new ErrorHandler_1.default("User already exists", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        const activationToken = createActivationToken(user);
        const { activationCode } = activationToken;
        const data = {
            user: { name: user?.name },
            activationCode,
        };
        const html = ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
        try {
            await (0, sendMail_1.default)({
                email: user?.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: "Please check your email to activate your account",
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// create activation token
const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000)
        .toString()
        .padStart(4, "0");
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, {
        expiresIn: "35m",
    });
    return { token, activationCode };
};
exports.activateUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET);
        // console.log(newUser)
        // console.log(activation_code)
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        let user = await user_1.default.findOne({ email });
        if (user) {
            return next(new ErrorHandler_1.default("User already exists", 400));
        }
        user = await user_1.default.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
            message: `User's Account Created Successfully!!!`,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// login user
exports.loginUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // check if field is empty
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please provide email and password!", 400));
        }
        const user = await user_1.default
            .findOne({ email })
            .select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("User doesn't exists!", 400));
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return next(new ErrorHandler_1.default("Please provide the correct information", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//  logout user
exports.logOutUser = (0, catchAsyncErrors_1.CatchAsyncError)((req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        // delete from redis too
        const userId = req.user?._id || "";
        redis_1.redis.del(userId);
        res.status(201).json({
            success: true,
            message: "Log out successful!",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update access token
exports.updateAccessToken = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const refreshToken = req?.cookies["refresh_token"];
        console.log("refresh", refreshToken);
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN);
        if (!decoded) {
            return next(new ErrorHandler_1.default("refresh token not valid", 404));
        }
        const session = await redis_1.redis.get(decoded?.id);
        if (!session) {
            return next(new ErrorHandler_1.default("Please login to access this resource", 404));
        }
        const user = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: user?.id }, process.env.ACCESS_TOKEN || "", {
            expiresIn: "5m",
        });
        const refresh_token = jsonwebtoken_1.default.sign({ id: user?.id }, process.env.REFRESH_TOKEN || "", {
            expiresIn: "7d",
        });
        req.user = user;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refresh_token, jwt_1.refreshTokenOptions);
        await redis_1.redis.set(user?._id, JSON.stringify(user), "EX", 684800);
        res.status(200).json({
            success: true,
            accessToken,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get user info
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        // console.log('userId', userId)
        await (0, userService_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.socialAuth = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, avatar } = req.body;
        const emailAlreadyExists = await user_1.default.findOne({
            email,
        });
        if (emailAlreadyExists) {
            (0, jwt_1.sendToken)(emailAlreadyExists, 200, res);
        }
        else {
            const newUser = await user_1.default.create({
                email,
                name,
                avatar,
            });
            (0, jwt_1.sendToken)(newUser, 200, res);
        }
    }
    catch (error) {
        // return next(new ErrorHandler(error.message, 400));.
    }
});
exports.updateUserInfo = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const userId = req.user?._id;
        const user = await user_1.default.findById(userId);
        if (email && user) {
            const isAlreadyExist = await user_1.default.findOne({
                email,
            });
            if (isAlreadyExist && user?.email !== email) {
                return next(new ErrorHandler_1.default("User already exists", 400));
            }
            user.email = email;
        }
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserPassword = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?._id;
        const user = await user_1.default.findById(userId).select("+password");
        if (user?.password === undefined) {
            return next(new ErrorHandler_1.default("Invalid User", 400));
        }
        const isPasswordMatched = await user?.comparePassword(oldPassword);
        if (!isPasswordMatched) {
            return next(new ErrorHandler_1.default("Old password is incorrect!", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(201).json({
            success: true,
            message: "Password changed successfully!",
            user
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.updateUserPicture = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const avatar = req.body;
        const userId = req.user?._id;
        const user = await user_1.default.findById(userId);
        if (avatar && user) {
            const imageId = user?.avatar?.public_id;
            if (imageId) {
                // if there is an image already, then delete it from cloudinary first
                await cloudinary_1.default.v2.uploader.destroy(imageId);
                // then upload the new one to cloudinary
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                // add it to the 
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            else {
                // then upload the new one to cloudinary
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                // add it to the 
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            await user?.save();
            await redis_1.redis.set(userId, JSON.stringify(user));
            res.status(200).json({
                success: true,
                user
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all users - admin
exports.getAllUsers = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, userService_1.getAllUsersServices)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// update user role
exports.updateUserRole = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id, role } = req.body;
        (0, userService_1.updateUserRoleServices)(res, id, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// delete user
exports.deleteUser = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.params?.id;
        const user = user_1.default.findById(userId);
        if (!user) {
            return next(new ErrorHandler_1.default('User does not exists', 404));
        }
        await user.deleteOne({ id: userId });
        await redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
