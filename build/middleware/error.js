"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ErrorMiddleware = (err, req, res, next) => {
    // if error code doesnt exist, set it to default 500
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    // wrong mongodb id
    if (err.name === 'CastError') {
        const message = `Resource not found, Invalid ${err.path}`;
        err = new ErrorHandler_1.default(message, 400);
    }
    // Duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler_1.default(message, 400);
    }
    // wrong jwt error
    if (err.name === "JsonWebTokenError") {
        const message = `Your jwt is invalid please try again letter`;
        err = new ErrorHandler_1.default(message, 400);
    }
    // jwt expired
    if (err.name === "TokenExpiredError") {
        const message = `Your jwt is expired please try again letter!`;
        err = new ErrorHandler_1.default(message, 400);
    }
    res.status(err.statusCode ?? 500).json({
        success: false,
        message: err.message,
    });
};
exports.ErrorMiddleware = ErrorMiddleware;
