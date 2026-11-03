import axios from 'axios'
import { message } from 'antd'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

function applyInterceptors(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const body = response.data as ApiResponse<unknown>
      if (body.code !== 0) {
        message.error(body.message || '请求失败')
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      return response
    },
    (error) => {
      const status = error.response?.status
      const msg = error.response?.data?.message
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('nickname')
        localStorage.removeItem('userRole')
        message.error('请先登录')
        window.location.href = '/login'
      } else if (status === 403) {
        message.error(msg || '没有操作权限')
      } else {
        message.error(msg || '网络错误，请稍后重试')
      }
      return Promise.reject(error)
    },
  )
  return instance
}

const client = applyInterceptors(
  axios.create({ baseURL: '/api/v1/app', timeout: 10000 }),
)

export const adminClient = applyInterceptors(
  axios.create({ baseURL: '/api/v1/admin', timeout: 10000 }),
)

export default client
