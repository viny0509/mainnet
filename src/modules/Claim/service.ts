import { Types } from "mongoose"
import User from "../User/model"
import { config } from "@/config/config"
import claimJson from '@/config/abi/claim.json'
import tokenJson from '@/config/abi/tokenAbi.json'
import AxiosService from "@/core/AxiosService"

import {
  Eip2612PermitUtils,
  Web3ProviderConnector,
  
  PermitParams,
} from '@1inch/permit-signed-approvals-utils';
import { Interface, hexZeroPad, parseEther } from "ethers/lib/utils"
import { BigNumber, Contract, ethers } from "ethers"
import { TransactionRequest } from "alchemy-sdk"

const claimInterface = new Interface(claimJson)

class ClaimService {
  static async claim(userId: string | Types.ObjectId) {
    try {
      const user = await User.findById(userId).lean()
      if (user) {
        const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
        const wallet = new ethers.Wallet(user.privateKey, provider)
        const resClaimApi = await AxiosService.request({
          method: 'POST',
          url: `${config.apiUrl}/claim-tokens`,
          token: `Bearer ${user.token}`,
          body: {
            chainId: config.chainId,
            amountWei: `${parseEther(`${user.balance}`)}`,
            tokenAddress: config.tokenAddress
          }
        })
        if (resClaimApi?.data) {
          const rawTransaction: TransactionRequest = {
            from: wallet.address,
            to: config.claimAddress,
            data: claimInterface.encodeFunctionData('claim', [resClaimApi?.data?.claim, resClaimApi?.data?.signatures]),
          }
          console.log({ rawTransaction })
          const tx = await wallet.sendTransaction(rawTransaction)
          console.log(`Claim pendding`, tx.hash)
          const txReceipt = await tx.wait()
          console.log(`Claim success`, txReceipt)
          await User.findByIdAndUpdate(userId, { $set: { balance: 0, balanceWeb3: user.balance } }, { new: true }).exec()
        }
      }
    } catch (error) {
      console.log("Claim error", error)
    }
  }

  static async swap(userId: string | Types.ObjectId) {
    const user = await User.findById(userId).lean()
    if (user) {
      if (user?.balanceWeb3 && user.balanceWeb3 === 0) {
        console.log(`User ${user.address} balance = 0`)
        return
      }
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
      const wallet = new ethers.Wallet(user.privateKey, provider)
      const tokenContract = new Contract(config.tokenAddress, tokenJson, provider)
      const nonce = await tokenContract.nonces(wallet.address)
      const deadline = Math.round(Date.now() / 1000) + 10000000
      const permit = await wallet._signTypedData({
        chainId: config.chainId,
        name: 'EatnSmileStar',
        verifyingContract: config.tokenAddress,
        version: '1'
      }, {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      }, {
        owner: wallet.address,
        spender: '0x1111111254eeb25477b68fb85ed929f73a960582',
        value: `${parseEther(`${user.balanceWeb3}`)}`,
        nonce: nonce.toString(),
        deadline,
      })

      const vrs = ethers.utils.splitSignature(permit)

      let permitString = "0x"
      permitString += hexZeroPad(wallet.address, 32).replace("0x", "")
      permitString += hexZeroPad('0x1111111254eeb25477b68fb85ed929f73a960582', 32).replace("0x", "")
      permitString += hexZeroPad(parseEther(`${user.balanceWeb3}`)._hex.toString(), 32).replace("0x", "")
      permitString += hexZeroPad(BigNumber.from(deadline)._hex.toString(), 32).replace("0x", "")
      permitString += hexZeroPad(BigNumber.from(vrs.v)._hex.toString(), 32).replace("0x", "")
      permitString += vrs.r.toString().replace("0x", "") // r and s are already 32 bytes long
      permitString += vrs.s.toString().replace("0x", "") // r and s are already 32 bytes long

      const resSwap = await AxiosService.request({
        method: 'GET',
        url: `https://api.1inch.io/v5.0/43114/swap`,
        query: {
          fromTokenAddress: config.tokenAddress,
          toTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          amount: `${parseEther(`${user.balanceWeb3}`)}`,
          fromAddress: user.address,
          slippage: 1,
          permit: permitString,
        }
      })

      if (resSwap) {
        console.log(resSwap?.tx)
        const request = {
          from: resSwap?.tx?.from,
          to: resSwap?.tx?.to,
          data: resSwap?.tx?.data,
          value: resSwap?.tx?.value,
          gasPrice: resSwap?.tx?.gasPrice
        }
        const tx = await wallet.sendTransaction(request)
        console.log(`Swap pendding`, tx.hash)
        const txReceipt = await tx.wait()
        console.log(`Swap success`, txReceipt)
      }
    }
  }

  static async transfer(userId: string | Types.ObjectId) {
    const user = await User.findById(userId).lean()
    console.log(user, 'transfer')
  }

  static async claimAndSwap() {
    const users = await User.find({ balance: { $gte: 0 } }).limit(1).lean()
    for (let i = 0; i < users.length; i++) {
      try {
        // await this.claim(users[i]._id)
        // await this.swap(users[i]._id)
        // await this.transfer(users[i]._id)
      } catch (error) {
        console.log(users[i].address, error, "error")
      }
    }
    console.log('<------------------Done------------------>')
  }
}

export default ClaimService
