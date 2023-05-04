import { Wallet } from 'ethers'
import { IUpdateProfile, IUser } from './interfaces'
import AxiosService from '@/core/AxiosService'
import { config } from '@/config/config'
import User from './model'
import { ellipsisAddress, sleep } from '@/utils'
import name from '@/resources/name'

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
          reviewCount: 0,
          token: resSign?.data?.token,
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
    const users = await User.find()
    const nameShuffled = name.sort(() => 0.5 - Math.random())
    for (let i = 0; i < users.length; i++) {
      await this.updateProfile(users[i].token, {
        username: ellipsisAddress(users[i].address),
        cityCode: '',
        countryCode: 'JP',
        nationalCountryCode: 'JP',
      })
      console.log(`Update profile ${nameShuffled[i]}`)
      await sleep(1000)
    }
    console.log(`Update profile done`)
  }
}

export default UserService
