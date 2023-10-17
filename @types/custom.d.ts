import { IUser } from '../models/user'
import {  Request } from 'express'

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}