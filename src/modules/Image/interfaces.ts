import { Model, Document } from 'mongoose'

export interface IImage {
  url: string
}

export interface IImageDoc extends IImage, Document {}

export interface IUpdateProfile {
  url?: string
}

export type IImageModel = Model<IImageDoc>
