<template>
  <div class="p-6">
    <div class="w-full">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Dictionary Configuration</h1>
          <p class="text-sm text-slate-500 mt-1">Manage common site configs, categories, and options with nested structure.</p>
        </div>
        <button @click="openAddModal" class="inline-flex items-center self-start px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <!-- Breadcrumbs Path -->
      <nav class="flex items-center space-x-2 text-sm text-slate-600 mb-6 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200/50">
        <button @click="navigateToBreadcrumb(-1)" class="hover:text-indigo-600 font-medium transition-colors flex items-center">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Root
        </button>
        <template v-for="(crumb, idx) in breadcrumbs" :key="crumb.id">
          <svg class="h-5 w-5 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          <button 
            @click="navigateToBreadcrumb(idx)" 
            :disabled="idx === breadcrumbs.length - 1"
            class="hover:text-indigo-600 font-medium transition-colors disabled:hover:text-slate-600 disabled:opacity-90"
          >
            {{ crumb.name }}
          </button>
        </template>
      </nav>

      <!-- Search & Filters Bar -->
      <div class="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center gap-4">
        <!-- Text Search -->
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="w-full pl-10 pr-4 py-2 border border-slate-250 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" 
            placeholder="Search dictionaries by name or code..." 
          />
        </div>
        
        <!-- Type Filter -->
        <div class="w-full md:w-48">
          <select 
            v-model="filterType" 
            class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
          >
            <option value="">All Types</option>
            <option value="normal">Normal (Plaintext)</option>
            <option value="encode">Encode (Encrypted)</option>
          </select>
        </div>

        <!-- Mode Indicator -->
        <span v-if="searchQuery || filterType" class="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-full font-semibold self-start md:self-auto flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse"></span>
          Filters Active
        </span>
      </div>

      <!-- Dictionary Items Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sort Order</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
              <th scope="col" class="px-6 py-4 class-right text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900 flex items-center">
                  <!-- Folder icon if item can be a parent -->
                  <svg class="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {{ item.name }}
                  <span v-if="(searchQuery || filterType) && item.parent_id" class="ml-2 inline-flex items-center text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-normal">
                    Parent ID: {{ item.parent_id }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                {{ item.code }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="item.type === 'encode' ? 'bg-amber-100 text-amber-800 border border-amber-200/50' : 'bg-slate-100 text-slate-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ item.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ item.value || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ item.sort_order }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                {{ item.description || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="drillDown(item)" class="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">
                  View Children
                </button>
                <button @click="openEditModal(item)" class="text-slate-600 hover:text-slate-900 mr-4">Edit</button>
                <button @click="deleteItem(item.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-sm">
                No configuration items found under this level.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dict Modal -->
    <div v-if="showModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
      
      <!-- Modal Scroll Container -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0" @click.self="closeModal">
          <!-- Modal Content -->
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all text-left my-8">
            <form @submit.prevent="saveItem">
              <div class="px-6 py-6 sm:p-8">
                <h3 class="text-xl font-semibold text-slate-900 mb-1" id="modal-title">
                  {{ isEditing ? 'Edit Config' : 'Add Config Item' }}
                </h3>
                <p class="text-xs text-slate-400 mb-6">
                  Adding to: <span class="font-semibold text-slate-600">{{ currentParentName }}</span>
                </p>
                
                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Name / Label</label>
                    <input v-model="form.name" type="text" required class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. Category Name" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Code / Key</label>
                    <input v-model="form.code" type="text" required class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm font-mono" placeholder="e.g. POST_CATEGORY" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <div class="relative">
                      <select v-model="form.type" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-shadow bg-white text-sm">
                        <option value="normal">Normal (Plaintext)</option>
                        <option value="encode">Encode (Encrypted)</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Value (Optional)</label>
                    <input v-model="form.value" type="text" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. tech-news" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                    <input v-model.number="form.sort_order" type="number" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="0" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea v-model="form.description" rows="3" class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="Details about this item..."></textarea>
                  </div>
                </div>
              </div>
              
              <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" @click="closeModal" class="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 text-sm">
                  Cancel
                </button>
                <button type="submit" :disabled="saving" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 flex items-center justify-center text-sm">
                  <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ saving ? 'Saving...' : 'Save Item' }}
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'

const router = useRouter()

interface DictItem {
  id: number
  name: string
  code: string
  value: string | null
  type: string
  parent_id: number
  sort_order: number
  description: string | null
  created_at: string
}

interface Crumb {
  id: number
  name: string
}

const items = ref<DictItem[]>([])
const loading = ref(true)
const breadcrumbs = ref<Crumb[]>([])
const currentParentId = ref(0)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const form = ref({
  id: '',
  name: '',
  code: '',
  value: '',
  type: 'normal',
  sort_order: 0,
  description: ''
})

const currentParentName = computed(() => {
  if (breadcrumbs.value.length === 0) return 'Root (Top Level)'
  return breadcrumbs.value[breadcrumbs.value.length - 1].name
})

const searchQuery = ref('')
const filterType = ref('')

const fetchItems = async () => {
  loading.value = true
  const token = localStorage.getItem('adminToken')
  try {
    if (searchQuery.value.trim() || filterType.value) {
      // Fetch all dictionaries globally to filter
      const res = await fetch('/api/dictionaries', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const q = searchQuery.value.trim().toLowerCase()
        const typeFilter = filterType.value

        items.value = data.filter((item: DictItem) => {
          const matchesQuery = !q || 
            item.name.toLowerCase().includes(q) || 
            item.code.toLowerCase().includes(q)
            
          const matchesType = !typeFilter || item.type === typeFilter
          
          return matchesQuery && matchesType
        })
      } else if (res.status === 401) {
        handleAuthError()
      }
    } else {
      // Fetch by parent_id
      const res = await fetch(`/api/dictionaries?parentId=${currentParentId.value}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        items.value = await res.json()
      } else if (res.status === 401) {
        handleAuthError()
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Watch filters with debounce
let searchTimeout: any = null
watch([searchQuery, filterType], () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchItems()
  }, 250)
})

const drillDown = (item: DictItem) => {
  searchQuery.value = ''
  filterType.value = ''
  breadcrumbs.value.push({ id: item.id, name: item.name })
  currentParentId.value = item.id
  fetchItems()
}

const navigateToBreadcrumb = (idx: number) => {
  searchQuery.value = ''
  filterType.value = ''
  if (idx === -1) {
    breadcrumbs.value = []
    currentParentId.value = 0
  } else {
    breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1)
    currentParentId.value = breadcrumbs.value[idx].id
  }
  fetchItems()
}

const openAddModal = () => {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    code: '',
    value: '',
    type: 'normal',
    sort_order: 0,
    description: ''
  }
  showModal.value = true
}

const openEditModal = (item: DictItem) => {
  isEditing.value = true
  form.value = {
    id: item.id.toString(),
    name: item.name,
    code: item.code,
    value: item.value || '',
    type: item.type,
    sort_order: item.sort_order,
    description: item.description || ''
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
    const url = isEditing.value ? `/api/dictionaries/${form.value.id}` : '/api/dictionaries'
    const method = isEditing.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: form.value.name,
        code: form.value.code,
        value: form.value.value || undefined,
        type: form.value.type,
        parent_id: currentParentId.value,
        sort_order: form.value.sort_order,
        description: form.value.description || undefined
      })
    })

    if (res.ok) {
      closeModal()
      fetchItems()
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      showToast('Error: ' + (data.error || 'Failed to save item'), 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('Network error', 'error')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id: number) => {
  if (!await showConfirm('Are you sure you want to delete this configuration item? Doing so will also delete all of its children.')) return

  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/dictionaries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      items.value = items.value.filter(i => i.id !== id)
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      showToast('Failed to delete item: ' + (data.error || 'Unknown error'), 'error')
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
  fetchItems()
})
</script>
