<template>
  <div class="p-6 overflow-y-auto h-full flex-1">
    <div class="w-full">
      <div class="mb-5 flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-bold text-slate-800">{{ t('admin_upload_config_title') }}</h1>
        <div class="flex-1"></div>
        <button @click="openAddModal" class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
          <svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('admin_upload_config_add') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_name') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_type') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_default') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_proxy') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_status') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_sort') }}</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_upload_config_th_actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900">{{ item.name }}</div>
                <div v-if="item.remark" class="text-xs text-slate-400 mt-0.5">{{ item.remark }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ item.storage_type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="item.is_default" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {{ t('admin_upload_config_default_yes') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {{ item.is_proxy ? t('admin_upload_config_proxy_on') : t('admin_upload_config_proxy_off') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ item.status ? t('admin_upload_config_status_active') : t('admin_upload_config_status_disabled') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ item.sort_order }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="setDefault(item)" v-if="!item.is_default" class="text-emerald-600 hover:text-emerald-900 mr-4">{{ t('admin_upload_config_set_default') }}</button>
                <button @click="triggerTestUpload(item)" class="text-cyan-600 hover:text-cyan-900 mr-4">{{ t('admin_upload_config_test') }}</button>
                <button @click="openEditModal(item)" class="text-indigo-600 hover:text-indigo-900 mr-4">{{ t('admin_upload_config_edit') }}</button>
                <button @click="deleteItem(item.id, item.is_default)" class="text-red-600 hover:text-red-900">{{ t('admin_upload_config_delete') }}</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-sm">
                {{ t('admin_upload_config_empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0" @click.self="closeModal">
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all text-left my-8">
            <form @submit.prevent="saveItem">
              <div class="px-6 py-6 sm:p-8">
                <h3 class="text-xl font-semibold text-slate-900 mb-6">
                  {{ isEditing ? t('admin_upload_config_modal_edit') : t('admin_upload_config_modal_add') }}
                </h3>

                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_name') }}</label>
                    <input v-model="form.name" type="text" required class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_storage_type') }}</label>
                    <div class="relative">
                      <select v-model="form.storage_type" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-shadow bg-white text-sm">
                        <option value="common">common</option>
                        <option value="S3">S3</option>
                        <option value="R2">R2</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_upload_url') }}</label>
                    <input v-model="form.upload_url" type="text" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_proxy_prefix') }}</label>
                    <input v-model="form.proxy_prefix" type="text" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" :placeholder="t('admin_upload_config_form_proxy_prefix_ph')" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_access_key') }}</label>
                    <input v-model="form.access_key" type="text" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_secret_key') }}</label>
                    <input v-model="form.secret_key" type="password" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_refresh_token') }}</label>
                    <input v-model="form.refresh_token" type="password" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                  </div>

                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="form.is_default" type="checkbox" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                      <span class="text-sm text-slate-700">{{ t('admin_upload_config_form_is_default') }}</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="form.is_proxy" type="checkbox" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                      <span class="text-sm text-slate-700">{{ t('admin_upload_config_form_is_proxy') }}</span>
                    </label>
                  </div>

                  <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input v-model="form.status" type="checkbox" class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                      <span class="text-sm text-slate-700">{{ t('admin_upload_config_form_status') }}</span>
                    </label>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_sort') }}</label>
                      <input v-model.number="form.sort_order" type="number" class="w-24 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_upload_config_form_remark') }}</label>
                    <textarea v-model="form.remark" rows="2" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm"></textarea>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" @click="closeModal" class="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm">
                  {{ t('admin_upload_config_cancel') }}
                </button>
                <button type="submit" :disabled="saving" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center text-sm">
                  <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ saving ? t('admin_upload_config_saving') : t('admin_upload_config_save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input for test upload -->
    <input ref="testFileInputRef" type="file" accept="image/*" class="hidden" @change="onTestFileSelected" />

    <!-- Test Upload Result Modal -->
    <div v-if="showTestResult" class="relative z-50" role="dialog" aria-modal="true">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="showTestResult = false"></div>
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all text-left my-8">
            <div class="px-6 py-6 sm:p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-4">{{ t('admin_upload_config_test_result') }}</h3>
              <div v-if="testUploading" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span class="ml-3 text-sm text-slate-500">{{ t('admin_upload_config_test_uploading') }}</span>
              </div>
              <div v-else-if="testError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                {{ testError }}
              </div>
              <div v-else-if="testResult" class="space-y-4">
                <div v-if="testResult.proxy_url" class="flex justify-center">
                  <img :src="testResult.proxy_url" class="max-h-48 rounded-xl border border-slate-200" @error="onTestImgError" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('admin_upload_config_test_url') }}</label>
                  <div class="flex gap-2">
                    <input :value="testResult.url" readonly class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-mono" />
                    <button @click="copyText(testResult.url)" class="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">{{ t('admin_upload_config_copy') }}</button>
                  </div>
                </div>
                <div v-if="testResult.original_url !== testResult.url">
                  <label class="block text-xs font-medium text-slate-500 mb-1">{{ t('admin_upload_config_test_original') }}</label>
                  <div class="flex gap-2">
                    <input :value="testResult.original_url" readonly class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-mono" />
                    <button @click="copyText(testResult.original_url)" class="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">{{ t('admin_upload_config_copy') }}</button>
                  </div>
                </div>
                <div class="text-xs text-slate-400">
                  {{ t('admin_upload_config_test_file_id') }}: {{ testResult.file_id }}
                </div>
              </div>
            </div>
            <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button @click="showTestResult = false" class="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm">
                {{ t('admin_upload_config_close') }}
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

interface UploadConfig {
  id: number
  name: string
  is_default: number
  is_proxy: number
  proxy_prefix: string | null
  storage_type: string
  upload_url: string | null
  access_key: string | null
  secret_key: string | null
  refresh_token: string | null
  status: number
  sort_order: number
  remark: string | null
  created_at: string
}

const items = ref<UploadConfig[]>([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const form = ref({
  name: '',
  storage_type: 'common',
  upload_url: '',
  proxy_prefix: '',
  access_key: '',
  secret_key: '',
  refresh_token: '',
  is_default: false,
  is_proxy: false,
  status: true,
  sort_order: 0,
  remark: '',
})
const editingId = ref<number | null>(null)

const fetchItems = async () => {
  loading.value = true
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch('/api/upload-configs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    items.value = await res.json()
  } catch (e) {
    showToast('Failed to load configs', 'error')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    name: '', storage_type: 'common', upload_url: '', proxy_prefix: '',
    access_key: '', secret_key: '', refresh_token: '', is_default: false,
    is_proxy: false, status: true, sort_order: 0, remark: '',
  }
  showModal.value = true
}

const openEditModal = (item: UploadConfig) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    name: item.name,
    storage_type: item.storage_type,
    upload_url: item.upload_url || '',
    proxy_prefix: (item as any).proxy_prefix || '',
    access_key: item.access_key || '',
    secret_key: item.secret_key || '',
    refresh_token: item.refresh_token || '',
    is_default: !!item.is_default,
    is_proxy: !!item.is_proxy,
    status: !!item.status,
    sort_order: item.sort_order,
    remark: item.remark || '',
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveItem = async () => {
  saving.value = true
  const token = localStorage.getItem('adminToken')
  try {
    const url = isEditing.value ? `/api/upload-configs/${editingId.value}` : '/api/upload-configs'
    const method = isEditing.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) {
      showToast(data.error || 'Save failed', 'error')
      return
    }
    showToast(isEditing.value ? 'Config updated' : 'Config created', 'success')
    closeModal()
    fetchItems()
  } catch (e) {
    showToast('Network error', 'error')
  } finally {
    saving.value = false
  }
}

const setDefault = async (item: UploadConfig) => {
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/upload-configs/${item.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, is_default: true })
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Failed', 'error'); return }
    showToast('Default config updated', 'success')
    fetchItems()
  } catch (e) {
    showToast('Network error', 'error')
  }
}

const testFileInputRef = ref<HTMLInputElement | null>(null)
const testUploading = ref(false)
const showTestResult = ref(false)
const testResult = ref<any>(null)
const testError = ref('')
const testingConfigId = ref<number | null>(null)

const triggerTestUpload = (item: UploadConfig) => {
  testingConfigId.value = item.id
  testFileInputRef.value?.click()
}

const onTestFileSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !testingConfigId.value) return

  testUploading.value = true
  showTestResult.value = true
  testResult.value = null
  testError.value = ''

  const token = localStorage.getItem('adminToken')
  try {
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch(`/api/upload-configs/${testingConfigId.value}/test-upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })

    const data = await res.json()
    if (!res.ok) {
      testError.value = data.error || 'Upload failed'
    } else {
      testResult.value = data
    }
  } catch (e) {
    testError.value = 'Network error'
  } finally {
    testUploading.value = false
    target.value = ''
  }
}

const onTestImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('admin_upload_config_copied'), 'success')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showToast(t('admin_upload_config_copied'), 'success')
  }
}

const deleteItem = async (id: number, isDefault: number) => {
  if (isDefault) {
    showToast('Cannot delete default config', 'error')
    return
  }
  const confirmed = await showConfirm('Delete this config?')
  if (!confirmed) return

  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/upload-configs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error || 'Delete failed', 'error'); return }
    showToast('Config deleted', 'success')
    fetchItems()
  } catch (e) {
    showToast('Network error', 'error')
  }
}

onMounted(fetchItems)
</script>
