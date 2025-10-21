<template>
  <div>
    <!-- Header -->
    <header class="bg-white shadow-sm border-b fixed top-0 z-50 w-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold text-gray-900">
              TWM ASR API 測試平台
            </h1>
            <span
              v-if="authStore.isAuthenticated"
              class="text-sm text-green-600 bg-green-50 px-2 py-1 rounded"
            >
              已連線
            </span>

            <!-- Navigation Tabs -->
            <nav v-if="authStore.isAuthenticated" class="flex space-x-3 ml-6">
              <NuxtLink
                v-for="tab in navigationTabs"
                :key="tab.path"
                :to="tab.path"
                class="text-sm font-medium py-1 px-2 rounded-md transition-colors"
                :class="
                  $route.path === tab.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                "
              >
                {{ tab.name }}
              </NuxtLink>
            </nav>
          </div>
          <div class="flex items-center space-x-4">
            <span v-if="authStore.user" class="text-sm text-gray-600">
              {{ authStore.user }}
            </span>
            <button
              v-if="authStore.isAuthenticated"
              @click="handleLogout"
              class="cursor-pointer text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const navigationTabs = [
  { name: '任務管理', path: '/tasks' },
  { name: '創建任務', path: '/create-task' },
  { name: '創建多任務', path: '/create-multiple-tasks' }, // New entry
  { name: '模型管理', path: '/models' },
  { name: '勘誤表', path: '/fixbook' },
  { name: '操作記錄', path: '/audit' },
  { name: 'API 測試', path: '/api-test' },
]

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>
