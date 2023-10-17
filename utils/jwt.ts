require('dotenv').config()
import {  Response } from 'express'
import { redis } from './redis';
import { IUser } from '../models/user'

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean
}

 // parse env to integrate with fallback values
  const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRES || '300', 10)
  const refreshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRES || '1300', 10)

 // Options for cookies
 export const accessTokenOptions: ITokenOptions = {
   expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
   maxAge: accessTokenExpires * 60 * 60 * 1000,
   httpOnly: true,
   sameSite: 'none',
   secure: true,
 };

 export const refreshTokenOptions: ITokenOptions = {
     expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
     maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
     httpOnly: true,
     sameSite: "none",
     secure: true,
   };

// create token and saving that in cookies
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.SignInAccessToken();
    const refreshToken = user.SignInRefreshToken();

// console.log('sendToken', user)

    // uploading session to redis
    redis.set(user._id, JSON.stringify(user) as any)



   

    // set secure to true in access token when in production mode
    if ( process.env.NODE_MODE === 'production' ) {
        accessTokenOptions.secure = true
    }



    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refreshTokenOptions)
// console.log('sendToken', 'done')

    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
      });
  };

export default sendToken;
