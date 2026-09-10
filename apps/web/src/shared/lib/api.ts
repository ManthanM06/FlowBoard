import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export interface HealthResponse {
  success: boolean
  data: {
    status: string
    service: string
    database: string
    uptime: number
    timestamp: string
  }
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await api.get<HealthResponse>('/health')
  return response.data
}
