import { api } from '../../../shared/lib/api'
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserSummary,
} from '@flowboard/shared-types'

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Login failed')
  }
  return response.data.data
}

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data)
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Registration failed')
  }
  return response.data.data
}

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout')
  } catch {
    // Proceed with client logout even if backend token is already invalid
  }
}

export const fetchMe = async (): Promise<UserSummary> => {
  const response = await api.get<ApiResponse<UserSummary>>('/auth/me')
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to fetch user profile')
  }
  return response.data.data
}
