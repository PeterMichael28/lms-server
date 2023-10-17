"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationStatus = exports.getAllNotification = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const notification_1 = __importDefault(require("../models/notification"));
const node_cron_1 = __importDefault(require("node-cron"));
// get all notifications - admin only
exports.getAllNotification = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await notification_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notification
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// update notifications - admin only
exports.updateNotificationStatus = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notificationId = req.params?.id;
        const notification = await notification_1.default.findById(notificationId);
        notification?.status ? notification.status = 'read' : notification?.status;
        await notification?.save();
        const notifications = await notification_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({
            success: true,
            notifications
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
//    delete notification - admin
node_cron_1.default.schedule('0 0 0 * * *', async function () {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await notification_1.default.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
});
