<template>
  <div class="p-6 lg:p-10">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Manage Users</h1>
          <p class="text-sm text-slate-500 mt-1">Add, edit, or remove administrator accounts.</p>
        </div>
        <button @click="openAddModal" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900">{{ user.username }}</div>
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
                <button @click="openEditModal(user)" class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                <button @click="deleteUser(user.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500 text-sm">
                No users found.
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
                {{ isEditing ? 'Edit User' : 'Add New User' }}
              </h3>
              
              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input v-model="form.username" type="text" required class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. admin" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">
                    Password 
                    <span class="text-xs text-slate-400 font-normal" v-if="isEditing">(Leave blank to keep unchanged)</span>
                  </label>
                  <input v-model="form.password" type="password" :required="!isEditing" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="••••••••" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input v-model="form.email" type="email" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="admin@example.com" />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <div class="relative">
                    <select v-model="form.role" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-shadow bg-white">
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
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
                Cancel
              </button>
              <button type="submit" :disabled="saving" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 flex items-center justify-center">
                <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ saving ? 'Saving...' : 'Save User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'

const router = useRouter()
const users = ref<any[]>([])
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const form = ref({ id: '', username: '', password: '', email: '', role: 'admin' })

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
  form.value = { id: '', username: '', password: '', email: '', role: 'admin' }
  showModal.value = true
}

const openEditModal = (user: any) => {
  isEditing.value = true
  form.value = { id: user.id.toString(), username: user.username, password: '', email: user.email || '', role: user.role }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveUser = async () => {
  saving.value = true
  const token = localStorage.getItem('adminToken')
  try {
    let encryptedPassword = undefined
    if (form.value.password) {
      // 1. Fetch public key from backend
      const keyRes = await fetch('/api/auth/public-key')
      if (!keyRes.ok) {
        throw new Error('Failed to retrieve secure encryption key')
      }
      const jwk = await keyRes.json()

      // 2. Import public key
      const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      )

      // 3. Encrypt the password
      const encoder = new TextEncoder()
      const passwordData = encoder.encode(form.value.password)
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        passwordData
      )

      // 4. Base64 encode the encrypted password
      encryptedPassword = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))
    }

    const url = isEditing.value ? `/api/users/${form.value.id}` : '/api/users'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: form.value.username,
        password: encryptedPassword,
        email: form.value.email,
        role: form.value.role
      })
    })

    if (res.ok) {
      closeModal()
      fetchUsers()
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      showToast('Error: ' + (data.error || 'Failed to save user'), 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('Network error', 'error')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (id: number) => {
  if (!confirm('Are you sure you want to delete this user?')) return

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
  showToast('Session expired. Please log in again.', 'error')
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}

onMounted(() => {
  fetchUsers()
})
</script>
