<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <h1 class="text-2xl font-bold text-gray-900">語音辨識系統</h1>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左側：上傳區域 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">上傳音檔</h2>

            <!-- 拖曳上傳區域 -->
            <div
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent
              @dragleave="isDragging = false"
              @dragenter="isDragging = true"
              :class="[
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400',
              ]"
            >
              <svg
                class="cursor-pointer mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p class="text-gray-600 mb-2">拖曳 MP3 檔案到此處</p>
              <p class="text-gray-500 text-sm mb-4">或</p>

              <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept=".mp3,audio/mp3"
                class="hidden"
              />

              <button
                @click="$refs.fileInput.click()"
                class="cursor-pointer px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              >
                選擇檔案
              </button>
            </div>

            <!-- 已選擇的檔案 -->
            <div v-if="selectedFile" class="mt-4 p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <svg
                    class="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ selectedFile.name }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatFileSize(selectedFile.size) }}
                    </p>
                  </div>
                </div>
                <button
                  @click="removeFile"
                  class="cursor-pointer text-red-500 hover:text-red-700"
                >
                  <svg
                    class="h-5 w-5 cursor-pointer"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 上傳按鈕 -->
            <button
              v-if="selectedFile"
              @click="uploadFile"
              :disabled="isUploading"
              class="cursor-pointer mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span v-if="!isUploading">開始辨識</span>
              <span v-else class="flex items-center justify-center">
                <svg
                  class="animate-spin h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                處理中...
              </span>
            </button>
          </div>
        </div>

        <!-- 中間：辨識結果 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">辨識結果</h2>

            <div v-if="!currentResult" class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-gray-500">尚無辨識結果</p>
              <p class="text-gray-400 text-sm mt-2">請上傳音檔開始辨識</p>
            </div>

            <div v-else class="space-y-4">
              <!-- 檔案資訊 -->
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">檔案名稱</p>
                <p class="font-medium text-gray-900">
                  {{ currentResult.fileName }}
                </p>
              </div>

              <!-- 辨識文字 -->
              <div class="p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-gray-600 mb-2">辨識文字</p>
                <div class="text-gray-900 whitespace-pre-wrap">
                  {{ currentResult.text }}
                </div>
              </div>

              <!-- 信心度 -->
              <div
                v-if="currentResult.confidence"
                class="p-4 bg-green-50 rounded-lg"
              >
                <p class="text-sm text-gray-600 mb-2">信心度</p>
                <div class="flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      class="bg-green-500 h-2 rounded-full"
                      :style="`width: ${currentResult.confidence * 100}%`"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-gray-700"
                    >{{ (currentResult.confidence * 100).toFixed(1) }}%</span
                  >
                </div>
              </div>

              <!-- 時間戳記 -->
              <div class="text-xs text-gray-500 text-right">
                辨識時間：{{ formatDate(currentResult.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：歷史記錄 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">上傳歷史</h2>
              <span class="text-sm text-gray-500"
                >共 {{ uploadHistory.length }} 筆</span
              >
            </div>

            <div v-if="uploadHistory.length === 0" class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p class="text-gray-500">尚無上傳記錄</p>
            </div>

            <div v-else class="space-y-3 max-h-[600px] overflow-y-auto">
              <div
                v-for="item in uploadHistory"
                :key="item.id"
                @click="selectHistoryItem(item)"
                class="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                :class="
                  currentResult?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                "
              >
                <!-- 檔案名稱 -->
                <div class="flex items-start justify-between mb-2">
                  <p class="text-sm font-medium text-gray-900 truncate flex-1">
                    {{ item.fileName }}
                  </p>
                  <StatusBadge :status="item.status" />
                </div>

                <!-- 預覽文字 -->
                <p
                  v-if="item.text"
                  class="text-xs text-gray-600 line-clamp-2 mb-2"
                >
                  {{ item.text }}
                </p>

                <!-- 時間與大小 -->
                <div
                  class="flex items-center justify-between text-xs text-gray-500"
                >
                  <span>{{ formatDate(item.timestamp) }}</span>
                  <span>{{ formatFileSize(item.fileSize) }}</span>
                </div>

                <!-- 進度條 (處理中) -->
                <div v-if="item.status === 'processing'" class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-1">
                    <div
                      class="bg-blue-500 h-1 rounded-full animate-pulse"
                      :style="`width: ${item.progress || 50}%`"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 狀態管理
const selectedFile = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const currentResult = ref(null)
const uploadHistory = ref([])

// 元件：狀態標籤
const StatusBadge = {
  props: ['status'],
  template: `
    <span 
      class="px-2 py-1 text-xs rounded-full"
      :class="{
        'bg-yellow-100 text-yellow-800': status === 'pending',
        'bg-blue-100 text-blue-800': status === 'processing',
        'bg-green-100 text-green-800': status === 'completed',
        'bg-red-100 text-red-800': status === 'failed'
      }"
    >
      {{ statusText }}
    </span>
  `,
  computed: {
    statusText() {
      const texts = {
        pending: '等待中',
        processing: '處理中',
        completed: '已完成',
        failed: '失敗',
      }
      return texts[this.status] || '未知'
    },
  },
}

// 檔案處理
const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false

  const files = Array.from(e.dataTransfer.files)
  const mp3File = files.find(
    (file) => file.type === 'audio/mp3' || file.name.endsWith('.mp3')
  )

  if (mp3File) {
    selectedFile.value = mp3File
  } else {
    alert('請上傳 MP3 格式的音檔')
  }
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const removeFile = () => {
  selectedFile.value = null
}

// 上傳檔案
const uploadFile = async () => {
  if (!selectedFile.value) return

  isUploading.value = true

  // 模擬上傳過程
  const newItem = {
    id: Date.now().toString(),
    fileName: selectedFile.value.name,
    fileSize: selectedFile.value.size,
    status: 'processing',
    timestamp: new Date().toISOString(),
    progress: 0,
  }

  uploadHistory.value.unshift(newItem)

  // 這裡應該調用實際的 API
  // const formData = new FormData()
  // formData.append('audio', selectedFile.value)
  // const response = await $fetch('/api/speech-to-text', {
  //   method: 'POST',
  //   body: formData
  // })

  // 模擬 API 回應
  setTimeout(() => {
    const result = {
      id: newItem.id,
      fileName: selectedFile.value.name,
      text: '這是語音辨識的範例結果文字。實際使用時，這裡會顯示從 API 返回的真實辨識內容。',
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    }

    currentResult.value = result

    // 更新歷史記錄狀態
    const index = uploadHistory.value.findIndex(
      (item) => item.id === newItem.id
    )
    if (index !== -1) {
      uploadHistory.value[index] = {
        ...uploadHistory.value[index],
        ...result,
        status: 'completed',
      }
    }

    isUploading.value = false
    selectedFile.value = null
  }, 2000)
}

// 選擇歷史項目
const selectHistoryItem = (item) => {
  if (item.status === 'completed') {
    currentResult.value = item
  }
}

// 格式化函數
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '剛剛'
  if (minutes < 60) return `${minutes} 分鐘前`
  if (hours < 24) return `${hours} 小時前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-TW')
}

// 載入歷史記錄（模擬從 API 獲取）
onMounted(() => {
  // 模擬載入歷史記錄
  uploadHistory.value = [
    {
      id: '1',
      fileName: '會議錄音_20241207.mp3',
      fileSize: 5242880,
      status: 'completed',
      text: '今天的會議主要討論了新產品的開發進度和市場策略...',
      confidence: 0.92,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      fileName: '客戶訪談_張先生.mp3',
      fileSize: 3145728,
      status: 'completed',
      text: '客戶表示對我們的服務非常滿意，特別是售後支援部分...',
      confidence: 0.88,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      fileName: '產品說明_v2.mp3',
      fileSize: 2097152,
      status: 'failed',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
  ]
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
