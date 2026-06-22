<template>
  <div class="p-6 overflow-y-auto h-full flex-1">
    <div class="w-full">
      <div class="mb-5 flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-bold text-slate-800">{{ t('admin_files_title') }}</h1>
        <div class="flex-1"></div>
        <div class="relative">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" @input="onSearch" type="text" class="w-44 pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" :placeholder="t('admin_files_search')" />
        </div>
        <select v-model="configFilter" @change="fetchItems" class="text-xs border border-slate-200 rounded-lg bg-white text-slate-700 px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">{{ t('admin_files_all_configs') }}</option>
          <option v-for="cfg in configs" :key="cfg.id" :value="cfg.id">{{ cfg.name }}</option>
        </select>
        <select v-model="typeFilter" @change="fetchItems" class="text-xs border border-slate-200 rounded-lg bg-white text-slate-700 px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">{{ t('admin_files_all_types') }}</option>
          <option value="jpg">jpg</option>
          <option value="png">png</option>
          <option value="gif">gif</option>
          <option value="webp">webp</option>
        </select>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_preview') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_filename') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_type') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_size') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_config') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_uploaded') }}</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_files_th_actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="item in data.results" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <img v-if="item.proxy_url" :src="item.proxy_url" class="h-10 w-10 rounded-lg object-cover border border-slate-200" @error="onImgError" />
                <div v-else class="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">N/A</div>
              </td>
              <td class="px-6 py-4 max-w-[200px]">
                <div class="text-sm font-medium text-slate-900 truncate">{{ item.filename }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{{ item.file_type || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ formatSize(item.file_size) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ item.storage_type || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ new Date(item.created_at).toLocaleDateString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="viewUrls(item)" class="text-indigo-600 hover:text-indigo-900 mr-4">{{ t('admin_files_view_urls') }}</button>
                <button @click="deleteItem(item.id)" class="text-red-600 hover:text-red-900">{{ t('admin_files_delete') }}</button>
              </td>
            </tr>
            <tr v-if="!data.results || data.results.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-sm">
                {{ t('admin_files_empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="data.total > data.pageSize" class="flex items-center justify-between mt-4 text-sm text-slate-600">
        <span>{{ t('admin_files_page_info', { start: (data.page - 1) * data.pageSize + 1, end: Math.min(data.page * data.pageSize, data.total), total: data.total }) }}</span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="data.page <= 1" class="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors">{{ t('admin_files_prev') }}</button>
          <button @click="nextPage" :disabled="data.page * data.pageSize >= data.total" class="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100 transition-colors">{{ t('admin_files_next') }}</button>
        </div>
      </div>
    </div>

    <!-- URL Modal -->
    <div v-if="showUrlModal" class="relative z-50" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showUrlModal = false"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all text-left my-8">
            <div class="px-6 py-6 sm:p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">{{ t('admin_files_url_modal_title') }}</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('admin_files_original_url') }}</label>
                  <div class="flex gap-2">
                    <input :value="urlItem.original_url" readonly class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-mono" />
                    <button @click="copyText(urlItem.original_url)" class="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">{{ t('admin_files_copy') }}</button>
                  </div>
                </div>
                <div v-if="urlItem.proxy_url">
                  <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('admin_files_proxy_url') }}</label>
                  <div class="flex gap-2">
                    <input :value="urlItem.proxy_url" readonly class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-mono" />
                    <button @click="copyText(urlItem.proxy_url)" class="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">{{ t('admin_files_copy') }}</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button @click="showUrlModal = false" class="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm">
                {{ t('admin_files_close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { t } from '@/utils/i18n'

interface FileItem {
  id: number
  filename: string
  file_type: string | null
  file_size: number | null
  mime_type: string | null
  original_url: string
  proxy_url: string | null
  upload_config_id: number | null
  storage_type: string | null
  created_at: string
}

interface ConfigItem {
  id: number
  name: string
}

const data = ref<{ results: FileItem[], total: number, page: number, pageSize: number }>({
  results: [], total: 0, page: 1, pageSize: 20
})
const configs = ref<ConfigItem[]>([])
const loading = ref(true)
const searchQuery = ref('')
const configFilter = ref('')
const typeFilter = ref('')
let searchTimer: any = null

const showUrlModal = ref(false)
const urlItem = ref<FileItem>({ id: 0, filename: '', file_type: '', file_size: 0, mime_type: '', original_url: '', proxy_url: '', upload_config_id: null, storage_type: '', created_at: '' })

const fetchItems = async () => {
  loading.value = true
  const token = localStorage.getItem('adminToken')
  const params = new URLSearchParams()
  if (searchQuery.value) params.set('q', searchQuery.value)
  if (configFilter.value) params.set('config_id', configFilter.value)
  if (typeFilter.value) params.set('file_type', typeFilter.value)
  params.set('page', data.value.page.toString())
  params.set('page_size', data.value.pageSize.toString())

  try {
    const res = await fetch(`/api/files?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    data.value = await res.json()
  } catch (e) {
    showToast('Failed to load files', 'error')
  } finally {
    loading.value = false
  }
}

const fetchConfigs = async () => {
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch('/api/upload-configs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    configs.value = await res.json()
  } catch (e) {}
}

const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    data.value.page = 1
    fetchItems()
  }, 300)
}

const prevPage = () => {
  if (data.value.page > 1) {
    data.value.page--
    fetchItems()
  }
}

const nextPage = () => {
  if (data.value.page * data.value.pageSize < data.value.total) {
    data.value.page++
    fetchItems()
  }
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const viewUrls = (item: FileItem) => {
  urlItem.value = item
  showUrlModal.value = true
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('admin_files_copied'), 'success')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showToast(t('admin_files_copied'), 'success')
  }
}

const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const deleteItem = async (id: number) => {
  const confirmed = await showConfirm('Delete this file record?')
  if (!confirmed) return
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/files/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) { showToast('Delete failed', 'error'); return }
    showToast('File deleted', 'success')
    fetchItems()
  } catch (e) {
    showToast('Network error', 'error')
  }
}

onMounted(() => {
  fetchItems()
  fetchConfigs()
})
</script>
