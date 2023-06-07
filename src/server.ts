import mongoose from 'mongoose'
import { config } from '@config/config'
import UserService from './modules/User/service'
import ReviewStoreTask from './cronjob/store/review'
import axios from 'axios'
import AxiosService from './core/AxiosService'
import ClaimService from './modules/Claim/service'

mongoose.set('strictQuery', false)
mongoose.connect(config.mongoose.url).then(() => {
  console.log('Connected to MongoDB')
  bootstap()
})

async function bootstap() {
  UserService.createAccounts(100)
  // new ReviewStoreTask('30 12 * * *').start()
  // await UserService.updateProfiles()
  // await UserService.storeRewviewd()
  // await ClaimService.claimAndSwap()
}
