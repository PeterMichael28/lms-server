"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require('dotenv').config();
exports.app = (0, express_1.default)();
const error_1 = require("./middleware/error");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const analyticRoutes_1 = __importDefault(require("./routes/analyticRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const layoutRoutes_1 = __importDefault(require("./routes/layoutRoutes"));
const express_rate_limit_1 = require("express-rate-limit");
// body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
//cors
exports.app.use((0, cors_1.default)({
    origin: ["http://localhost:3000/", "https://localhost:3000/", "http://localhost:3000"],
    credentials: true,
}));
// routes
exports.app.use("/api/v1", userRoutes_1.default, courseRoutes_1.default, orderRoutes_1.default, notificationRoutes_1.default, analyticRoutes_1.default, layoutRoutes_1.default);
// testing api route
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working"
    });
});
// unknown route
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// api requests limit
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
// it's for ErrorHandling
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);
