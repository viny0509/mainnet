import axios from 'axios'
import QueryString from 'qs'

export interface IRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  query?: Record<string, unknown>
  body?: Record<string, unknown>
  token?: string
}

class AxiosService {
  static async request({ method, url, body, query, token }: IRequest) {
    if (query) {
      url = `${url}?${QueryString.stringify(query)}`
    }
    const config = {
      method,
      url,
      data: body || undefined,
      headers: token
        ? {
            Authorization: token,
          }
        : undefined,
    }

    return axios
      .request(config)
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        if (error?.response?.status === 403) {
          console.log('Your session has expired. Please sign in again to continue')
        } else if (!error?.message?.includes('canceled')) {
          console.log(error?.response?.data?.message || 'API Error')
        }
        return null
      })
  }
}

export default AxiosService
