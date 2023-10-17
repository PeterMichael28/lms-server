"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const NotificationController_1 = require("../controllers/NotificationController");
const notificationRouter = express_1.default.Router();
notificationRouter.get('/get-all-notification', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), NotificationController_1.getAllNotification);
notificationRouter.put('/update-notification- status/:id', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), NotificationController_1.updateNotificationStatus);
exports.default = notificationRouter;
