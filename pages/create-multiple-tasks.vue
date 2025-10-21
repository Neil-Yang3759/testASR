<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-6">創建多個任務</h2>

      <form @submit.prevent="createMultipleTasks" class="space-y-8">
        <div
          v-for="(task, index) in tasks"
          :key="task.id"
          class="border p-4 rounded-md bg-gray-50"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">任務 #{{ index + 1 }}</h3>
            <button
              type="button"
              @click="removeTask(index)"
              class="text-red-600 hover:text-red-800"
              v-if="tasks.length > 1"
            >
              移除
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >標題</label
              >
              <input
                v-model="task.title"
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
                v-model="task.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >選擇音訊檔案</label
              >
              <input
                type="file"
                @change="handleFileSelect($event, index)"
                accept=".mp3,.wav,.m4a"
                class="cursor-pointer w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <div v-if="task.selectedFile" class="mt-2 text-sm text-gray-600">
                已選擇: {{ task.selectedFile.name }} ({{ formatFileSize(task.selectedFile.size) }})
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addTask"
          class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          新增任務
        </button>

        <!-- ASR 模型選擇 (Apply to all tasks) -->
        <div class="border-t pt-4">
          <h3 class="font-medium mb-4">ASR 模型設定 (套用於所有任務)</h3>
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
        </div>

        <!-- 提交按鈕 -->
        <div class="flex space-x-4">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ isSubmitting ? '創建中...' : '創建所有任務' }}
          </button>
          <button
            type="button"
            @click="resetAllForms"
            class="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            重置所有
          </button>
        </div>
      </form>

      <div v-if="results.length > 0" class="mt-8 space-y-4">
        <h3 class="text-lg font-bold">任務創建結果:</h3>
        <div
          v-for="(result, index) in results"
          :key="index"
          :class="result.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'"
          class="p-3 rounded-md"
        >
          任務 #{{ index + 1 }}: {{ result.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

import { ref, onMounted } from 'vue'
import { useApiClient } from '~/composables/useApiClient'
import { useAuthStore } from '~/stores/auth'

const { apiCall } = useApiClient()
const authStore = useAuthStore()

const tasks = ref([
  {
    id: 1,
    title: '',
    description: '',
    sourceType: '2', // Assuming file upload for simplicity
    selectedFile: null,
    audioDuration: 0,
  },
])

const isSubmitting = ref(false)
const results = ref([])
const models = ref([])
const loadingModels = ref(false)
const selectedModel = ref('')
const selectedModelInfo = ref(null)

// Helper to generate unique IDs for tasks
let taskIdCounter = 1
const generateTaskId = () => taskIdCounter++

const addTask = () => {
  tasks.value.push({
    id: generateTaskId(),
    title: '',
    description: '',
    sourceType: '2',
    selectedFile: null,
    audioDuration: 0,
  })
}

const removeTask = (index) => {
  tasks.value.splice(index, 1)
}

const handleFileSelect = (event, index) => {
  tasks.value[index].selectedFile = event.target.files[0]
  if (tasks.value[index].selectedFile) {
    getAudioDuration(tasks.value[index].selectedFile, index)
  }
}

// 載入 ASR 模型列表
const fetchModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiCall('/api/v1/models', 'GET')
    models.value = response.data || []
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
    } catch (error) {
      console.error('解析模型資訊失敗:', error)
      selectedModelInfo.value = null
    }
  } else {
    selectedModelInfo.value = null
  }
}

// 獲取音訊檔案時長
const getAudioDuration = (file, index) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    const url = URL.createObjectURL(file)

    audio.addEventListener('loadedmetadata', () => {
      tasks.value[index].audioDuration = Math.round(audio.duration)
      URL.revokeObjectURL(url)
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

const createMultipleTasks = async () => {
  isSubmitting.value = true
  results.value = []

  for (let i = 0; i < tasks.value.length; i++) {
    const task = tasks.value[i]
    try {
      const formData = new FormData()
      formData.append('sourceType', task.sourceType)
      formData.append('title', task.title)
      formData.append('description', task.description)
      formData.append('audio', task.selectedFile)

      // Add model info if selected
      if (selectedModelInfo.value) {
        formData.append('modelName', selectedModelInfo.value.name)
        if (selectedModelInfo.value.version) {
          formData.append('modelVersion', selectedModelInfo.value.version)
        }
      }

      // Default advanced settings (can be expanded later)
      formData.append('audioChannel', '0')
      formData.append('taskPriority', '1')
      formData.append('speakerNum', '0')
      formData.append('dspMode', '1')
      formData.append('promptWords', '')
      formData.append('textTrim', '0')

      const response = await apiCall('/api/v1/subtitle/tasks', 'POST', formData)
      results.value.push({
        success: true,
        message: `任務創建成功！任務 ID: ${response.id}`,
      })
    } catch (error) {
      results.value.push({
        success: false,
        message: `任務創建失敗: ${error.message}`,
      })
    }
  }
  isSubmitting.value = false
}

const resetAllForms = () => {
  tasks.value = [
    {
      id: generateTaskId(),
      title: '',
      description: '',
      sourceType: '2',
      selectedFile: null,
      audioDuration: 0,
    },
  ]
  selectedModel.value = ''
  selectedModelInfo.value = null
  results.value = []
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
