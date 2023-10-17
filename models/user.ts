
require('dotenv').config()


import mongoose, {Schema, Document, Model} from "mongoose"

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

export interface IUser extends Document {
    email: string;
    name: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    };
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string; }>;
    comparePassword: (password: string) => Promise<boolean>;
    SignInAccessToken: () => string;
    SignInRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name:{
    type: String,
    required: [true, "Please enter your name!"],
  },
  email:{
    type: String,
    required: [true, "Please enter your email!"],
    validate: {
          validator: function ( value: string ) {
              return  emailRegex.test(value);
          },
          message: 'please enter a valid email'
    },
    unique: true
  },
  password:{
    type: String,
    minLength: [6, "Password should be greater than 4 characters"],
    select: false,
  },
    isVerified: {
        type: Boolean,
        default: false
},
  role:{
    type: String,
    default: "user",
  },
  avatar:{
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
}, {timestamps: true});


//  Hash password
userSchema.pre<IUser>("save", async function (next){
  if(!this.isModified("password")){
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();

});

// jwt access token
userSchema.methods.SignInAccessToken = function () {
  return jwt.sign({ id: this._id}, process.env.ACCESS_TOKEN || '', {
    expiresIn: '5m',
  });
};

// jwt refresh token
userSchema.methods.SignInRefreshToken = function () {
  return jwt.sign({ id: this._id}, process.env.REFRESH_TOKEN || '', {
    expiresIn: '7d',
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};




const userModel: Model<IUser> = mongoose.model("User", userSchema)
export default userModel