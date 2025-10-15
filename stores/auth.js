import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: null,
    isAuthenticated: false,
  }),

  actions: {
    setToken(token) {
      this.token = token
      this.isAuthenticated = true
      localStorage.setItem('asr_token', token)
    },

    logout() {
      this.token = ''
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('asr_token')
    },

    loadTokenFromStorage() {
      const token = localStorage.getItem('asr_token')
      if (token) {
        this.token = token
        this.isAuthenticated = true
      }
    },
  },
})
