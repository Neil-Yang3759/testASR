<template>
  <div class="max-w-4xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-6">創建新任務</h2>

      <form @submit.prevent="createTask" class="space-y-6">
        <!-- 音源類型 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >音源類型</label
          >
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input
                v-model="taskForm.sourceType"
                type="radio"
                value="2"
                class="mr-2"
              />
              <span>上傳檔案</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="taskForm.sourceType"
                type="radio"
                value="1"
                class="mr-2"
              />
              <span>YouTube 連結</span>
            </label>
          </div>
        </div>

        <!-- YouTube 連結 -->
        <div v-if="taskForm.sourceType === '1'">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >YouTube 連結</label
          >
          <input
            v-model="taskForm.sourceWebLink"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <!-- 檔案上傳 -->
        <div v-if="taskForm.sourceType === '2'">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >選擇音訊檔案</label
          >
          <input
            type="file"
            @change="handleFileSelect"
            accept=".mp3,.wav,.m4a"
            class="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <div v-if="selectedFile" class="mt-2 space-y-2">
            <p class="text-sm text-gray-600">
              已選擇: {{ selectedFile.name }} ({{
                formatFileSize(selectedFile.size)
              }})
            </p>
            <div v-if="audioDuration > 0" class="text-sm">
              <p class="text-gray-600">
                音訊長度: {{ formatDuration(audioDuration) }}
              </p>
            </div>
            <div v-if="loadingEstimate" class="text-sm text-blue-600">
              <span class="inline-block animate-pulse">正在計算預估處理時間...</span>
            </div>
            <div
              v-if="estimatedTime !== null && !loadingEstimate"
              class="p-3 bg-blue-50 border border-blue-200 rounded-md"
            >
              <p class="text-sm font-medium text-blue-800">
                ⏱️ 預計處理時間: {{ formatDuration(estimatedTime) }}
              </p>
              <p class="text-xs text-blue-600 mt-1">
                *此為根據近期任務統計的預估時間，實際時間可能有所不同
              </p>
            </div>
          </div>
        </div>

        <!-- 任務資訊 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >標題</label
          >
          <input
            v-model="taskForm.title"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >描述</label
          >
          <textarea
            v-model="taskForm.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          ></textarea>
        </div>

        <!-- ASR 模型選擇 -->
        <div class="border-t pt-4">
          <h3 class="font-medium mb-4">ASR 模型設定</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">
                選擇 ASR 模型
                <span v-if="loadingModels" class="text-gray-500 ml-2"
                  >(載入中...)</span
                >
              </label>
              <select
                v-model="selectedModel"
                @change="onModelChange"
                class="w-full px-3 py-2 border rounded-md"
                :disabled="loadingModels"
              >
                <option value="">使用預設模型</option>
                <option
                  v-for="model in models"
                  :key="`${model.name}-${model.version}`"
                  :value="JSON.stringify(model)"
                >
                  {{ model.displayName || model.name }}
                  {{ model.version ? `(v${model.version})` : '' }}
                  {{ model.isDefaultModel ? '[預設]' : '' }}
                </option>
              </select>
              <p v-if="selectedModelInfo" class="mt-1 text-xs text-gray-500">
                模型代號: {{ selectedModelInfo.name }} | 版本:
                {{ selectedModelInfo.version || '最新' }}
              </p>
            </div>

            <div v-if="selectedModelInfo && selectedModelInfo.description">
              <label class="block text-sm text-gray-700 mb-1">模型描述</label>
              <div class="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                {{ selectedModelInfo.description }}
              </div>
            </div>
          </div>

          <!-- 模型相關設定 -->
          <div v-if="selectedModelInfo" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="flex items-start space-x-2">
              <svg
                class="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div class="text-sm text-blue-800">
                <p class="font-medium">已選擇自訂模型</p>
                <p class="mt-1">
                  此任務將使用 "{{
                    selectedModelInfo.displayName || selectedModelInfo.name
                  }}" 進行語音辨識
                </p>
                <p v-if="selectedModelInfo.modelStatus" class="mt-1">
                  模型狀態: {{ selectedModelInfo.modelStatus }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 進階設定 -->
        <div class="border-t pt-4">
          <h3 class="font-medium mb-4">進階設定</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">音軌設定</label>
              <select
                v-model="taskForm.audioChannel"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="0">不指定</option>
                <option value="1">左聲道</option>
                <option value="2">右聲道</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">任務優先權</label>
              <select
                v-model="taskForm.taskPriority"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="1">一般</option>
                <option value="2">優先</option>
                <option value="3">中高優先</option>
                <option value="4">高優先</option>
                <option value="5">最高優先</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">語者人數</label>
              <input
                v-model="taskForm.speakerNum"
                type="number"
                min="0"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="0 為自動偵測"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">音訊優化</label>
              <select
                v-model="taskForm.dspMode"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="1">開啟</option>
                <option value="0">關閉</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">文字潤飾</label>
              <select
                v-model="taskForm.textTrim"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="0">關閉</option>
                <option value="1">開啟</option>
              </select>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm text-gray-700 mb-1"
              >關鍵字提示（以逗號分隔）</label
            >
            <input
              v-model="taskForm.promptWords"
              type="text"
              placeholder="人名,專有名詞,產品名稱"
              class="w-full px-3 py-2 border rounded-md"
            />
            <p class="mt-1 text-xs text-gray-500">
              輸入音檔中可能出現的專有名詞、人名或技術術語，有助於提高辨識準確度
            </p>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="flex space-x-4">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ isSubmitting ? '創建中...' : '創建任務' }}
          </button>
          <button
            type="button"
            @click="resetForm"
            class="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </form>

      <div v-if="message" :class="messageClass" class="mt-4 p-3 rounded-md">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

const { apiCall } = useApiClient()

const taskForm = ref({
  sourceType: '2',
  sourceWebLink: '',
  title: '',
  description: '',
  audioChannel: '0',
  modelName: '',
  modelVersion: '',
  taskPriority: '1',
  speakerNum: '0',
  dspMode: '1',
  promptWords: '',
  textTrim: '0',
})

const selectedFile = ref(null)
const isSubmitting = ref(false)
const message = ref('')
const messageClass = ref('')
const models = ref([])
const loadingModels = ref(false)
const selectedModel = ref('')
const selectedModelInfo = ref(null)
const audioDuration = ref(0)
const estimatedTime = ref(null)
const loadingEstimate = ref(false)

// 載入 ASR 模型列表
const fetchModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiCall('/api/v1/models', 'GET')
    models.value = response.data || []

    // 找出預設模型
    const defaultModel = models.value.find((m) => m.isDefaultModel)
    if (defaultModel) {
      console.log('預設模型:', defaultModel.displayName || defaultModel.name)
    }
  } catch (error) {
    console.error('載入模型列表失敗:', error)
    models.value = []
  } finally {
    loadingModels.value = false
  }
}

// 當模型選擇改變時
const onModelChange = () => {
  if (selectedModel.value) {
    try {
      selectedModelInfo.value = JSON.parse(selectedModel.value)
      taskForm.value.modelName = selectedModelInfo.value.name
      taskForm.value.modelVersion = selectedModelInfo.value.version || ''
    } catch (error) {
      console.error('解析模型資訊失敗:', error)
      selectedModelInfo.value = null
      taskForm.value.modelName = ''
      taskForm.value.modelVersion = ''
    }
  } else {
    selectedModelInfo.value = null
    taskForm.value.modelName = ''
    taskForm.value.modelVersion = ''
  }
}

const handleFileSelect = async (event) => {
  selectedFile.value = event.target.files[0]

  if (selectedFile.value) {
    // 重置預估時間
    estimatedTime.value = null
    audioDuration.value = 0

    // 獲取音訊時長
    await getAudioDuration(selectedFile.value)
  }
}

// 獲取音訊檔案時長
const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)

    audio.addEventListener('loadedmetadata', async () => {
      audioDuration.value = Math.round(audio.duration)
      URL.revokeObjectURL(url)

      // 獲取預估處理時間
      if (audioDuration.value > 0) {
        await fetchEstimatedTime(audioDuration.value)
      }

      resolve()
    })

    audio.addEventListener('error', () => {
      console.error('無法讀取音訊檔案')
      URL.revokeObjectURL(url)
      resolve()
    })

    audio.src = url
  })
}

// 獲取預估處理時間
const fetchEstimatedTime = async (audioLength) => {
  loadingEstimate.value = true
  try {
    const response = await apiCall(
      '/api/v1/subtitle/tasks/estimated-process-time',
      'GET',
      null,
      { count: 10, audioLength }
    )
    if (response.data && response.data.length > 0) {
      estimatedTime.value = response.data[0].estimatedProcessTime
    }
  } catch (error) {
    console.error('獲取預估時間失敗:', error)
  } finally {
    loadingEstimate.value = false
  }
}

// 格式化時間（秒）為可讀格式
const formatDuration = (seconds) => {
  if (!seconds) return '0 秒'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours} 小時`)
  if (minutes > 0) parts.push(`${minutes} 分鐘`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs} 秒`)

  return parts.join(' ')
}

const createTask = async () => {
  isSubmitting.value = true
  message.value = ''

  try {
    const formData = new FormData()

    // 添加基本欄位（排除空的 modelName 和 modelVersion）
    Object.keys(taskForm.value).forEach((key) => {
      const value = taskForm.value[key]
      if (value !== '' && value !== null && value !== undefined) {
        // 排除 sourceWebLink（如果不是 YouTube 來源）
        if (key === 'sourceWebLink' && taskForm.value.sourceType !== '1') {
          return
        }
        // 只有在有值時才添加 modelName 和 modelVersion
        if ((key === 'modelName' || key === 'modelVersion') && !value) {
          return
        }
        formData.append(key, value)
      }
    })

    // 根據音源類型添加特定欄位
    if (taskForm.value.sourceType === '1') {
      if (!taskForm.value.sourceWebLink) {
        throw new Error('請輸入 YouTube 連結')
      }
      formData.append('sourceWebLink', taskForm.value.sourceWebLink)
    } else if (taskForm.value.sourceType === '2') {
      if (!selectedFile.value) {
        throw new Error('請選擇音訊檔案')
      }
      formData.append('audio', selectedFile.value)
    }

    const response = await apiCall('/api/v1/subtitle/tasks', 'POST', formData)

    message.value = `任務創建成功！任務 ID: ${response.id}`
    if (selectedModelInfo.value) {
      message.value += ` (使用模型: ${selectedModelInfo.value.displayName || selectedModelInfo.value.name})`
    }
    messageClass.value = 'bg-green-50 text-green-600'

    // 延遲重置表單，讓用戶有時間看到成功訊息
    setTimeout(() => {
      resetForm()
    }, 2000)
  } catch (error) {
    message.value = `創建失敗: ${error.message}`
    messageClass.value = 'bg-red-50 text-red-600'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  taskForm.value = {
    sourceType: '2',
    sourceWebLink: '',
    title: '',
    description: '',
    audioChannel: '0',
    modelName: '',
    modelVersion: '',
    taskPriority: '1',
    speakerNum: '0',
    dspMode: '1',
    promptWords: '',
    textTrim: '0',
  }
  selectedFile.value = null
  selectedModel.value = ''
  selectedModelInfo.value = null
  audioDuration.value = 0
  estimatedTime.value = null
  loadingEstimate.value = false
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 頁面載入時獲取模型列表
onMounted(() => {
  fetchModels()
})
</script>
