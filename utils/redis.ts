import { Redis } from "ioredis";
require('dotenv').config()



const redisClient = () => {
    if (process.env.REDIS_URL) {
        // console.log('available')
        return process.env.REDIS_URL
    } 
        throw new Error('Error while connecting redis')
    
}

export const redis = new Redis(redisClient())