<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 bg-cover bg-center"
    style="
      background-image: url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80');
      background-blend-mode: overlay;
    "
  >
    <div
      class="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-white/20"
    >
      <h2 class="text-2xl font-bold text-center mb-8 text-gray-800">
        TWM ASR API 登入
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >API 端點</label
          >
          <input
            v-model="apiEndpoint"
            type="text"
            placeholder="https://api.example.com"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >帳號</label
          >
          <input
            v-model="credentials.username"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >密碼</label
          >
          <input
            v-model="credentials.password"
            type="password"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div class="flex items-center">
          <input
            v-model="credentials.rememberMe"
            type="checkbox"
            class="mr-2"
          />
          <label class="text-sm text-gray-600">記住我</label>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="cursor-pointer w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600 disabled:bg-gray-400"
        >
          {{ isLoading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div
        v-if="error"
        class="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const apiEndpoint = ref('https://isp-poc.asr.t-mchat.com')
const credentials = ref({
  username: 'penpowerunser',
  password: 'penpowerUser0935',
  rememberMe: 1,
})
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    await authStore.login(apiEndpoint.value, credentials.value)
    router.push('/tasks')
  } catch (err) {
    error.value = err.message || '登入失敗'
  } finally {
    isLoading.value = false
  }
}
</script>
