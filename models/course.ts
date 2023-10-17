require('dotenv').config()


import mongoose, {Schema, Document, Model} from "mongoose"
import { IUser } from "./user";



 interface IComment extends Document {
    user: IUser;
    question: string;
    questionReplies?: IComment[]
   
}


 interface IReviews extends Document {
    user: IUser;
    rating: number;
    comment: string;
    reviewReplies?: IComment[]
   
}
 interface ILink extends Document {
    title: string;
    url: string;
   
}
 interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoSection: string;
    videoLength: number;
    videoPlayer: string;
    links: ILink[];
    suggestion: string;
    questions: IComment[]
}

export interface ICourse extends Document {
    name: string;
    description?: string;
    tags: string;
    thumbnail: object;
  categories: string;
    level: string;
    price: number;
    estimatedPrice?: number;
    demoVideoUrl: string;
    benefits: { title: string; }[];
    prerequisites: { title: string; }[];
    reviews: IReviews[];
    courseData : ICourseData[];
    ratings?: number;
    purchased: number;
}


// review schema
const reviewSchema = new Schema<IReviews>( {
    user: Object,
    rating: {
        type: Number,
        default: 0
    },
    comment: String,
    reviewReplies: [Object]
}, {timestamps: true})

// link schema
const linkSchema = new Schema<ILink>( {
    title: String,
    url: String
})

// comment schema
const commentSchema = new Schema<IComment>( {
    user: String,
    question: String,
    questionReplies: [Object]
}, {timestamps: true})

// courseData schema
const courseDataSchema = new Schema<ICourseData>( {
    title: String,
    description: String,
    videoUrl: String,
    videoSection: String,
    videoLength: Number,
    videoPlayer: String,
    links: [Object],
    suggestion: String,
    questions: [commentSchema]
})

// course schema
const courseSchema = new Schema<ICourse>( {
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: String,
    thumbnail: {
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    },
    categories:{
        type:String,
        required: true,
      },
    level: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedPrice: Number,
    demoVideoUrl: String,
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData : [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    },

}, {timestamps: true})

const courseModel: Model<ICourse> = mongoose.model("course", courseSchema)
export default courseModel
