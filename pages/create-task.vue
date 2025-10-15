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
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p v-if="selectedFile" class="mt-2 text-sm text-gray-600">
            已選擇: {{ selectedFile.name }} ({{
              formatFileSize(selectedFile.size)
            }})
          </p>
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
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="flex space-x-4">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="cursor-pointer flex-1 bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600 disabled:bg-gray-400"
          >
            {{ isSubmitting ? '創建中...' : '創建任務' }}
          </button>
          <button
            type="button"
            @click="resetForm"
            class="cursor-pointer px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
import { ref } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

const { apiCall } = useApiClient()

const taskForm = ref({
  sourceType: '2',
  sourceWebLink: '',
  title: '',
  description: '',
  audioChannel: '0',
  taskPriority: '1',
  speakerNum: '0',
  dspMode: '1',
  promptWords: '',
})

const selectedFile = ref(null)
const isSubmitting = ref(false)
const message = ref('')
const messageClass = ref('')

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
}

const createTask = async () => {
  isSubmitting.value = true
  message.value = ''

  try {
    const formData = new FormData()

    // 添加基本欄位
    Object.keys(taskForm.value).forEach((key) => {
      if (taskForm.value[key] && key !== 'sourceWebLink') {
        formData.append(key, taskForm.value[key])
      }
    })

    // 根據音源類型添加特定欄位
    if (taskForm.value.sourceType === '1') {
      formData.append('sourceWebLink', taskForm.value.sourceWebLink)
    } else if (taskForm.value.sourceType === '2' && selectedFile.value) {
      formData.append('audio', selectedFile.value)
    }

    const response = await apiCall('/api/v1/subtitle/tasks', 'POST', formData)

    message.value = `任務創建成功！任務 ID: ${response.id}`
    messageClass.value = 'bg-green-50 text-green-600'
    resetForm()
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
    taskPriority: '1',
    speakerNum: '0',
    dspMode: '1',
    promptWords: '',
  }
  selectedFile.value = null
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>
