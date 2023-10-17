import mongoose from "mongoose";
import { transpileModule } from "typescript";

require('dotenv').config()

const dbUri: string = process.env.DB_URI!

const connectDb = async () => {
    try {
        await mongoose.connect(dbUri).then( ( data: any ) => {
            console.log('Database connected with ' )
        })
    } catch (error: any) {
        console.log(error?.message)
        setTimeout(connectDb, 5000);
    }
}

export default connectDb