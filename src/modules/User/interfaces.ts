import { Model, Document } from 'mongoose'

export interface IUser {
  privateKey: string
  address: string
  balance: number
  storeReviewed: string[]
  token: string
  userId?: string
}

export interface IUserDoc extends IUser, Document {}

export interface IUpdateProfile {
  username?: string
  image?: string
  countryCode?: string
  nationalCountryCode?: string
  cityCode?: string
}

export type IUserModel = Model<IUserDoc>
