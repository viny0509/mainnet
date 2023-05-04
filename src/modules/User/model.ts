import mongoose from 'mongoose'
import { IUserDoc, IUserModel } from './interfaces'

const userSchema = new mongoose.Schema<any, any>(
  {
    privateKey: { type: String, required: true },
    address: { type: String, lowercase: true, unique: true, required: true },
    balance: { type: Number, required: true, default: 0 },
    reviewCount: { type: Number, required: true, default: 0 },
    token: { type: String, required: true },
  },
  { timestamps: true }
)

const User = mongoose.model<IUserDoc, IUserModel>('user', userSchema)

export default User
