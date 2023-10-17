"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
require('dotenv').config();
const redis_1 = require("./redis");
// parse env to integrate with fallback values
const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRES || '300', 10);
const refreshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRES || '1300', 10);
// Options for cookies
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
    maxAge: accessTokenExpires * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
};
// create token and saving that in cookies
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignInAccessToken();
    const refreshToken = user.SignInRefreshToken();
    // console.log('sendToken', user)
    // uploading session to redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    // set secure to true in access token when in production mode
    if (process.env.NODE_MODE === 'production') {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    // console.log('sendToken', 'done')
    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    });
};
exports.sendToken = sendToken;
exports.default = exports.sendToken;
