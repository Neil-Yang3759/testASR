<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold mb-4">操作記錄</h2>

      <!-- 篩選條件 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label class="block text-sm text-gray-700 mb-1">使用者</label>
          <input
            v-model="filters.username"
            type="text"
            class="w-full px-3 py-2 border rounded-md"
            placeholder="輸入使用者名稱"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-700 mb-1">操作類型</label>
          <select
            v-model="filters.operationType"
            class="w-full px-3 py-2 border rounded-md"
          >
            <option value="">全部</option>
            <option value="create">創建</option>
            <option value="update">更新</option>
            <option value="delete">刪除</option>
            <option value="login">登入</option>
            <option value="logout">登出</option>
            <option value="download">下載</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-700 mb-1">描述關鍵字</label>
          <input
            v-model="filters.desc"
            type="text"
            class="w-full px-3 py-2 border rounded-md"
            placeholder="輸入關鍵字"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="fetchAuditLogs"
            class="cursor-pointer w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600"
          >
            查詢
          </button>
        </div>
      </div>

      <!-- 記錄列表 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                時間
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                使用者
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                角色
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                操作類型
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                描述
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                IP
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                結果
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="log in auditLogs" :key="log.id">
              <td class="px-6 py-4 text-sm">
                {{ formatDate(log.createTime) }}
              </td>
              <td class="px-6 py-4 text-sm">{{ log.username }}</td>
              <td class="px-6 py-4 text-sm">{{ log.role }}</td>
              <td class="px-6 py-4 text-sm">
                <span class="px-2 py-1 text-xs rounded bg-gray-100">
                  {{ log.type }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">{{ log.description }}</td>
              <td class="px-6 py-4 text-sm">{{ log.remoteIp }}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  :class="
                    log.status === 'success' ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分頁 -->
      <div class="flex justify-between items-center mt-6">
        <div class="text-sm text-gray-600">總共 {{ totalCount }} 筆記錄</div>
        <div class="flex space-x-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 0"
            class="cursor-pointer px-3 py-1 border rounded-md disabled:opacity-50"
          >
            上一頁
          </button>
          <span class="px-3 py-1">第 {{ currentPage + 1 }} 頁</span>
          <button
            @click="currentPage++"
            :disabled="(currentPage + 1) * pageSize >= totalCount"
            class="cursor-pointer px-3 py-1 border rounded-md disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})
import { ref, onMounted, watch } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

const { apiCall } = useApiClient()

const auditLogs = ref([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)
const filters = ref({
  username: '',
  operationType: '',
  desc: '',
})

const fetchAuditLogs = async () => {
  try {
    const params = {
      pageIndex: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    }

    const response = await apiCall('/api/v1/audit', 'GET', null, params)
    auditLogs.value = response.data || []

    const countResponse = await apiCall(
      '/api/v1/audit/total',
      'GET',
      null,
      filters.value
    )
    totalCount.value = countResponse.data[0]?.total || 0
  } catch (error) {
    console.error('獲取操作記錄失敗:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-TW')
}

watch(currentPage, () => {
  fetchAuditLogs()
})

onMounted(() => {
  fetchAuditLogs()
})
</script>
