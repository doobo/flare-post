<template>
  <div class="p-6 overflow-y-auto h-full flex-1">
    <div class="w-full">
      <div class="flex justify-between items-baseline mb-5">
        <div class="flex items-baseline space-x-2">
          <h1 class="text-xl font-bold text-slate-800">{{ t('admin_users_title') }}</h1>
          <span class="text-xs text-slate-400 hidden sm:inline">{{ t('admin_users_subtitle') }}</span>
        </div>
        <button @click="openAddModal" class="inline-flex items-center self-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <svg class="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ t('admin_users_add') }}
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_users_th_username') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_users_th_email') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_users_th_role') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_users_th_created') }}</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_users_th_actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                    <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover" />
                    <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="text-sm font-medium text-slate-900">{{ user.username }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ user.email || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openEditModal(user)" class="text-indigo-600 hover:text-indigo-900 mr-4">{{ t('admin_users_edit') }}</button>
                <button @click="deleteUser(user.id)" class="text-red-600 hover:text-red-900">{{ t('admin_users_delete') }}</button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500 text-sm">
                {{ t('admin_users_empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="showModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
      
      <!-- Modal Scroll Container -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0" @click.self="closeModal">
          <!-- Modal Content -->
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all text-left my-8">
            <form @submit.prevent="saveUser">
              <div class="px-6 py-6 sm:p-8">
                <h3 class="text-xl font-semibold text-slate-900 mb-6" id="modal-title">
                {{ isEditing ? t('admin_users_modal_edit') : t('admin_users_modal_add') }}
              </h3>
              
              <div class="space-y-5">
                <div class="text-center">
                  <div class="flex flex-col items-center">
                    <div class="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-slate-200">
                      <img v-if="form.avatar" :src="form.avatar" class="w-full h-full object-cover" />
                      <span v-else>{{ (form.username || 'U').charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="mt-2 flex items-center gap-3">
                      <a @click="triggerAvatarUpload" class="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer">{{ t('admin_users_avatar_change') }}</a>
                      <a v-if="form.avatar" @click="form.avatar = ''" class="text-xs text-red-500 hover:text-red-700 cursor-pointer">{{ t('admin_users_delete') }}</a>
                    </div>
                    <input ref="avatarInputRef" type="file" accept="image/*" class="hidden" @change="onAvatarSelected" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_users_form_username') }}</label>
                  <input v-model="form.username" type="text" required class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" :placeholder="t('admin_users_ph_username')" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">
                    {{ t('admin_users_form_password') }}
                    <span class="text-xs text-slate-400 font-normal" v-if="isEditing">{{ t('admin_users_password_unchanged') }}</span>
                  </label>
                  <input v-model="form.password" type="password" :required="!isEditing" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="••••••••" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_users_form_email') }}</label>
                  <input v-model="form.email" type="email" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" :placeholder="t('admin_users_ph_email')" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('admin_users_form_role') }}</label>
                  <div class="relative">
                    <select v-model="form.role" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-shadow bg-white">
                      <option value="admin">{{ t('admin_users_role_admin') }}</option>
                      <option value="editor">{{ t('admin_users_role_editor') }}</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" @click="closeModal" class="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                {{ t('admin_users_cancel') }}
              </button>
              <button type="submit" :disabled="saving" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 flex items-center justify-center">
                <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ saving ? t('admin_users_saving') : t('admin_users_save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Crop Modal -->
<div v-if="showCropModal" class="relative z-50" aria-labelledby="crop-modal-title" role="dialog" aria-modal="true">
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
  <div class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all text-left my-8">
        <div class="px-6 py-6 sm:p-8">
          <h3 class="text-xl font-semibold text-slate-900 mb-4" id="crop-modal-title">{{ t('admin_users_avatar_crop_title') }}</h3>
          <div class="bg-slate-100 rounded-xl overflow-hidden max-h-80">
            <img ref="cropImageRef" :src="cropImageSrc" class="max-w-full" />
          </div>
        </div>
        <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" @click="cancelCrop" class="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors">
            {{ t('admin_users_avatar_crop_cancel') }}
          </button>
          <button type="button" @click="confirmCrop" :disabled="cropUploading" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center">
            <svg v-if="cropUploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ cropUploading ? t('admin_users_avatar_uploading') : t('admin_users_avatar_crop_confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'
import { encryptPassword } from '@/utils/crypto'
import { showConfirm } from '@/utils/confirm'
import { t } from '@/utils/i18n'
import Cropper from 'cropperjs'

const router = useRouter()
const users = ref<any[]>([])
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const form = ref({ id: '', username: '', password: '', email: '', role: 'admin', avatar: '' })

const showCropModal = ref(false)
const cropUploading = ref(false)
const cropImageSrc = ref('')
const cropImageRef = ref<HTMLImageElement | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)
let cropper: Cropper | null = null

const fetchUsers = async () => {
  loading.value = true
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      users.value = await res.json()
    } else if (res.status === 401) {
      handleAuthError()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  isEditing.value = false
  form.value = { id: '', username: '', password: '', email: '', role: 'admin', avatar: '' }
  showModal.value = true
}

const openEditModal = (user: any) => {
  isEditing.value = true
  form.value = { id: user.id.toString(), username: user.username, password: '', email: user.email || '', role: user.role, avatar: user.avatar || '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click()
}

const onAvatarSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    cropImageSrc.value = ev.target?.result as string
    showCropModal.value = true
    nextTick(() => {
      if (cropImageRef.value) {
        cropper?.destroy()
        cropper = new Cropper(cropImageRef.value, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 1,
          cropBoxResizable: true,
          cropBoxMovable: true,
          background: false
        })
      }
    })
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const cancelCrop = () => {
  cropper?.destroy()
  cropper = null
  showCropModal.value = false
  cropImageSrc.value = ''
}

const confirmCrop = async () => {
  if (!cropper) return
  cropUploading.value = true
  try {
    const canvas = cropper.getCroppedCanvas({
      width: 200,
      height: 200,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    })
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    })
    if (!blob) throw new Error('Failed to compress image')

    const formData = new FormData()
    formData.append('image', blob, 'avatar.jpg')

    const token = localStorage.getItem('adminToken')
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    form.value.avatar = data.url
    cancelCrop()
    showToast('Avatar updated', 'success')
  } catch (e) {
    console.error(e)
    showToast(t('admin_users_avatar_upload_error'), 'error')
  } finally {
    cropUploading.value = false
  }
}

const saveUser = async () => {
  saving.value = true
  const token = localStorage.getItem('adminToken')
  try {
    let encryptedPassword = undefined
    if (form.value.password) {
      const result = await encryptPassword(form.value.password)
      encryptedPassword = result.encrypted
    }

    const url = isEditing.value ? `/api/users/${form.value.id}` : '/api/users'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    const body: any = {
      username: form.value.username,
      email: form.value.email,
      role: form.value.role
    }
    if (encryptedPassword) body.password = encryptedPassword
    if (isEditing.value) body.avatar = form.value.avatar || null

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      closeModal()
      fetchUsers()
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      showToast(t('admin_users_save_error') + ': ' + (data.error || ''), 'error')
    }
  } catch (e) {
    console.error(e)
    showToast(t('admin_users_network_error'), 'error')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (id: number) => {
  if (!await showConfirm(t('admin_users_delete_confirm'))) return

  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      users.value = users.value.filter(u => u.id !== id)
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      showToast('Failed to delete user: ' + (data.error || 'Unknown error'), 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('Error connecting to server.', 'error')
  }
}

const handleAuthError = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}

onMounted(() => {
  fetchUsers()
})
</script>
