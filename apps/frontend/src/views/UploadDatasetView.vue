<template>
  <AppLayout>
    <div class="max-w-2xl mx-auto px-4 py-6 sm:px-0">
      <div class="card">
        <div class="card-header">
          <h1 class="text-xl font-semibold text-gray-900">Upload Dataset</h1>
          <p class="mt-1 text-sm text-gray-600">
            Upload geospatial data files (GeoJSON, Shapefile, MapInfo Tab)
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="card-body space-y-6">
          <!-- File Upload -->
          <div>
            <label for="file" class="block text-sm font-medium text-gray-700">
              Dataset File *
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label for="file" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a file</span>
                    <input
                      id="file"
                      ref="fileInput"
                      type="file"
                      accept=".geojson,.json,.shp,.zip,.tab"
                      class="sr-only"
                      @change="handleFileSelect"
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">
                  GeoJSON, Shapefile, MapInfo Tab up to 50MB
                </p>
              </div>
            </div>
            
            <div v-if="selectedFile" class="mt-2 p-3 bg-gray-50 rounded-md">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button
                  type="button"
                  @click="clearFile"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Dataset Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Dataset Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input mt-1"
              placeholder="Enter dataset name"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="input mt-1"
              placeholder="Describe your dataset (optional)"
            />
          </div>

          <!-- Visibility -->
          <div>
            <label for="visibility" class="block text-sm font-medium text-gray-700">
              Visibility *
            </label>
            <select
              id="visibility"
              v-model="form.visibility"
              required
              class="input mt-1"
            >
              <option value="PRIVATE">Private - Only your organization can see this dataset</option>
              <option value="SHARED">Shared - Share with specific organizations</option>
              <option value="PUBLIC">Public - Anyone can use this dataset</option>
            </select>
          </div>

          <!-- Progress Bar -->
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-primary-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">
              {{ error }}
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-3">
            <RouterLink to="/datasets" class="btn-secondary">
              Cancel
            </RouterLink>
            <button
              type="submit"
              :disabled="isLoading || !selectedFile"
              class="btn-primary"
            >
              {{ isLoading ? 'Uploading...' : 'Upload Dataset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDatasetsStore } from '@/stores/datasets'
import { useToast } from 'vue-toastification'
import AppLayout from '@/components/layout/AppLayout.vue'
import type { CreateDatasetRequest, DatasetVisibility } from '@/types'

const router = useRouter()
const datasetsStore = useDatasetsStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)

const form = ref<CreateDatasetRequest>({
  name: '',
  description: '',
  visibility: 'PRIVATE'
})

const isLoading = ref(false)
const uploadProgress = ref(0)
const error = ref('')

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // Validate file type
    const allowedTypes = [
      'application/geo+json',
      'application/json',
      'application/zip',
      'application/octet-stream'
    ]
    
    const allowedExtensions = ['.geojson', '.json', '.shp', '.zip', '.tab']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      error.value = 'Invalid file type. Please upload a GeoJSON, Shapefile, or MapInfo Tab file.'
      return
    }
    
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      error.value = 'File size must be less than 50MB.'
      return
    }
    
    selectedFile.value = file
    error.value = ''
    
    // Auto-fill name if not provided
    if (!form.value.name) {
      form.value.name = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file to upload'
    return
  }

  if (!form.value.name) {
    error.value = 'Dataset name is required'
    return
  }

  isLoading.value = true
  uploadProgress.value = 0
  error.value = ''

  try {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 10
      }
    }, 200)

    const newDataset = await datasetsStore.uploadDataset(selectedFile.value, form.value)
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    toast.success('Dataset uploaded successfully!')
    router.push('/datasets')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to upload dataset. Please try again.'
  } finally {
    isLoading.value = false
    uploadProgress.value = 0
  }
}
</script>
