<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">任務列表</h2>
        <div class="flex space-x-2">
          <select
            v-model="filters.taskStatus"
            class="px-3 py-2 border rounded-md cursor-pointer disabled:cursor-not-allowed"
          >
            <option value="all">全部狀態</option>
            <option value="ongoing">進行中</option>
            <option value="succeeded">成功</option>
            <option value="failed">失敗</option>
            <option value="canceled">已取消</option>
          </select>
          <button
            @click="fetchTasks"
            class="cursor-pointer bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600"
          >
            重新載入
          </button>
        </div>
      </div>

      <!-- 任務表格 -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                標題
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                狀態
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                進度
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                創建時間
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="task in tasks" :key="task.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ task.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {{ task.title || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="getStatusClass(task.status)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ getStatusText(task.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {{ task.progress }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                {{ formatDate(task.createTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex space-x-2">
                  <button
                    @click="viewTask(task)"
                    class="cursor-pointer text-pink-600 hover:text-pink-700"
                  >
                    檢視
                  </button>
                  <button
                    v-if="task.status === 3"
                    @click="downloadFiles(task)"
                    class="cursor-pointer text-green-600 hover:text-green-800"
                  >
                    下載
                  </button>
                  <button
                    v-if="canCancel(task.status)"
                    @click="cancelTask(task.id)"
                    class="cursor-pointer text-pink-600 hover:text-pink-700"
                  >
                    取消
                  </button>
                  <button
                    @click="deleteTask(task.id)"
                    class="cursor-pointer text-pink-600 hover:text-pink-700"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分頁控制 -->
      <div class="flex justify-between items-center mt-6">
        <div class="text-sm text-gray-600">總共 {{ totalCount }} 筆記錄</div>
        <div class="flex space-x-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 0"
            class="cursor-pointer disabled:cursor-not-allowed px-3 py-1 border rounded-md disabled:opacity-50"
          >
            上一頁
          </button>
          <span class="px-3 py-1">第 {{ currentPage + 1 }} 頁</span>
          <button
            @click="currentPage++"
            :disabled="(currentPage + 1) * pageSize >= totalCount"
            class="cursor-pointer disabled:cursor-not-allowed px-3 py-1 border rounded-md disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>

    <!-- 任務詳情彈窗 -->
    <div
      v-if="selectedTask"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        <h3 class="text-lg font-bold mb-4">任務詳情</h3>
        <div class="space-y-2 text-sm">
          <div><strong>ID:</strong> {{ selectedTask.id }}</div>
          <div><strong>標題:</strong> {{ selectedTask.title }}</div>
          <div><strong>描述:</strong> {{ selectedTask.description }}</div>

          <div>
            <strong>狀態:</strong> {{ getStatusText(selectedTask.status) }}
          </div>
          <div><strong>進度:</strong> {{ selectedTask.progress }}%</div>
          <div><strong>聲音通道:</strong> {{ selectedTask.audioChannel }}</div>
          <div><strong>聲音人數:</strong> {{ selectedTask.speakerNum }}</div>
          <div>
            <strong>處理時間:</strong> {{ selectedTask.processTime }} 秒
          </div>
          <div><strong>模型:</strong> {{ selectedTask.modelDisplayName }}</div>
          <div>
            <strong>音訊長度:</strong> {{ selectedTask.audioLength }} 秒
          </div>
          <div>
            <strong>創建時間:</strong> {{ formatDate(selectedTask.createTime) }}
          </div>
          <div v-if="selectedTask.errorCode">
            <strong>錯誤碼:</strong> {{ selectedTask.errorCode }}
          </div>
          <div v-if="selectedTask.resultComment">
            <strong>註記:</strong> {{ selectedTask.resultComment }}
          </div>
          <div>
            <strong>到期時間:</strong>
            {{ formatDate(selectedTask.taskExpiredTime) }}
          </div>
          <div>
            <strong>上傳檔案名稱:</strong> {{ selectedTask.uploadedFileName }}
          </div>
        </div>
        <button
          @click="selectedTask = null"
          class="cursor-pointer mt-6 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          關閉
        </button>
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
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { apiCall } = useApiClient()

const tasks = ref([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(10)
const filters = ref({
  taskStatus: 'all',
})
const selectedTask = ref(null)

const fetchTasks = async () => {
  try {
    const params = {
      pageIndex: currentPage.value,
      pageSize: pageSize.value,
      taskStatus: filters.value.taskStatus,
    }
    const response = await apiCall(
      '/api/v1/subtitle/tasks',
      'GET',
      null,
      params
    )
    tasks.value = response.data || []

    // 獲取總數
    const countResponse = await apiCall(
      '/api/v1/subtitle/tasks/total',
      'GET',
      null,
      params
    )
    totalCount.value = countResponse.data[0]?.total || 0
  } catch (error) {
    console.error('獲取任務列表失敗:', error)
  }
}

const fetchTaskDetail = async (task) => {
  try {
    const response = await apiCall(`/api/v1/subtitle/tasks/${task.id}`, 'GET')
    return response || []
  } catch (error) {
    console.error('獲取任務資料失敗:', error)
  }
}

const viewTask = async (task) => {
  const result = await fetchTaskDetail(task)
  console.log(result.data)
  selectedTask.value = result.data[0]
}

const cancelTask = async (id) => {
  if (confirm('確定要取消此任務嗎？')) {
    try {
      await apiCall(`/api/v1/subtitle/tasks/${id}?operation=cancel`, 'PUT')
      fetchTasks()
    } catch (error) {
      console.error('取消任務失敗:', error)
    }
  }
}

const deleteTask = async (id) => {
  if (confirm('確定要刪除此任務嗎？')) {
    try {
      await apiCall(`/api/v1/subtitle/tasks/${id}`, 'DELETE')
      fetchTasks()
    } catch (error) {
      console.error('刪除任務失敗:', error)
    }
  }
}

const downloadFiles = async (task) => {
  // 實作檔案下載邏輯
  const types = [
    'resultSubtitleFilePath',
    'resultScriptFilePath',
    'resultAudioFilePath',
  ]
  for (const type of types) {
    try {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
      const path = `/api/v1/subtitle/tasks/${task.id}/file?target=${type}`
      const url = new URL(`${authStore.apiEndpoint}${path}`)
      const response = await fetch(url.toString(), options)
      if (!response.ok) {
        throw new Error(`網路回應錯誤: ${response.statusText}`)
      }
      try {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.style.display = 'none' // 讓它在畫面上不可見
        link.href = blobUrl
        link.download = task.title // 設定下載的檔案名稱
        document.body.appendChild(link) // 需要先加到 DOM 中才能點擊
        link.click()

        // 步驟 6: 清理，移除標籤並釋放 URL
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error(`下載 ${type} 檔案時發生錯誤:', error`)
        alert('下載失敗！')
      }
    } catch (error) {
      console.log(`${error}, ${type} 不存在`)
    }
  }

  // for (const type of types) {
  //   try {
  //     const response = await apiCall(
  //       `/api/v1/subtitle/tasks/${task.id}/file-path?target=${type}`,
  //       'GET'
  //     )
  //     if (response.data?.url) {
  //       window.open(response.data.url, '_blank')
  //     }
  //   } catch (error) {
  //     console.log(`${type} 不存在`)
  //   }
  // }
}

const canCancel = (status) => {
  return [0, 10, 11, 12, 13, 20, 21].includes(status)
}

const getStatusText = (status) => {
  const statusMap = {
    0: '等待確認',
    3: '成功',
    4: '失敗',
    5: '已取消',
    10: '上傳中',
    11: '等待處理',
    12: '下載中',
    13: '處理中',
    20: '等待處理',
    21: '處理中',
    22: '處理完成',
  }
  return statusMap[status] || '未知'
}

const getStatusClass = (status) => {
  const classMap = {
    3: 'bg-green-100 text-green-800',
    4: 'bg-red-100 text-red-800',
    5: 'bg-gray-100 text-gray-800',
    default: 'bg-blue-100 text-blue-800',
  }
  return classMap[status] || classMap.default
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-TW')
}

watch(
  [currentPage, filters],
  () => {
    fetchTasks()
  },
  { deep: true }
)

onMounted(() => {
  fetchTasks()
})
</script>
