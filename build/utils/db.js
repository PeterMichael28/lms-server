"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
require('dotenv').config();
const dbUri = process.env.DB_URI;
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(dbUri).then((data) => {
            console.log('Database connected with ');
        });
    }
    catch (error) {
        console.log(error?.message);
        setTimeout(connectDb, 5000);
    }
};
exports.default = connectDb;
