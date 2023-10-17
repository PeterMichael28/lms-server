"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name!"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email!"],
        validate: {
            validator: function (value) {
                return emailRegex.test(value);
            },
            message: 'please enter a valid email'
        },
        unique: true
    },
    password: {
        type: String,
        minLength: [6, "Password should be greater than 4 characters"],
        select: false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: "user",
    },
    avatar: {
        public_id: {
            type: String
        },
        url: {
            type: String
        },
    },
    courses: [
        {
            courseId: String
        }
    ]
    //  resetPasswordToken: String,
    //  resetPasswordTime: Date,
}, { timestamps: true });
//  Hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs_1.default.hash(this.password, 10);
    next();
});
// jwt access token
userSchema.methods.SignInAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: '5m',
    });
};
// jwt refresh token
userSchema.methods.SignInRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: '7d',
    });
};
// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
const userModel = mongoose_1.default.model("User", userSchema);
exports.default = userModel;
