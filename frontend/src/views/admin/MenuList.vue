<template>
  <div class="p-6 lg:p-10">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Menu Configuration</h1>
          <p class="text-sm text-slate-500 mt-1">Manage system menus, routing components, visibility, and RBAC permissions.</p>
        </div>
        <button @click="openAddModal" class="inline-flex items-center self-start px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Menu Item
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

      <!-- Search Bar -->
      <div class="mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row md:items-center gap-4">
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
            placeholder="Search menus by display name or key..." 
          />
        </div>
        <span v-if="searchQuery" class="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-semibold self-start md:self-auto flex items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse"></span>
          Global Search Mode
        </span>
      </div>

      <!-- Menu Items Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Name</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Key</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Route Path</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hidden</th>
              <th scope="col" class="px-6 py-4 class-right text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="item in items" :key="item.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900 flex items-center">
                  <!-- Custom Icon or default folder/link -->
                  <svg v-if="item.type === 'directory'" class="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <svg v-else-if="item.is_external === 1" class="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <svg v-else class="h-5 w-5 text-slate-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ item.menu_name }}
                  <span v-if="searchQuery && item.parent_id" class="ml-2 inline-flex items-center text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-normal">
                    Parent ID: {{ item.parent_id }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600">
                {{ item.menu_key }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
                  'bg-blue-100 text-blue-800': item.type === 'directory',
                  'bg-indigo-100 text-indigo-800': item.type === 'menu',
                  'bg-amber-100 text-amber-800': item.type === 'button'
                }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent">
                  {{ item.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ item.is_external === 1 ? item.url : (item.path || '-') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="item.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ item.status === 1 ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ item.hidden === 1 ? 'Hidden' : 'Visible' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button v-if="item.type === 'directory' || item.type === 'menu'" @click="drillDown(item)" class="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">
                  View Children
                </button>
                <button @click="openEditModal(item)" class="text-slate-600 hover:text-slate-900 mr-4">Edit</button>
                <button @click="deleteItem(item.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-sm">
                No menus found under this directory level.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Menu Edit/Add Modal -->
    <div v-if="showModal" class="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="closeModal"></div>
      
      <!-- Modal Scroll Container -->
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0" @click.self="closeModal">
          <!-- Modal Content -->
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden transform transition-all text-left my-8">
            <form @submit.prevent="saveItem">
              <div class="px-6 py-6 sm:p-8">
                <h3 class="text-xl font-semibold text-slate-900 mb-1" id="modal-title">
                  {{ isEditing ? 'Edit Menu Item' : 'Add Menu Item' }}
                </h3>
                <p class="text-xs text-slate-400 mb-6">
                  Parent Menu Level: <span class="font-semibold text-slate-600">{{ currentParentName }}</span>
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Menu Name (Display)</label>
                    <input v-model="form.menu_name" type="text" required class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. System Audit" />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Menu Key (Unique Key)</label>
                    <input v-model="form.menu_key" type="text" required class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm font-mono" placeholder="e.g. system_audit" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Menu Type</label>
                    <select v-model="form.type" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option value="directory">Directory (Folder)</option>
                      <option value="menu">Menu (Page Link)</option>
                      <option value="button">Button (Action / Permission)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Sort Order (Weight)</label>
                    <input v-model.number="form.sort" type="number" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="0" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Is External Link?</label>
                    <select v-model.number="form.is_external" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option :value="0">No (Internal SPA Route)</option>
                      <option :value="1">Yes (External Link)</option>
                    </select>
                  </div>

                  <div v-if="form.is_external === 0">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Route Path</label>
                    <input v-model="form.path" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. /admin/audit" />
                  </div>

                  <div v-else>
                    <label class="block text-sm font-medium text-slate-700 mb-1">External URL</label>
                    <input v-model="form.url" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. https://google.com" />
                  </div>

                  <div v-if="form.is_external === 0">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Component Path</label>
                    <input v-model="form.component" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. ./views/admin/Audit.vue" />
                  </div>

                  <div class="icon-picker-container relative">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Icon Class</label>
                    <div class="relative">
                      <!-- Selected Icon Preview -->
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <i v-if="form.icon && (form.icon.startsWith('ri-') || form.icon.startsWith('bi-') || form.icon.startsWith('bi '))" :class="[form.icon, 'text-slate-500 text-lg']"></i>
                        <span v-else-if="form.icon" class="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">Built-in</span>
                        <svg v-else class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                      
                      <!-- Input field -->
                      <input 
                        v-model="form.icon" 
                        type="text" 
                        @focus="showIconDropdown = true"
                        class="w-full pl-12 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm font-mono" 
                        placeholder="Select or enter icon name" 
                      />
                      
                      <!-- Toggle Button -->
                      <button 
                        type="button"
                        @click="toggleIconDropdown"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <svg class="h-4 w-4 transition-transform duration-200" :class="showIconDropdown ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    <!-- Dropdown Panel -->
                    <div 
                      v-if="showIconDropdown" 
                      class="absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl p-3"
                    >
                      <!-- Search query -->
                      <div class="mb-2.5 relative">
                        <input 
                          v-model="iconSearchQuery" 
                          type="text" 
                          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500" 
                          placeholder="Search RemixIcon..." 
                        />
                        <button 
                          v-if="iconSearchQuery"
                          @click="iconSearchQuery = ''"
                          type="button" 
                          class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-semibold"
                        >
                          Clear
                        </button>
                      </div>

                      <!-- Icon Grid -->
                      <div class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 text-center bg-slate-50 rounded-lg border border-slate-100">
                        <!-- Option to clear icon -->
                        <button 
                          type="button"
                          @click="selectIcon('')"
                          class="flex flex-col items-center justify-center p-2 rounded-lg border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group min-h-[44px]"
                          title="No Icon"
                        >
                          <span class="text-slate-400 text-[10px] font-medium group-hover:text-slate-600">None</span>
                        </button>
                        
                        <button 
                          v-for="icon in filteredIcons" 
                          :key="icon.class"
                          type="button"
                          @click="selectIcon(icon.class)"
                          :class="form.icon === icon.class ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'"
                          class="flex flex-col items-center justify-center p-2 rounded-lg border transition-all min-h-[44px]"
                          :title="icon.name"
                        >
                          <i v-if="icon.class.startsWith('ri-') || icon.class.startsWith('bi-') || icon.class.startsWith('bi ')" :class="[icon.class, 'text-slate-700 text-lg hover:text-indigo-600']"></i>
                          <span v-else class="text-[9px] font-bold text-slate-500 tracking-tighter truncate max-w-full">{{ icon.name }}</span>
                        </button>
                      </div>
                      
                      <!-- Footer info / No icons found -->
                      <div class="mt-2.5 text-center text-[10px] text-slate-400 flex justify-between items-center border-t border-slate-100 pt-2 px-1">
                        <span>Showing {{ filteredIcons.length }} of {{ REMIX_ICONS.length }}</span>
                        <button type="button" @click="showIconDropdown = false" class="text-indigo-600 hover:text-indigo-800 font-semibold">Close</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Target</label>
                    <select v-model="form.target" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option value="_self">_self (Same window)</option>
                      <option value="_blank">_blank (New tab)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Permission Code</label>
                    <input v-model="form.permission" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. sys:audit:list" />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select v-model.number="form.status" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option :value="1">Enabled (Active)</option>
                      <option :value="0">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Hidden in Sidebar?</label>
                    <select v-model.number="form.hidden" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option :value="0">No (Show in Sidebar)</option>
                      <option :value="1">Yes (Hide in Sidebar)</option>
                    </select>
                  </div>

                  <div v-if="form.is_external === 0">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Redirect Path</label>
                    <input v-model="form.redirect" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. /admin/audit/list" />
                  </div>

                  <div v-if="form.is_external === 0">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Keep Alive (Cache)?</label>
                    <select v-model.number="form.keep_alive" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white text-sm">
                      <option :value="0">No Cache</option>
                      <option :value="1">Keep Alive Enabled</option>
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Custom CSS Class</label>
                    <input v-model="form.class_name" type="text" class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm" placeholder="e.g. text-indigo-400 font-bold" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface MenuItem {
  id: number
  menu_name: string
  menu_key: string
  parent_id: number
  path: string | null
  component: string | null
  type: string
  sort: number
  icon: string | null
  class_name: string | null
  url: string | null
  is_external: number
  target: string
  permission: string | null
  status: number
  hidden: number
  redirect: string | null
  keep_alive: number
  created_at: string
}

interface Crumb {
  id: number
  name: string
}

const items = ref<MenuItem[]>([])
const loading = ref(true)
const breadcrumbs = ref<Crumb[]>([])
const currentParentId = ref(0)

const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

const form = ref({
  id: '',
  menu_name: '',
  menu_key: '',
  path: '',
  component: '',
  type: 'menu',
  sort: 0,
  icon: '',
  class_name: '',
  url: '',
  is_external: 0,
  target: '_self',
  permission: '',
  status: 1,
  hidden: 0,
  redirect: '',
  keep_alive: 0
})

const currentParentName = computed(() => {
  if (breadcrumbs.value.length === 0) return 'Root (Top Level)'
  return breadcrumbs.value[breadcrumbs.value.length - 1].name
})

const searchQuery = ref('')

const fetchItems = async () => {
  loading.value = true
  const token = localStorage.getItem('adminToken')
  try {
    if (searchQuery.value.trim()) {
      // Fetch all items globally for search
      const res = await fetch('/api/menus', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const q = searchQuery.value.trim().toLowerCase()
        items.value = data.filter((item: MenuItem) => 
          item.menu_name.toLowerCase().includes(q) || 
          item.menu_key.toLowerCase().includes(q)
        )
      } else if (res.status === 401) {
        handleAuthError()
      }
    } else {
      // Fetch by parent_id
      const res = await fetch(`/api/menus?parentId=${currentParentId.value}`, {
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

// Watch search query changes with debounce
let searchTimeout: any = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchItems()
  }, 250)
})

const drillDown = (item: MenuItem) => {
  searchQuery.value = '' // Clear search query when drilling down
  breadcrumbs.value.push({ id: item.id, name: item.menu_name })
  currentParentId.value = item.id
  fetchItems()
}

const navigateToBreadcrumb = (idx: number) => {
  searchQuery.value = '' // Clear search query when changing breadcrumbs
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
    menu_name: '',
    menu_key: '',
    path: '',
    component: '',
    type: 'menu',
    sort: items.value.length + 1,
    icon: '',
    class_name: '',
    url: '',
    is_external: 0,
    target: '_self',
    permission: '',
    status: 1,
    hidden: 0,
    redirect: '',
    keep_alive: 0
  }
  showModal.value = true
}

const openEditModal = (item: MenuItem) => {
  isEditing.value = true
  form.value = {
    id: item.id.toString(),
    menu_name: item.menu_name,
    menu_key: item.menu_key,
    path: item.path || '',
    component: item.component || '',
    type: item.type,
    sort: item.sort,
    icon: item.icon || '',
    class_name: item.class_name || '',
    url: item.url || '',
    is_external: item.is_external,
    target: item.target,
    permission: item.permission || '',
    status: item.status,
    hidden: item.hidden,
    redirect: item.redirect || '',
    keep_alive: item.keep_alive
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
    const url = isEditing.value ? `/api/menus/${form.value.id}` : '/api/menus'
    const method = isEditing.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        menu_name: form.value.menu_name,
        menu_key: form.value.menu_key,
        parent_id: currentParentId.value,
        path: form.value.is_external === 0 ? (form.value.path || undefined) : undefined,
        component: form.value.is_external === 0 ? (form.value.component || undefined) : undefined,
        type: form.value.type,
        sort: form.value.sort,
        icon: form.value.icon || undefined,
        class_name: form.value.class_name || undefined,
        url: form.value.is_external === 1 ? (form.value.url || undefined) : undefined,
        is_external: form.value.is_external,
        target: form.value.target,
        permission: form.value.permission || undefined,
        status: form.value.status,
        hidden: form.value.hidden,
        redirect: form.value.is_external === 0 ? (form.value.redirect || undefined) : undefined,
        keep_alive: form.value.is_external === 0 ? form.value.keep_alive : 0
      })
    })

    if (res.ok) {
      closeModal()
      fetchItems()
      // Dispatch event to refresh sidebar in Layout.vue if any modifications occurred
      window.dispatchEvent(new CustomEvent('menus-updated'))
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      alert('Error: ' + (data.error || 'Failed to save menu'))
    }
  } catch (e) {
    console.error(e)
    alert('Network error')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (id: number) => {
  if (!confirm('Are you sure you want to delete this menu item? Doing so will also delete all submenus recursively.')) return

  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch(`/api/menus/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
      items.value = items.value.filter(i => i.id !== id)
      window.dispatchEvent(new CustomEvent('menus-updated'))
    } else if (res.status === 401) {
      handleAuthError()
    } else {
      const data = await res.json()
      alert('Failed to delete menu: ' + (data.error || 'Unknown error'))
    }
  } catch (e) {
    console.error(e)
    alert('Error connecting to server.')
  }
}

const handleAuthError = () => {
  alert('Session expired. Please log in again.')
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}

const REMIX_ICONS = [
  // System / General
  { name: 'Home', class: 'ri-home-line' },
  { name: 'Home Fill', class: 'ri-home-fill' },
  { name: 'Settings', class: 'ri-settings-3-line' },
  { name: 'Settings Fill', class: 'ri-settings-3-fill' },
  { name: 'Dashboard', class: 'ri-dashboard-line' },
  { name: 'Dashboard Fill', class: 'ri-dashboard-fill' },
  { name: 'Apps', class: 'ri-apps-2-line' },
  { name: 'Apps Fill', class: 'ri-apps-2-fill' },
  { name: 'Menu', class: 'ri-menu-line' },
  { name: 'Notification', class: 'ri-notification-3-line' },
  { name: 'Notification Fill', class: 'ri-notification-3-fill' },
  { name: 'Shield', class: 'ri-shield-keyhole-line' },
  { name: 'Shield Fill', class: 'ri-shield-keyhole-fill' },
  { name: 'Search', class: 'ri-search-line' },
  { name: 'Info', class: 'ri-information-line' },
  { name: 'Alert', class: 'ri-alert-line' },
  { name: 'Error Warning', class: 'ri-error-warning-line' },

  // Users
  { name: 'User', class: 'ri-user-line' },
  { name: 'User Fill', class: 'ri-user-fill' },
  { name: 'User Settings', class: 'ri-user-settings-line' },
  { name: 'Group', class: 'ri-group-line' },
  { name: 'Group Fill', class: 'ri-group-fill' },
  { name: 'Admin', class: 'ri-admin-line' },
  { name: 'Admin Fill', class: 'ri-admin-fill' },
  { name: 'Team', class: 'ri-team-line' },

  // Business & Commerce
  { name: 'Briefcase', class: 'ri-briefcase-line' },
  { name: 'Briefcase Fill', class: 'ri-briefcase-fill' },
  { name: 'Gift', class: 'ri-gift-line' },
  { name: 'Gift Fill', class: 'ri-gift-fill' },
  { name: 'Shopping Bag', class: 'ri-shopping-bag-3-line' },
  { name: 'Shopping Bag Fill', class: 'ri-shopping-bag-3-fill' },
  { name: 'Shopping Cart', class: 'ri-shopping-cart-2-line' },
  { name: 'Shopping Cart Fill', class: 'ri-shopping-cart-2-fill' },
  { name: 'Coupon', class: 'ri-coupon-line' },
  { name: 'Coupon Fill', class: 'ri-coupon-fill' },
  { name: 'Price Tag', class: 'ri-price-tag-3-line' },
  { name: 'Price Tag Fill', class: 'ri-price-tag-3-fill' },
  { name: 'Customer Service', class: 'ri-customer-service-2-line' },

  // Files & Folders
  { name: 'File', class: 'ri-file-line' },
  { name: 'File Text', class: 'ri-file-text-line' },
  { name: 'Folder', class: 'ri-folder-line' },
  { name: 'Folder Fill', class: 'ri-folder-fill' },
  { name: 'Folder Open', class: 'ri-folder-open-line' },
  { name: 'Book', class: 'ri-book-3-line' },
  { name: 'Pages', class: 'ri-pages-line' },
  { name: 'Pages Fill', class: 'ri-pages-fill' },

  // Actions / Editing
  { name: 'Pencil', class: 'ri-pencil-line' },
  { name: 'Pencil Fill', class: 'ri-pencil-fill' },
  { name: 'Edit', class: 'ri-edit-2-line' },
  { name: 'Edit Fill', class: 'ri-edit-2-fill' },
  { name: 'Delete', class: 'ri-delete-bin-6-line' },
  { name: 'Delete Fill', class: 'ri-delete-bin-6-fill' },
  { name: 'Add Circle', class: 'ri-add-circle-line' },
  { name: 'Filter', class: 'ri-filter-3-line' },
  { name: 'Filter Fill', class: 'ri-filter-3-fill' },
  { name: 'Funnel', class: 'ri-funnel-line' },
  { name: 'Eye', class: 'ri-eye-line' },
  { name: 'Eye Off', class: 'ri-eye-off-line' },
  { name: 'Lock', class: 'ri-lock-2-line' },
  { name: 'Lock Fill', class: 'ri-lock-2-fill' },
  { name: 'Unlock', class: 'ri-lock-unlock-line' },
  { name: 'Key', class: 'ri-key-2-line' },
  { name: 'Key Fill', class: 'ri-key-2-fill' },

  // Tech & Data
  { name: 'Database', class: 'ri-database-2-line' },
  { name: 'Database Fill', class: 'ri-database-2-fill' },
  { name: 'Line Chart', class: 'ri-line-chart-line' },
  { name: 'Bar Chart', class: 'ri-bar-chart-2-line' },
  { name: 'Pie Chart', class: 'ri-pie-chart-line' },
  { name: 'Server', class: 'ri-server-line' },
  { name: 'CPU', class: 'ri-cpu-line' },
  { name: 'Cloud', class: 'ri-cloud-line' },
  { name: 'Cloud Fill', class: 'ri-cloud-fill' },
  { name: 'Global', class: 'ri-global-line' },
  { name: 'Terminal', class: 'ri-terminal-box-line' },

  // Others
  { name: 'Link', class: 'ri-link' },
  { name: 'External Link', class: 'ri-external-link-line' },
  { name: 'Calendar', class: 'ri-calendar-todo-line' },
  { name: 'Time / Clock', class: 'ri-time-line' },
  { name: 'Heart', class: 'ri-heart-line' },
  { name: 'Heart Fill', class: 'ri-heart-fill' },
  { name: 'Star', class: 'ri-star-line' },
  { name: 'Star Fill', class: 'ri-star-fill' },
  { name: 'Send', class: 'ri-send-plane-line' },
  { name: 'Send Fill', class: 'ri-send-plane-fill' },
  { name: 'Mail', class: 'ri-mail-line' },
  { name: 'Mail Fill', class: 'ri-mail-fill' },
  { name: 'Code', class: 'ri-code-s-slash-line' },
  
  // Built-in list (simple names)
  { name: 'Pencil', class: 'pencil' },
  { name: 'Users', class: 'users' },
  { name: 'Dict', class: 'dict' },
  { name: 'Menu', class: 'menu' },
  { name: 'List', class: 'list' },
  { name: 'Cog', class: 'cog-6-tooth' },
  { name: 'Gift', class: 'gift' },
  { name: 'Funnel', class: 'funnel' }
]

const showIconDropdown = ref(false)
const iconSearchQuery = ref('')

const toggleIconDropdown = () => {
  showIconDropdown.value = !showIconDropdown.value
}

const selectIcon = (iconClass: string) => {
  form.value.icon = iconClass
  showIconDropdown.value = false
  iconSearchQuery.value = ''
}

const filteredIcons = computed(() => {
  const query = iconSearchQuery.value.trim().toLowerCase()
  if (!query) return REMIX_ICONS
  return REMIX_ICONS.filter(icon => 
    icon.name.toLowerCase().includes(query) || 
    icon.class.toLowerCase().includes(query)
  )
})

const closeDropdownOnOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.icon-picker-container')) {
    showIconDropdown.value = false
  }
}

onMounted(() => {
  fetchItems()
  document.addEventListener('click', closeDropdownOnOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnOutside)
})
</script>
