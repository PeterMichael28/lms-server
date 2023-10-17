



import mongoose, {Schema, Document, Model} from "mongoose"


export interface IFaq extends Document {
    question: string;
    answer: string;
}

export interface ICategory extends Document {
    title: string;
}
export interface IBannerimg extends Document {
    public_id: string;
    url: string;
}
export interface ILayout extends Document {
    type: string;
    faq: IFaq[];
    categories: ICategory[];
    banner: {
        image: IBannerimg;
        title: string;
        subtitle: string;
    }
}


// IFaq schema
const faqSchema = new Schema<IFaq>( {
    question: {
        type: String,
      },
    answer: {
        type: String,
      },
})

// ICategory schema
const categoriesSchema = new Schema<ICategory>( {
    title: {
        type: String,
        required: true,
      },
})

// IBannerimg schema
const bannerImgSchema = new Schema<IBannerimg>( {
    public_id: {
        type: String,
        required: true,
      },
    url: {
        type: String,
        required: true,
      },
})


const layoutSchema: Schema<ILayout> = new Schema({
    type: {
        type: String,
      },
    faq: [ faqSchema ],
    categories: [categoriesSchema],
    banner: {
        image: bannerImgSchema ,
        title: { type: String },
        subtitle: { type: String }
    }
    
});







const layoutModel: Model<ILayout> = mongoose.model("layout", layoutSchema)
export default layoutModel