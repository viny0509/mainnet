import mongoose from 'mongoose'
import { IImageDoc, IImageModel } from './interfaces'

const imageSchema = new mongoose.Schema<any, any>(
  {
    url: { type: String, required: true },
  },
  { timestamps: true }
)

const Image = mongoose.model<IImageDoc, IImageModel>('image', imageSchema)

export default Image
