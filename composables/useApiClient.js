import { useAuthStore } from '~/stores/auth'

export const useApiClient = () => {
  const authStore = useAuthStore()

  const apiCall = async (
    path,
    method = 'GET',
    body = null,
    params = null,
    domain = authStore.apiEndpoint
  ) => {
    const url =
      domain === 'full'
        ? new URL(path)
        : domain === null
          ? new URL(`${authStore.apiEndpoint}${path}`)
          : new URL(`${domain}${path}`)

    // 添加查詢參數
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== '') {
          url.searchParams.append(key, params[key])
        }
      })
    }

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
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

    if (response.status === 401) {
      authStore.logout()
      throw { status: data.code, message: '未授權，請重新登入' }
    }

    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      // Response is likely JSON
      data = await response.json()
      if (data.code !== 200 && data.code !== 202) {
        throw { status: data.code, message: data.error || '請求失敗' }
      }
      // Process JSON data
    } else if (contentType && contentType.includes('text/plain')) {
      // Response is likely plain text
      // data = await response.text()
      data = response
      // Process text data
    } else if (contentType && contentType.includes('image/')) {
      // Response is likely an image
      data = await response.blob()
      // Process image blob (e.g., create an object URL)
    } else {
      // Handle other or unknown content types
      data = await response.text() // Fallback to text
      // ...
    }

    return data
  }

  return { apiCall }
}
