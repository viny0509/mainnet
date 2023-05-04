import { Wallet } from 'ethers'
import { IUpdateProfile, IUser } from './interfaces'
import AxiosService from '@/core/AxiosService'
import { config } from '@/config/config'
import User from './model'
import { ellipsisAddress, sleep } from '@/utils'
import name from '@/resources/name'
import { uniq } from 'lodash'

class UserService {
  static async createAccounts(nums: number) {
    console.log(`\x1b[33mCreate ${nums} account \x1b[0m`)
    const users: IUser[] = []
    for (let i = 0; i < nums; i++) {
      const wallet = Wallet.createRandom()
      const resMessageHash = await AxiosService.request({
        method: 'GET',
        url: `${config.apiUrl}/authentication/hash`,
        query: {
          address: wallet.address,
        },
      })
      const signature = await wallet.signMessage(resMessageHash?.data?.hash)
      const resSign = await AxiosService.request({
        method: 'POST',
        url: `${config.apiUrl}/authentication/sign`,
        body: {
          address: wallet.address,
          signature,
        },
      })
      if (resSign?.data) {
        users.push({
          address: wallet.address,
          privateKey: wallet.privateKey,
          balance: 0,
          token: resSign?.data?.token,
          storeReviewed: []
        })
      }
    }
    await User.insertMany(users)
    console.log(`\x1b[33mCreate ${users.length} done \x1b[0m`)
  }

  static async updateProfile(token: string, updateData: IUpdateProfile) {
    await AxiosService.request({
      method: 'PUT',
      url: `${config.apiUrl}/user/profile`,
      body: {
        ...updateData,
      },
      token: `Bearer ${token}`,
    })
  }

  static async updateProfiles() {
    const users = await User.find().lean()
    const nameShuffled = name.sort(() => 0.5 - Math.random())
    for (let i = 0; i < users.length; i++) {
      await this.updateProfile(users[i].token, {
        username: ellipsisAddress(users[i].address, 4,4),
        cityCode: '',
        countryCode: 'JP',
        nationalCountryCode: 'JP',
      })
      console.log(`Update profile ${nameShuffled[i]}`)
      await sleep(1000)
    }
    console.log(`Update profile done`)
  }

  static async storeRewviewd () {
    try {
      const users = await User.find().lean()
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const resUser = await AxiosService.request({
        method:'GET',
        url: `${config.apiUrl}/user/profile`,
        query: {
          userAddress: user?.address
        },
        token: `Bearer ${user.token}`
      })
      const userId = resUser?.data?._id
      const resReview = await AxiosService.request({
        method: 'GET',
        url: `${config.apiUrl}/reviews`,
        query: {
          limit: 48,
          page: 1,
          userId
        },
        token: `Bearer ${user.token}`
      })
      const storeIds: string[] = (resReview?.data?.items || [])?.map((item: any) => item.storeId)
      await User.findByIdAndUpdate(user._id, {
        $set:{
          userId,
          storeReviewed: uniq(storeIds)
        }
      }, {
        new: true
      }).exec()
      console.log('Update', user.address)
    }
    console.log('Done')
    } catch (error) {
      console.log('123', error)
    }
  }
}

export default UserService
