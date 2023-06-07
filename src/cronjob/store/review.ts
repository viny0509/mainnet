import { config } from '@/config/config'
import AxiosService from '@/core/AxiosService'
import Image from '@/modules/Image/model'
import { IUserDoc } from '@/modules/User/interfaces'
import User from '@/modules/User/model'
import { sleep } from '@/utils'
import { CronjobService } from '@cronjob'
import axios from 'axios'
import { LeanDocument, Types } from 'mongoose'

export default class ReviewStoreTask extends CronjobService {
  constructor(cronTime: string) {
    super(cronTime)
    this.processing()
  }

  onTick(): () => void {
    return () => {
      // this.processing()
    }
  }

  async review(
    user: LeanDocument<IUserDoc> & {
      _id: Types.ObjectId
    },
    storeId: Types.ObjectId
  ): Promise<any> {
    try {
      const res = await axios.request({
        method: 'GET',
        url: `https://api.api-ninjas.com/v1/randomimage?category=still_life`,
        headers: { 'X-Api-Key': 'q1kah8Erp4Mx4brWBsghaA==tycDytkoHs2XG3vV' },
      })
      const ipfs = await AxiosService.request({
        method: 'POST',
        url: `${config.apiUrl}/upload/base64-image`,
        body: {
          base64: res?.data,
        },
      })

      let image
      if (ipfs?.data?.url) {
        const imageCreated = await Image.create({
          url: ipfs?.data?.url,
        })
        image = imageCreated.url
      }

      const resReview = await AxiosService.request({
        method: 'POST',
        url: `${config.apiUrl}/reviews`,
        token: `Bearer ${user.token}`,
        body: {
          star: Number((Math.random() * (5 - 4) + 4).toFixed(1)),
          tagIds: [],
          title: '',
          content: '',
          images: [image || 'https://ipfsgw.eatnsmile.org/ipfs/QmcqpmjmBkkTwBV96uNeQBBFBKd2drNVCKYh4xZ8Ejinz7'],
          storeId: storeId,
        },
      })
      if (resReview?.data?.rewardable) {
        const resReward = await AxiosService.request({
          method: 'PUT',
          url: `${config.apiUrl}/reviews/${resReview?.data?._id}/take-reward`,
          token: `Bearer ${user.token}`,
          body: {
            selectedReward: 1,
          },
        })
        if (resReward?.data?.reward) {
          console.log('Reward: ', resReward?.data?.reward)
          await User.updateOne(
            { _id: new Types.ObjectId(user._id) },
            {
              $inc: {
                balance: resReward?.data?.reward,
              },
              $push: {
                storeReviewed: storeId
              }
            }
          )
        }
      } else {
        console.log('Reviewable false')
        return '1'
      }
    } catch (error) {
      console.log('error', error)
    }
    return
  }

  async reviews(
    user: LeanDocument<IUserDoc> & {
      _id: Types.ObjectId
    }
  ): Promise<any> {
    const resBalances = await AxiosService.request({
      method: 'GET',
      url: `${config.apiUrl}/user/balance`,
      token: `Bearer ${user.token}`,
      query: {
        tokenId: '63ca9f0a81e74bba82d93d29',
      },
    })
    console.log(resBalances)
    const resStores = await AxiosService.request({
      method: 'GET',
      url: `${config.apiUrl}/nfts`,
      query: {
        sortBy: 'rankingScore',
        sortDirection: 'asc',
        limit: 48,
        page: 1,
      },
    })
    const storeIds = resStores?.data?.items?.map((i:any) => i._id).filter((i:any) => !user.storeReviewed.includes(i))
    const storeShuffled = storeIds.sort(() => 0.5 - Math.random());

    for (let i = 0; i < 3; i++) {
      const storeId = storeShuffled[i] || null
      console.log(`User ${user.address} review lần ${i + 1}`)
      if (storeId) {
        const res = await this.review(user, new Types.ObjectId(storeId))
        if (res === '1') {
          
        }
      } else {
        console.error(`User ${user.address} error: store not found`)
      }
      console.log(`User ${user.address} review done lần ${i + 1}`)
      await sleep(2000)
    }
    return ''
  }

  async processing(): Promise<void> {
    try {
      console.log('\x1b[33mReview store \x1b[0m')
      const users = await User.find().lean()
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        console.log(`User ${user.address} bắt đầu review 🍿🍿🍿`)
        await this.reviews(user)
        await sleep(2000)
      }
      console.log("done ----------")
    } catch (error) {
      console.log(error)
    }
  }
}
