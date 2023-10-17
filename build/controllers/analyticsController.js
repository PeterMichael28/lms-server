"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAnalytics = exports.getCourseAnalytics = exports.getUserAnalytics = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const analyticsGenerator_1 = require("../utils/analyticsGenerator");
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const user_1 = __importDefault(require("../models/user"));
const course_1 = __importDefault(require("../models/course"));
const order_1 = __importDefault(require("../models/order"));
// get users analytics - admin only 
exports.getUserAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const users = await (0, analyticsGenerator_1.generateLast1YearData)(user_1.default);
        res.status(201).json({
            success: true,
            users
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course analytics - admin only 
exports.getCourseAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courses = await (0, analyticsGenerator_1.generateLast1YearData)(course_1.default);
        res.status(201).json({
            success: true,
            courses
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// get course analytics - admin only 
exports.getOrderAnalytics = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const orders = await (0, analyticsGenerator_1.generateLast1YearData)(order_1.default);
        res.status(201).json({
            success: true,
            orders
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
