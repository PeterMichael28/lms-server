"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersServices = exports.createNewOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const order_1 = __importDefault(require("../models/order"));
exports.createNewOrder = (0, catchAsyncErrors_1.CatchAsyncError)(async (data, next, res) => {
    const order = await order_1.default.create(data);
    res.status(201).json({
        success: true,
        order
    });
});
// get all orders
const getAllOrdersServices = async (res) => {
    const orders = await order_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        orders
    });
};
exports.getAllOrdersServices = getAllOrdersServices;
