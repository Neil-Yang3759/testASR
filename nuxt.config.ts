import { defineNuxtConfig } from 'nuxt/config';
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@pinia/nuxt'
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl: import.meta.env.API_BASE_URL || '',
      account: import.meta.env.ACCOUNT || '',
      password: import.meta.env.PASSWORD || ''
    }
  },
  ssr: false, // 設定為SPA模式
  app: {
    head: {
      title: 'TWM ASR API 測試平台',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/attachment.ico' }],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})