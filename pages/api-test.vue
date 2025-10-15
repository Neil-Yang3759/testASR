<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- API 請求設定 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold mb-4">API 請求</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >HTTP 方法</label
            >
            <select
              v-model="request.method"
              class="w-full px-3 py-2 border rounded-md"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >API 路徑</label
            >
            <input
              v-model="request.path"
              type="text"
              placeholder="/api/v1/..."
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >查詢參數 (Query String)</label
            >
            <textarea
              v-model="request.params"
              rows="3"
              placeholder="pageIndex=0&#10;pageSize=10&#10;taskStatus=all"
              class="w-full px-3 py-2 border rounded-md font-mono text-sm"
            ></textarea>
          </div>

          <div v-if="['POST', 'PUT'].includes(request.method)">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Request Body (JSON)</label
            >
            <textarea
              v-model="request.body"
              rows="6"
              placeholder='{"key": "value"}'
              class="w-full px-3 py-2 border rounded-md font-mono text-sm"
            ></textarea>
          </div>

          <button
            @click="sendRequest"
            :disabled="isLoading"
            class="cursor-pointer w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600 disabled:bg-gray-400"
          >
            {{ isLoading ? '執行中...' : '發送請求' }}
          </button>
        </div>
      </div>

      <!-- API 回應顯示 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold mb-4">API 回應</h2>

        <div v-if="response" class="space-y-4">
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-gray-700">狀態碼</span>
              <span
                :class="
                  response.status === 200 ? 'text-green-600' : 'text-red-600'
                "
                class="font-bold"
              >
                {{ response.status }}
              </span>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-gray-700">回應內容</span>
              <button
                @click="copyResponse"
                class="cursor-pointer text-xs text-blue-600 hover:text-blue-800"
              >
                複製
              </button>
            </div>
            <pre
              class="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-96"
              >{{ formattedResponse }}</pre
            >
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">尚無回應資料</div>
      </div>
    </div>

    <!-- 快速測試範本 -->
    <div class="mt-8 bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-bold mb-4">快速測試範本</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="template in apiTemplates"
          :key="template.name"
          @click="loadTemplate(template)"
          class="cursor-pointer px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          {{ template.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

const { apiCall } = useApiClient()

const request = ref({
  method: 'GET',
  path: '/api/v1/subtitle/tasks',
  params: 'pageIndex=0\npageSize=10',
  body: '',
})

const response = ref(null)
const isLoading = ref(false)

const formattedResponse = computed(() => {
  if (!response.value?.data) return ''
  return JSON.stringify(response.value.data, null, 2)
})

const sendRequest = async () => {
  isLoading.value = true
  response.value = null

  try {
    // 解析查詢參數
    const params = {}
    if (request.value.params) {
      request.value.params.split('\n').forEach((line) => {
        const [key, value] = line.split('=')
        if (key && value) {
          params[key.trim()] = value.trim()
        }
      })
    }

    // 解析 body
    let body = null
    if (request.value.body && ['POST', 'PUT'].includes(request.value.method)) {
      try {
        body = JSON.parse(request.value.body)
      } catch {
        body = request.value.body
      }
    }

    const result = await apiCall(
      request.value.path,
      request.value.method,
      body,
      params
    )

    response.value = {
      status: 200,
      data: result,
    }
  } catch (error) {
    response.value = {
      status: error.status || 500,
      data: { error: error.message },
    }
  } finally {
    isLoading.value = false
  }
}

const copyResponse = () => {
  navigator.clipboard.writeText(formattedResponse.value)
  alert('已複製到剪貼簿')
}

const apiTemplates = [
  {
    name: '查詢任務',
    method: 'GET',
    path: '/api/v1/subtitle/tasks',
    params: 'pageIndex=0\npageSize=10\ntaskStatus=all',
  },
  {
    name: '任務總數',
    method: 'GET',
    path: '/api/v1/subtitle/tasks/total',
    params: 'taskStatus=all',
  },
  {
    name: '模型列表',
    method: 'GET',
    path: '/api/v1/models',
    params: '',
  },
  {
    name: '健康檢查',
    method: 'GET',
    path: '/api/v1/health',
    params: '',
  },
  {
    name: '操作記錄',
    method: 'GET',
    path: '/api/v1/audit',
    params: 'pageIndex=0\npageSize=10',
  },
]

const loadTemplate = (template) => {
  request.value = { ...template, body: '' }
}
</script>
