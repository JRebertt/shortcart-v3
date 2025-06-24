import { request } from 'undici'
import { API_BASE_URL } from './config'

export const http = {
  get: async (path: string) => {
    return await request(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
