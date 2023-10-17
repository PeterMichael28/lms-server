import { app } from "./app";
import connectDb from "./utils/db";
require('dotenv').config()
import {v2 as cloudinary} from 'cloudinary'
import http from "http";
const server = http.createServer(app);
import { initSocketServer } from "./socketServer";



// clodinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME!,
    api_key: process.env.CLOUD_API_KEY!,
    api_secret: process.env.CLOUD_SECRET_KEY!,
  })
  
  
  
initSocketServer(server);
  


// creating server
server.listen( process.env.PORT, () => {
    connectDb()
    console.log(`Server is connected with port ${process.env.PORT}`)

})