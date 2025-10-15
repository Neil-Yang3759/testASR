<template>
  <div class="max-w-6xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-bold mb-4">勘誤表管理</h2>

      <!-- 模型選擇 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >選擇模型</label
        >
        <select
          v-model="selectedModelName"
          @change="loadFixbook"
          class="px-3 py-2 border rounded-md"
        >
          <option value="">請選擇模型</option>
          <option v-for="model in models" :key="model.name" :value="model.name">
            {{ model.displayName }}
          </option>
        </select>
      </div>

      <div
        v-if="selectedModelName"
        class="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <!-- 勘誤表列表 -->
        <div>
          <h3 class="font-medium mb-2">勘誤項目</h3>
          <div class="border rounded-md p-4 max-h-96 overflow-y-auto">
            <table class="min-w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">原文</th>
                  <th class="text-left py-2">修正後</th>
                  <th class="text-left py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in fixbookEntries"
                  :key="index"
                  class="border-b"
                >
                  <td class="py-2">{{ item.x }}</td>
                  <td class="py-2">{{ item.o }}</td>
                  <td class="py-2">
                    <button
                      @click="removeEntry(index)"
                      class="cursor-pointer text-pink-600 hover:text-pink-700 text-sm"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="fixbookEntries.length === 0"
              class="text-gray-500 text-center py-4"
            >
              暫無勘誤項目
            </div>
          </div>
        </div>

        <!-- 新增勘誤 -->
        <div>
          <h3 class="font-medium mb-2">新增勘誤項目</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1"
                >原文（錯誤）</label
              >
              <input
                v-model="newEntry.x"
                type="text"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="輸入需要修正的文字"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1"
                >修正後（正確）</label
              >
              <input
                v-model="newEntry.o"
                type="text"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="輸入修正後的文字"
              />
            </div>
            <button
              @click="addEntry"
              class="cursor-pointer w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600"
            >
              新增項目
            </button>

            <div class="border-t pt-4">
              <button
                @click="saveFixbook"
                :disabled="!selectedModelName"
                class="cursor-pointer w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                儲存勘誤表
              </button>
            </div>
          </div>

          <!-- 批次匯入 -->
          <div class="mt-6 border-t pt-4">
            <h4 class="font-medium mb-2">批次匯入</h4>
            <textarea
              v-model="batchImport"
              rows="4"
              placeholder="格式: 原文|修正後&#10;每行一個項目"
              class="w-full px-3 py-2 border rounded-md text-sm font-mono"
            ></textarea>
            <button
              @click="importBatch"
              class="cursor-pointer mt-2 w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
            >
              批次匯入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApiClient } from '~/composables/useApiClient'

const { apiCall } = useApiClient()

const models = ref([])
const selectedModelName = ref('')
const fixbookEntries = ref([])
const newEntry = ref({ x: '', o: '' })
const batchImport = ref('')

const fetchModels = async () => {
  try {
    const response = await apiCall('/api/v1/models', 'GET')
    models.value = response.data || []
  } catch (error) {
    console.error('獲取模型列表失敗:', error)
  }
}

const loadFixbook = async () => {
  if (!selectedModelName.value) return

  try {
    const response = await apiCall(
      `/api/v1/fixbook/text?modelName=${selectedModelName.value}`,
      'GET'
    )
    fixbookEntries.value = response.data[0]?.fixbook || []
  } catch (error) {
    console.error('載入勘誤表失敗:', error)
  }
}

const addEntry = () => {
  if (newEntry.value.x && newEntry.value.o) {
    fixbookEntries.value.push({
      id: Date.now(),
      x: newEntry.value.x,
      o: newEntry.value.o,
    })
    newEntry.value = { x: '', o: '' }
  }
}

const removeEntry = (index) => {
  fixbookEntries.value.splice(index, 1)
}

const importBatch = () => {
  const lines = batchImport.value.split('\n')
  lines.forEach((line) => {
    const [x, o] = line.split('|')
    if (x && o) {
      fixbookEntries.value.push({
        id: Date.now() + Math.random(),
        x: x.trim(),
        o: o.trim(),
      })
    }
  })
  batchImport.value = ''
}

const saveFixbook = async () => {
  try {
    await apiCall(
      `/api/v1/fixbook/text?modelName=${selectedModelName.value}`,
      'POST',
      {
        modelName: selectedModelName.value,
        fixbook: fixbookEntries.value,
      }
    )
    alert('勘誤表儲存成功')
  } catch (error) {
    console.error('儲存勘誤表失敗:', error)
    alert('儲存失敗: ' + error.message)
  }
}

onMounted(() => {
  fetchModels()
})
</script>
