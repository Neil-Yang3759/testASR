<template>
  <div class="max-w-7xl mx-auto px-4 py-8 pt-20">
    <div class="bg-white rounded-lg shadow p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-xl font-bold">逐字表</h2>
          <p class="text-sm text-gray-600 mt-1">Task ID: {{ taskId }}</p>
          <p v-if="taskTitle" class="text-sm text-gray-600">
            Title: <span class="font-bold">{{ taskTitle }}</span>
          </p>
        </div>
        <button
          @click="goBack"
          class="cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"
        ></div>
        <p class="mt-4 text-gray-600">Loading subtitle data...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-md p-4"
      >
        <div class="flex items-center">
          <span class="text-red-800 mr-2">Error</span>
          <span class="text-red-800">{{ error }}</span>
        </div>
      </div>

      <!-- Subtitle Content -->
      <div v-else-if="subtitles && subtitles.length > 0">
        <div class="rounded-lg border-2 border-solid p-2 mb-4">
          <!-- Stats Summary -->
          <div class="bg-gray-50 rounded-md p-4 mb-6">
            <audio
              v-if="audioUrl"
              ref="audioPlayer"
              :src="audioUrl"
              controls
              class="w-full mb-5"
              @timeupdate="onTimeUpdate"
            ></audio>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Total Segments: </span>
                <span class="font-bold">{{ subtitles.length }}</span>
              </div>
              <div>
                <span class="text-gray-600">Duration: </span>
                <span class="font-bold">{{ totalDuration }}</span>
              </div>
              <div v-if="speakerCount > 0">
                <span class="text-gray-600">Speakers: </span>
                <span class="font-bold">{{ speakerCount }}</span>
              </div>
              <div>
                <span class="text-gray-600">Characters: </span>
                <span class="font-bold">{{ totalWords }}</span>
              </div>
            </div>
          </div>

          <!-- Filter/Search Options -->
          <div class="mb-4 flex gap-2 flex-wrap">
            <input
              v-model="searchText"
              type="text"
              placeholder="Search subtitles..."
              class="flex-1 px-3 py-2 border rounded-md"
            />
            <select
              v-if="speakerCount > 0"
              v-model="filterSpeaker"
              class="px-3 py-2 border rounded-md cursor-pointer"
            >
              <option value="">All Speakers</option>
              <option
                v-for="speaker in uniqueSpeakers"
                :key="speaker"
                :value="speaker"
              >
                {{ speaker }}
              </option>
            </select>
            <button
              @click="toggleFollow"
              :class="[
                ' rounded-full w-10 h-10 flex justify-center content-center flex-wrap',
                followSubtitle
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700',
              ]"
            >
              <UIcon name="i-lucide-arrow-down-to-dot" class="size-5" />
            </button>
          </div>
        </div>

        <!-- Subtitle List -->
        <div
          class="space-y-3 overflow-auto max-h-[45vh]"
          ref="subtitleContainer"
        >
          <div
            v-for="(subtitle, index) in filteredSubtitles"
            :key="index"
            :data-subtitle-id="subtitle.id"
            class="border rounded-md p-4 transition-colors cursor-pointer"
            :class="{
              'bg-yellow-100 hover:bg-blue-500 hover:text-white ':
                subtitle.id === currentSubtitleId,
              'hover:bg-gray-100': subtitle.id !== currentSubtitleId,
            }"
            @click="seekTo(subtitle.startTime)"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold">#{{ subtitle.id }}</span>
                <span
                  class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded"
                >
                  {{ subtitle.startTime }} → {{ subtitle.endTime }}
                </span>
                <span class="text-xs">
                  ({{
                    calculateDuration(subtitle.startTime, subtitle.endTime)
                  }}s)
                </span>
                <span
                  v-if="subtitle.speaker"
                  :class="[
                    'text-xs px-2 py-1 rounded',
                    getSpeakerColor(subtitle.speaker).bg,
                    getSpeakerColor(subtitle.speaker).text,
                  ]"
                >
                  {{ subtitle.speaker }}
                </span>
              </div>
            </div>
            <div class=" ">
              <p
                class="leading-relaxed"
                v-html="highlightText(subtitle.text)"
              ></p>
            </div>
          </div>
        </div>

        <!-- Empty State after filtering -->
        <div
          v-if="filteredSubtitles.length === 0"
          class="text-center py-12 text-gray-500"
        >
          No subtitles found matching your criteria
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 text-gray-500">
        No subtitle data available for this task
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const { apiCall } = useApiClient()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const taskId = ref(route.query.taskId)
const taskTitle = ref(decodeURIComponent(route.query.title || ''))
const subtitles = ref([])
const loading = ref(true)
const error = ref('')
const searchText = ref('')
const filterSpeaker = ref('')
const audioUrl = ref('')
const speakerColors = ref({})

const audioPlayer = ref(null)
const currentSubtitleId = ref(null)
const followSubtitle = ref(true)

const toggleFollow = () => {
  followSubtitle.value = !followSubtitle.value
}

watch(currentSubtitleId, (newId) => {
  if (followSubtitle.value && newId !== null) {
    scrollToSubtitle(newId)
  }
})

const scrollToSubtitle = (id) => {
  const subtitleElement = document.querySelector(`[data-subtitle-id='${id}']`)
  if (subtitleElement) {
    subtitleElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }
}

const onTimeUpdate = () => {
  if (!audioPlayer.value) return
  const currentTime = audioPlayer.value.currentTime
  for (const subtitle of subtitles.value) {
    const startTime = timeToSeconds(subtitle.startTime)
    const endTime = timeToSeconds(subtitle.endTime)
    if (currentTime >= startTime && currentTime <= endTime) {
      currentSubtitleId.value = subtitle.id
      break
    }
  }
}

const seekTo = (time) => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = timeToSeconds(time)
    audioPlayer.value.play()
  }
}

const tailwindColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
]

const getSpeakerColor = (speaker) => {
  if (!speaker) return {}
  if (!speakerColors.value[speaker]) {
    const colorIndex =
      Object.keys(speakerColors.value).length % tailwindColors.length
    speakerColors.value[speaker] = tailwindColors[colorIndex]
  }
  return speakerColors.value[speaker]
}

// Fetch subtitle data
const fetchSubtitleData = async () => {
  try {
    loading.value = true
    error.value = ''

    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    }

    const path = `/api/v1/subtitle/tasks/${taskId.value}/subtitle-json?editor=1&category=dia`
    const response = await apiCall(path)

    // Handle different possible response formats
    let rawData = []
    if (Array.isArray(response)) {
      rawData = response
    } else if (response.data && Array.isArray(response.data)) {
      rawData = response.data
    } else if (response.result && Array.isArray(response.result)) {
      rawData = response.result
    } else {
      console.error('Unexpected data format:', response)
      error.value = 'Unable to parse subtitle data format'
      return
    }

    // Transform data to consistent format
    subtitles.value = rawData.map((item) => ({
      id: item.id,
      speaker: item.speaker,
      startTime: item.startTime,
      endTime: item.endTime,
      text: item.text,
    }))
  } catch (err) {
    console.error('Failed to fetch subtitle data:', err)
    error.value = `Failed to load subtitles: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Computed properties
const filteredSubtitles = computed(() => {
  let filtered = subtitles.value

  // Filter by speaker
  if (filterSpeaker.value) {
    filtered = filtered.filter((s) => s.speaker === filterSpeaker.value)
  }

  // Filter by search text
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter((s) => s.text?.toLowerCase().includes(search))
  }

  return filtered
})

const uniqueSpeakers = computed(() => {
  const speakers = new Set()
  subtitles.value.forEach((s) => {
    if (s.speaker) speakers.add(s.speaker)
  })
  return Array.from(speakers).sort()
})

const speakerCount = computed(() => uniqueSpeakers.value.length)

const totalDuration = computed(() => {
  if (subtitles.value.length === 0) return '0:00'
  const lastSubtitle = subtitles.value[subtitles.value.length - 1]
  return lastSubtitle.endTime || '0:00'
})

const totalWords = computed(() => {
  return subtitles.value.reduce((sum, s) => {
    return sum + (s.text?.length || 0)
  }, 0)
})

// Helper functions
const timeToSeconds = (timeString) => {
  // Convert "00:00:12.185" to seconds
  if (!timeString) return 0
  const parts = timeString.split(':')
  const hours = parseInt(parts[0]) || 0
  const minutes = parseInt(parts[1]) || 0
  const seconds = parseFloat(parts[2]) || 0
  return hours * 3600 + minutes * 60 + seconds
}

const calculateDuration = (startTime, endTime) => {
  const start = timeToSeconds(startTime)
  const end = timeToSeconds(endTime)
  return (end - start).toFixed(1)
}

const highlightText = (text) => {
  if (!searchText.value || !text) return text

  const regex = new RegExp(`(${searchText.value})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

const goBack = () => {
  router.push('/tasks')
}

// Fetch audio URL
const fetchAudioUrl = async () => {
  try {
    const path = `/api/v1/subtitle/tasks/${taskId.value}/editor-resource?need_subtitle_content=0`
    const response = await apiCall(path)

    if (response.data && response.data.length > 0) {
      audioUrl.value = `${response.data[0].audioUrl}?ticket=${response.data[0].audioTicket}`
    }
  } catch (err) {
    console.error('Failed to fetch audio URL:', err)
    error.value = `Failed to load audio URL: ${err.message}`
  }
}

onMounted(() => {
  if (!taskId.value) {
    error.value = 'Missing task ID'
    loading.value = false
    return
  }
  fetchSubtitleData()
  fetchAudioUrl()
})
</script>

<style scoped>
mark {
  padding: 0 2px;
  border-radius: 2px;
}
</style>
