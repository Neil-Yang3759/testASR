export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    apiEndpoint: '',
    tokenExpiration: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(endpoint, credentials) {
      this.apiEndpoint = endpoint

      const response = await $fetch(`${endpoint}/api/v1/login`, {
        method: 'POST',
        body: credentials,
      })

      if (response.code === 200) {
        this.token = response.token
        this.user = credentials.username
        this.tokenExpiration = Date.now() + response.expiration * 1000

        // 儲存到 localStorage
        if (import.meta.client) {
          localStorage.setItem('auth_token', this.token)
          localStorage.setItem('api_endpoint', endpoint)
          localStorage.setItem('auth_user', credentials.username)
        }

        return response
      } else {
        throw new Error(response.error || '登入失敗')
      }
    },

    async logout() {
      if (this.token) {
        try {
          await $fetch(`${this.apiEndpoint}/api/v1/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          })
        } catch (error) {
          console.error('登出失敗:', error)
        }
      }
      console.log('logout success')

      this.token = null
      this.user = null
      this.apiEndpoint = ''

      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('api_endpoint')
        localStorage.removeItem('auth_user')
      }
      navigateTo('/')
    },

    initializeAuth() {
      if (import.meta.client) {
        this.token = localStorage.getItem('auth_token')
        this.apiEndpoint = localStorage.getItem('api_endpoint')
        this.user = localStorage.getItem('auth_user')
      }
    },
  },
})
