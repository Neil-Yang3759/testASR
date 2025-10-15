<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="grid gap-6">
      <!-- ASR 模型列表 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold mb-4">ASR 模型列表</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  模型代號
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  模型名稱
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  版本
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  狀態
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  預設模型
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="model in models" :key="model.name">
                <td class="px-6 py-4 text-sm">{{ model.name }}</td>
                <td class="px-6 py-4 text-sm">{{ model.displayName }}</td>
                <td class="px-6 py-4 text-sm">{{ model.version }}</td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                  >
                    {{ model.modelStatus || '就緒' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span v-if="model.isDefaultModel" class="text-green-600"
                    >✓</span
                  >
                </td>
                <td class="px-6 py-4 text-sm">
                  <button
                    @click="selectModel(model)"
                    class="cursor-pointer text-pink-600 hover:text-pink-700"
                  >
                    管理詞庫
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 用戶詞庫管理 -->
      <div v-if="selectedModel" class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">
            用戶詞庫 - {{ selectedModel.displayName }}
          </h3>
          <button
            @click="selectedModel = null"
            class="cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 詞庫列表 -->
          <div>
            <h4 class="font-medium mb-2">現有詞彙</h4>
            <div class="border rounded-md p-4 max-h-96 overflow-y-auto">
              <div
                v-if="vocabulary.length === 0"
                class="text-gray-500 text-center py-4"
              >
                暫無詞彙
              </div>
              <div
                v-for="vocab in vocabulary"
                :key="vocab.word"
                class="flex justify-between items-center py-2 border-b"
              >
                <span>{{ vocab.word }}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">{{ vocab.prob }}</span>
                  <span
                    :class="getVocabStatusClass(vocab.state)"
                    class="text-xs px-2 py-1 rounded"
                  >
                    {{ getVocabStatusText(vocab.state) }}
                  </span>
                  <button
                    @click="removeVocab(vocab)"
                    class="cursor-pointer text-pink-600 hover:text-pink-700 text-sm"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 新增詞彙 -->
          <div>
            <h4 class="font-medium mb-2">新增詞彙</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-sm text-gray-700 mb-1">詞彙</label>
                <input
                  v-model="newVocab.word"
                  type="text"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="輸入詞彙"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-700 mb-1">機率權重</label>
                <input
                  v-model="newVocab.prob"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="0.5"
                />
              </div>
              <button
                @click="addVocab"
                class="cursor-pointer w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600"
              >
                新增詞彙
              </button>

              <div class="border-t pt-4">
                <button
                  @click="updateVocabulary"
                  class="cursor-pointer w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                >
                  儲存變更並開始合成
                </button>
              </div>
            </div>
          </div>
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

const { apiCall } = useApiClient()

const models = ref([])
const selectedModel = ref(null)
const vocabulary = ref([])
const newVocab = ref({ word: '', prob: 0.5 })

const fetchModels = async () => {
  try {
    const response = await apiCall('/api/v1/models', 'GET')
    models.value = response.data || []
  } catch (error) {
    console.error('獲取模型列表失敗:', error)
  }
}

const selectModel = async (model) => {
  selectedModel.value = model
  await fetchVocabulary(model.name)
}

const fetchVocabulary = async (modelName) => {
  try {
    const response = await apiCall(
      `/api/v1/models/combiner/vocabulary?modelName=${modelName}`,
      'GET'
    )
    vocabulary.value = response.data[0]?.vocabs || []
  } catch (error) {
    console.error('獲取詞庫失敗:', error)
  }
}

const addVocab = () => {
  if (newVocab.value.word) {
    vocabulary.value.push({
      word: newVocab.value.word,
      state: 0, // 等待整合
      prob: parseFloat(newVocab.value.prob),
    })
    newVocab.value = { word: '', prob: 0.5 }
  }
}

const removeVocab = (vocab) => {
  vocab.state = 2 // 等待刪除
}

const updateVocabulary = async () => {
  try {
    await apiCall('/api/v1/models/combiner/vocabulary', 'PUT', {
      modelName: selectedModel.value.name,
      vocabs: vocabulary.value,
    })

    // 開始合成
    await apiCall(
      `/api/v1/models/combiner/status?modelName=${selectedModel.value.name}&newStatus=start`,
      'PUT'
    )

    alert('詞庫更新成功，模型合成已開始')
    await fetchVocabulary(selectedModel.value.name)
  } catch (error) {
    console.error('更新詞庫失敗:', error)
    alert('更新失敗: ' + error.message)
  }
}

const getVocabStatusText = (state) => {
  const stateMap = { 0: '等待整合', 1: '已整合', 2: '等待刪除' }
  return stateMap[state] || '未知'
}

const getVocabStatusClass = (state) => {
  const classMap = {
    0: 'bg-yellow-100 text-yellow-800',
    1: 'bg-green-100 text-green-800',
    2: 'bg-red-100 text-red-800',
  }
  return classMap[state] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  fetchModels()
})
</script>
