import { useAuthStore } from '~/stores/auth'

export const useApiClient = () => {
  const authStore = useAuthStore()
  
  const apiCall = async (path, method = 'GET', body = null, params = {}) => {
    const url = new URL(`${authStore.apiEndpoint}${path}`)
    
    // 添加查詢參數
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key])
      }
    })
    
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    }
    
    if (body) {
      if (body instanceof FormData) {
        options.body = body
      } else {
        options.headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(body)
      }
    }
    
    const response = await fetch(url.toString(), options)
    const data = await response.json()
    
    if (data.code !== 200) {
      throw { status: data.code, message: data.error || '請求失敗' }
    }
    
    return data
  }
  
  return { apiCall }
}