export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function randomNumber(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const ellipsisAddress = (address: string, prefixLength = 13, suffixLength = 4) => {
  address = address || ''
  return `${address.substr(0, prefixLength)}...${address.substr(address?.length - suffixLength, suffixLength)}`
}
