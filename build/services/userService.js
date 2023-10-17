"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleServices = exports.getAllUsersServices = exports.getUserById = void 0;
const redis_1 = require("../utils/redis");
const user_1 = __importDefault(require("../models/user"));
// get user by id
const getUserById = async (id, res) => {
    // console.log('idser', id)
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        // console.log('userser', user)
        res.status(201).json({
            success: true,
            user
        });
    }
};
exports.getUserById = getUserById;
// get all users
const getAllUsersServices = async (res) => {
    const users = await user_1.default.find().sort({ createdAt: -1 });
    res.status(201).json({
        success: true,
        users
    });
};
exports.getAllUsersServices = getAllUsersServices;
// update user role
const updateUserRoleServices = async (res, id, role) => {
    const user = await user_1.default.findByIdAndUpdate(id, { role }, { new: true });
    res.status(201).json({
        success: true,
        user
    });
};
exports.updateUserRoleServices = updateUserRoleServices;
