import userModel, { IUser } from "../models/user";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
 sendToken,
 accessTokenOptions,
 refreshTokenOptions,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersServices, getUserById, updateUserRoleServices } from "../services/userService";
import cloudinary from 'cloudinary'







// register user interface
interface IReg {
 name: string;
 email: string;
 password: string;
 avatar?: string;
}
// register user
export const registerUser = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { name, email, password } = req.body as IReg;

   const emailAlreadyExists = await userModel.findOne({
    email,
   });

   if (emailAlreadyExists) {
    return next(
     new ErrorHandler("User already exists", 400)
    );
   }

   const user: IReg = {
    name,
    email,
    password,
   };

   const activationToken = createActivationToken(user);
   const { activationCode } = activationToken;

   const data = {
    user: { name: user?.name },
    activationCode,
   };
   const html = ejs.renderFile(
    path.join(__dirname, "../mails/activation-mail.ejs"),
    data
   );

   try {
    await sendMail({
     email: user?.email,
     subject: "Activate your account",
     template: "activation-mail.ejs",
     data,
    });

    res.status(201).json({
     success: true,
     message:
      "Please check your email to activate your account",
     activationToken: activationToken.token,
    });
   } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
   }
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

// activation token interface
interface IActivationToken {
 token: string;
 activationCode: string;
}

// create activation token
const createActivationToken = (
 user: IReg
): IActivationToken => {
 const activationCode = Math.floor(
  1000 + Math.random() * 9000
 )
  .toString()
  .padStart(4, "0");
 const token = jwt.sign(
  { user, activationCode },
  process.env.ACTIVATION_SECRET!,
  {
   expiresIn: "35m",
  }
 );

 return { token, activationCode };
};

// activate user interface
interface IActivationRequest {
 activation_token: string;
 activation_code: string;
}

export const activateUser = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { activation_token, activation_code } =
    req.body as IActivationRequest;

   const newUser: { user: IUser; activationCode: string } =
    jwt.verify(
     activation_token,
     process.env.ACTIVATION_SECRET!
    ) as { user: IUser; activationCode: string };

   // console.log(newUser)
   // console.log(activation_code)
   if (newUser.activationCode !== activation_code) {
    return next(
     new ErrorHandler("Invalid activation code", 400)
    );
   }

   const { name, email, password } = newUser.user;

   let user = await userModel.findOne({ email });

   if (user) {
    return next(
     new ErrorHandler("User already exists", 400)
    );
   }
   user = await userModel.create({
    name,
    email,
    password,
   });

   res.status(201).json({
    success: true,
    message: `User's Account Created Successfully!!!`,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

// login user interface
interface ILogin {
 email: string;
 password: string;
}

// login user
export const loginUser = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { email, password } = req.body as ILogin;

   // check if field is empty
   if (!email || !password) {
    return next(
     new ErrorHandler(
      "Please provide email and password!",
      400
     )
    );
   }

   const user = await userModel
    .findOne({ email })
    .select("+password");

   if (!user) {
    return next(
     new ErrorHandler("User doesn't exists!", 400)
    );
   }

   const isPasswordValid = await user.comparePassword(
    password
   );

   if (!isPasswordValid) {
    return next(
     new ErrorHandler(
      "Please provide the correct information",
      400
     )
    );
   }

   sendToken(user, 200, res);
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

//  logout user
export const logOutUser = CatchAsyncError(
 (req: Request, res: Response, next: NextFunction) => {
  try {
   res.cookie("access_token", "", { maxAge: 1 });
   res.cookie("refresh_token", "", { maxAge: 1 });

   // delete from redis too
   const userId = req.user?._id || "";
   redis.del(userId);
   res.status(201).json({
    success: true,
    message: "Log out successful!",
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

// update access token
export const updateAccessToken = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const refreshToken = req?.cookies["refresh_token"];
   console.log("refresh", refreshToken)
   
   const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN!
   ) as JwtPayload;

   if (!decoded) {
    return next(
     new ErrorHandler("refresh token not valid", 404)
    );
   }

   const session = await redis.get(decoded?.id);

   if (!session) {
    return next(
     new ErrorHandler("Please login to access this resource", 404)
    );
   }
   const user = JSON.parse(session);

   const accessToken = jwt.sign(
    { id: user?.id },
    process.env.ACCESS_TOKEN! || "",
    {
     expiresIn: "5m",
    }
   );

   const refresh_token = jwt.sign(
    { id: user?.id },
    process.env.REFRESH_TOKEN || "",
    {
     expiresIn: "7d",
    }
   );

    req.user = user;
   res.cookie(
    "access_token",
    accessToken,
    accessTokenOptions
   );
   res.cookie(
    "refresh_token",
    refresh_token,
    refreshTokenOptions
   );

   await redis.set(user?._id, JSON.stringify(user), "EX", 684800)
   res.status(200).json({
    success: true,
    accessToken,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

// get user info
export const getUserInfo = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const userId = req.user?._id;
    // console.log('userId', userId)
   await getUserById(userId, res);
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);

// social auth

interface ISocial {
 email: string;
 name: string;
 avatar?: string;
}
export const socialAuth = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { name, email, avatar } = req.body as ISocial;

   const emailAlreadyExists = await userModel.findOne({
    email,
   });

   if (emailAlreadyExists) {
    sendToken(emailAlreadyExists, 200, res);
   } else {
    const newUser = await userModel.create({
     email,
     name,
     avatar,
    });

    sendToken(newUser, 200, res);
   }
  } catch (error: any) {
   // return next(new ErrorHandler(error.message, 400));.
  }
 }
);

// update user info

interface IUpdateProfile {
 email: string;
 name: string;
}
export const updateUserInfo = CatchAsyncError(
 async (
  req: Request,
  res: Response,
  next: NextFunction
 ) => {
  try {
   const { name, email } = req.body as IUpdateProfile;
   const userId = req.user?._id;
   const user = await userModel.findById(userId);

   if (email && user) {
    const isAlreadyExist = await userModel.findOne({
     email,
    });
    if (isAlreadyExist && user?.email !== email) {
     return next(
      new ErrorHandler("User already exists", 400)
     );
    }
    user.email = email;
   }

   if (name && user) {
    user.name = name;
   }

   await user?.save();

   await redis.set(userId, JSON.stringify(user));

   res.status(201).json({
    success: true,
    user,
   });
  } catch (error: any) {
   return next(new ErrorHandler(error.message, 400));
  }
 }
);


// update user password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string
}
 export const updateUserPassword =  CatchAsyncError(
  async (
   req: Request,
   res: Response,
   next: NextFunction
  ) => {
    try {
      const {oldPassword, newPassword} = req.body as IUpdatePassword
      const userId = req.user?._id
      const user = await userModel.findById(userId).select("+password")
 
      if ( user?.password === undefined ) {
        return next(new ErrorHandler("Invalid User", 400));
        
      }

      const isPasswordMatched = await user?.comparePassword(oldPassword)

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      
      user.password = newPassword;

      await user.save();
      await redis.set(userId, JSON.stringify(user))
    

      res.status(201).json({
        success: true,
        message: "Password changed successfully!",
        user
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  })



  // update user avatar
interface IUpdateAvatar {
  avatar: string
}
export const updateUserPicture = CatchAsyncError(
  async (
   req: Request,
   res: Response,
   next: NextFunction
  ) => {
    try {
      const avatar = req.body
      const userId = req.user?._id
      const user = await userModel.findById(userId);


      if ( avatar && user) {
        const imageId = user?.avatar?.public_id;
      if (imageId) {
        // if there is an image already, then delete it from cloudinary first
        await cloudinary.v2.uploader.destroy(imageId);

        // then upload the new one to cloudinary
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });

        // add it to the 
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else {
        // then upload the new one to cloudinary
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });

        // add it to the 
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user))

      res.status(200).json({
        success: true,
        user
      });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  })



  // get all users - admin

  export const getAllUsers = CatchAsyncError(
    async (
     req: Request,
     res: Response,
     next: NextFunction
    ) => {
      try {
        getAllUsersServices(res)
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    })
  
  

    // update user role
    export const updateUserRole = CatchAsyncError(
      async (
       req: Request,
       res: Response,
       next: NextFunction
      ) => {
        try {
          const {id, role} = req.body
          updateUserRoleServices(res, id, role)
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      })

      
    // delete user
    export const deleteUser = CatchAsyncError(
      async (
       req: Request,
       res: Response,
       next: NextFunction
      ) => {
        try {
          const userId = req.params?.id
          
          const user = userModel.findById(userId)

          if ( !user ) {
            return next(new ErrorHandler('User does not exists', 404))
          }

          await user.deleteOne({id:userId})
          await redis.del(userId)

          res.status( 200 ).json( {
            success: true,
            message: 'User deleted successfully'
          })
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      })
    