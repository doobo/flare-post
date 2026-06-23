<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar Menu -->
    <div :class="isCollapsed ? 'w-20' : 'w-64'" class="bg-slate-900 text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out">
      <div :class="isCollapsed ? 'h-16 px-3 justify-center' : 'h-16 px-6'" class="flex items-center border-b border-slate-800">
        <h1 v-show="!isCollapsed" class="text-xl font-bold tracking-wider text-indigo-400 transition-all duration-300">{{ adminTitle }}</h1>
        <h1 v-show="isCollapsed" class="text-lg font-bold tracking-wider text-indigo-400 transition-all duration-300">{{ collapsedTitle }}</h1>
      </div>
      <div class="flex-1 py-6 space-y-1.5 overflow-y-auto transition-all duration-300" :class="isCollapsed ? 'px-2 no-scrollbar' : 'px-4'">
        <div v-for="menu in sideMenus" :key="menu.id" class="space-y-1">
          <!-- Folder / Directory or Menu with submenus -->
          <div v-if="menu.children && menu.children.length > 0">
            <!-- Directory Type (no route path): clicking item toggles fold -->
            <div class="relative group/tooltip">
              <button 
                v-if="menu.type === 'directory' || !menu.path"
                @click="toggleMenu(menu.id)" 
                :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-4'"
                class="w-full text-left py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-sm cursor-pointer"
              >
                <span class="flex items-center">
                  <component :is="getIconComponent(menu.icon, false, isCollapsed)" />
                  <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ menu.menu_name }}</span>
                </span>
                <svg 
                  v-show="!isCollapsed"
                  :class="openMenus[menu.id] ? 'rotate-90' : ''" 
                  class="w-4 h-4 text-slate-400 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <!-- Menu Type with path and submenus: link navigates, chevron toggles fold -->
              <router-link 
                v-else
                :to="menu.path" 
                exact-active-class="bg-indigo-600 text-white" 
                :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-4'"
                class="block py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-sm group"
              >
                <span class="flex items-center">
                  <component :is="getIconComponent(menu.icon, false, isCollapsed)" />
                  <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ menu.menu_name }}</span>
                </span>
                <button 
                  v-show="!isCollapsed"
                  @click.stop.prevent="toggleMenu(menu.id)" 
                  class="p-1 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <svg 
                    :class="openMenus[menu.id] ? 'rotate-90' : ''" 
                    class="w-4 h-4 text-slate-400 transition-transform duration-200" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </router-link>

              <!-- Tooltip for parent menu -->
              <div v-if="isCollapsed" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-950 text-xs text-white rounded hidden group-hover/tooltip:block whitespace-nowrap z-50 shadow-lg">
                {{ menu.menu_name }}
              </div>
            </div>
            
            <!-- Submenu Items -->
            <div v-show="openMenus[menu.id]" :class="isCollapsed ? 'pl-0 ml-0 border-none' : 'pl-4 border-l border-slate-800 ml-4'" class="mt-1 space-y-1 transition-all duration-300">
              <template v-for="sub in menu.children" :key="sub.id">
                <!-- External Sub Link -->
                <div class="relative group/tooltip">
                  <a 
                    v-if="sub.is_external === 1" 
                    :href="sub.url || '#'" 
                    :target="sub.target"
                    :class="isCollapsed ? 'justify-center px-2' : 'px-4'"
                    class="block py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-xs"
                  >
                    <component :is="getIconComponent(sub.icon, true, isCollapsed)" />
                    <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ sub.menu_name }}</span>
                  </a>
                  <!-- Internal Sub Link -->
                  <router-link 
                    v-else 
                    :to="sub.path || '/admin'" 
                    exact-active-class="bg-indigo-600/80 text-white font-medium" 
                    :class="isCollapsed ? 'justify-center px-2' : 'px-4'"
                    class="block py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-xs"
                  >
                    <component :is="getIconComponent(sub.icon, true, isCollapsed)" />
                    <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ sub.menu_name }}</span>
                  </router-link>

                  <!-- Tooltip for submenu -->
                  <div v-if="isCollapsed" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-950 text-xs text-white rounded hidden group-hover/tooltip:block whitespace-nowrap z-50 shadow-lg">
                    {{ sub.menu_name }}
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Flat item (No submenus) -->
          <template v-else>
            <!-- External Link -->
            <div class="relative group/tooltip">
              <a 
                v-if="menu.is_external === 1" 
                :href="menu.url || '#'" 
                :target="menu.target"
                :class="isCollapsed ? 'justify-center px-2' : 'px-4'"
                class="block py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-sm"
              >
                <component :is="getIconComponent(menu.icon, false, isCollapsed)" />
                <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ menu.menu_name }}</span>
              </a>
              <!-- Internal Link -->
              <router-link 
                v-else 
                :to="menu.path || '/admin'" 
                exact-active-class="bg-indigo-600 text-white" 
                :class="isCollapsed ? 'justify-center px-2' : 'px-4'"
                class="block py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 flex items-center text-sm"
              >
                <component :is="getIconComponent(menu.icon, false, isCollapsed)" />
                <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ menu.menu_name }}</span>
              </router-link>

              <!-- Tooltip for flat item -->
              <div v-if="isCollapsed" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-950 text-xs text-white rounded hidden group-hover/tooltip:block whitespace-nowrap z-50 shadow-lg">
                {{ menu.menu_name }}
              </div>
            </div>
          </template>
        </div>
      </div>
      
      <!-- Footer Buttons -->
      <div :class="isCollapsed ? 'px-2 py-4' : 'p-4'" class="border-t border-slate-800 space-y-2 transition-all duration-300">
        <div class="relative group/tooltip">
          <router-link to="/" :class="isCollapsed ? 'justify-center px-2' : 'px-4'" class="block py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-300 text-sm flex items-center">
            <svg :class="isCollapsed ? 'mr-0' : 'mr-2'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ t('admin_view_site') }}</span>
          </router-link>
          <!-- Tooltip for View Site -->
          <div v-if="isCollapsed" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-950 text-xs text-white rounded hidden group-hover/tooltip:block whitespace-nowrap z-50 shadow-lg">
            {{ t('admin_view_site') }}
          </div>
        </div>
        
        <div class="relative group/tooltip">
          <button @click="logout" :class="isCollapsed ? 'justify-center px-2' : 'px-4'" class="w-full text-left py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-slate-800 transition-all duration-300 text-sm flex items-center cursor-pointer">
            <svg :class="isCollapsed ? 'mr-0' : 'mr-2'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span v-show="!isCollapsed" class="transition-opacity duration-300">{{ t('admin_logout') }}</span>
          </button>
          <!-- Tooltip for Logout -->
          <div v-if="isCollapsed" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-950 text-xs text-white rounded hidden group-hover/tooltip:block whitespace-nowrap z-50 shadow-lg">
            {{ t('admin_logout') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area Wrapper -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Top Navigation Bar -->
      <header class="bg-white border-b border-slate-100 h-16 flex items-center justify-between pl-0 pr-6 shrink-0 shadow-sm z-10">
        <!-- Left: Page Title / Breadcrumb -->
        <div class="flex items-center space-x-4">
          <button @click="toggleSidebar" class="p-1 rounded cursor-pointer" :title="isCollapsed ? t('admin_expand_sidebar') : t('admin_collapse_sidebar')">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'" />
            </svg>
          </button>
          <div class="flex items-center space-x-2 text-sm text-slate-500">
            <span class="font-bold text-slate-800 text-base">{{ currentMenuName }}</span>
          </div>
        </div>

        <!-- Right: User Profile & Quick Logout -->
        <div class="flex items-center space-x-4">
          <div v-if="userInfo" class="flex items-center space-x-3 border-r border-slate-100 pr-4">
            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {{ userInfo.username.charAt(0).toUpperCase() }}
            </div>
            <div class="text-left hidden sm:block">
              <div class="text-xs font-semibold text-slate-700">{{ userInfo.username }}</div>
              <div class="text-[10px] text-slate-400">{{ userInfo.email || t('admin_no_email') }}</div>
            </div>
          </div>
          <button @click="toggleFullscreen" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer" :title="isFullscreen ? t('admin_exit_fullscreen') : t('admin_fullscreen')">
            <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8V3m0 0h5M3 3l6 6m12 0V3m0 0h-5m5 0l-6 6M3 16v5m0 0h5m-5 0l6-6m12 5v-5m0 5h-5m5 0l-6-6" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V3m0 0L3 9m6-6l6 6m0 0v6m0 0l6-6m-6 6H9" />
            </svg>
          </button>
          <button @click="logout" class="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" :title="t('admin_logout')">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Multi-route Tab History Bar -->
      <div v-if="tabs.length > 0" class="bg-white border-b border-slate-200 px-6 py-2 flex items-center overflow-x-auto gap-2 shrink-0 no-scrollbar">
        <div 
          v-for="tab in tabs" 
          :key="tab.path"
          :class="activeTabPath === tab.path ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'"
          class="flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all duration-200 select-none group"
          @click="router.push(tab.path)"
        >
          <span>{{ tab.name }}</span>
          <button 
            @click.stop="closeTab(tab.path)"
            class="text-slate-400 hover:text-red-500 rounded p-0.5 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable Main Content -->
      <main class="flex-1 overflow-hidden bg-slate-50 flex flex-col">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, h, computed, watch } from 'vue'
import { t } from '@/utils/i18n'

const router = useRouter()
const route = useRoute()

interface SideMenu {
  id: number
  menu_name: string
  menu_key: string
  parent_id: number
  path: string | null
  icon: string | null
  is_external: number
  url: string | null
  target: string
  type: string
  children?: SideMenu[]
}

const sideMenus = ref<SideMenu[]>([])
const openMenus = ref<Record<number, boolean>>({})
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')

interface UserInfo {
  id: number
  username: string
  email: string
  role: string
}
const userInfo = ref<UserInfo | null>(null)
const isFullscreen = ref(false)

const adminTitle = ref('Admin Panel')
const collapsedTitle = computed(() => {
  if (!adminTitle.value) return 'AP'
  const words = adminTitle.value.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words.map(w => w[0]).join('').substring(0, 3).toUpperCase()
})

const activeTabPath = ref('/admin')
interface TabItem {
  name: string
  path: string
}
const tabs = ref<TabItem[]>([])

const menuPathMap: Record<string, string> = {}

const addTab = (toRoute: any) => {
  const path = toRoute.path
  if (!path.startsWith('/admin') || path === '/admin/login') return
  
  let name = menuPathMap[path] || toRoute.meta?.title || t('admin_tab_page')

  const exists = tabs.value.some(t => t.path === path)
  if (!exists) {
    tabs.value.push({ name, path })
  }
  activeTabPath.value = path
}

const closeTab = (path: string) => {
  const index = tabs.value.findIndex(t => t.path === path)
  if (index === -1) return
  
  tabs.value.splice(index, 1)
  
  if (activeTabPath.value === path) {
    if (tabs.value.length > 0) {
      const newActiveIndex = Math.max(0, index - 1)
      router.push(tabs.value[newActiveIndex].path)
    } else {
      router.push('/admin')
    }
  }
}

watch(() => route.path, () => {
  addTab(route)
}, { immediate: true })

const currentMenuName = computed(() => {
  const path = route.path
  return menuPathMap[path] || t('admin_cur_dashboard')
})

const toggleMenu = (id: number) => {
  openMenus.value[id] = !openMenus.value[id]
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebar-collapsed', String(isCollapsed.value))
}

const buildMenuTree = (menus: any[], parentId: number): any[] => {
  return menus
    .filter((m: any) => m.parent_id === parentId)
    .map((m: any) => ({
      ...m,
      children: buildMenuTree(menus, m.id)
    }))
    .sort((a: any, b: any) => a.sort - b.sort)
}

const fetchAdminTitle = async () => {
  const token = localStorage.getItem('adminToken')
  if (!token) return
  try {
    const res = await fetch('/api/dictionaries', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      const titleItem = data.find((item: any) => item.code === 'admin_title')
      if (titleItem && titleItem.value) {
        adminTitle.value = titleItem.value
      }
    }
  } catch (e) {
    console.error('Failed to load admin title:', e)
  }
}

const fetchSideMenus = async () => {
  const token = localStorage.getItem('adminToken')
  if (!token) return
  
  try {
    const res = await fetch('/api/menus?activeOnly=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      const visibleMenus = data.filter((m: any) => m.hidden === 0)
      const tree = buildMenuTree(visibleMenus, 0)
      sideMenus.value = tree

      // Build path -> menu_name lookup for tab names
      data.forEach((m: any) => {
        if (m.path) menuPathMap[m.path] = m.menu_name
      })

      // Update existing tab name if it was set before menus loaded
      const activePath = router.currentRoute.value.path
      const tab = tabs.value.find(t => t.path === activePath)
      if (tab && menuPathMap[activePath]) {
        tab.name = menuPathMap[activePath]
      }

      // Auto-expand directories containing active routes
      const currentPath = router.currentRoute.value.path
      tree.forEach((menu) => {
        if (menu.children && menu.children.some((sub: any) => sub.path === currentPath)) {
          openMenus.value[menu.id] = true
        }
      })
    }
  } catch (e) {
    console.error('Failed to load side menus:', e)
  }
}

const getIconComponent = (iconName: string | null, isSub = false, collapsed = false) => {
  return {
    render() {
      if (isSub && !iconName) {
        return h('span', {
          class: `w-1.5 h-1.5 rounded-full bg-slate-500 ${collapsed ? 'mr-0' : 'mr-3.5 ml-1.5'}`
        })
      }

      const name = iconName || 'list'
      const sizeClass = isSub 
        ? `w-3.5 h-3.5 ${collapsed ? 'mr-0' : 'mr-2.5'}` 
        : `w-5 h-5 ${collapsed ? 'mr-0' : 'mr-3'}`

      // Pre-defined SVG icons
      const svgMap: Record<string, string[]> = {
        pencil: ["M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"],
        users: ["M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
        dict: ["M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"],
        menu: ["M4 6h16M4 12h16M4 18h16"],
        list: ["M4 6h16M4 10h16M4 14h16M4 18h16"],
        cog: [
          "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.214-.47a1.125 1.125 0 0 1 1.33.35l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .274c-.008.38.137.751.43.992l1.003.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.329.35l-1.214-.47c-.356-.138-.75-.074-1.075.124-.073.044-.146.087-.22.127-.332.183-.582.495-.644.869l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.214.47a1.125 1.125 0 0 1-1.33-.35L3.905 15.25a1.125 1.125 0 0 1 .26-1.431l1.003-.827c.293-.241.438-.613.43-.992a7.723 7.723 0 0 1 0-.274c.008-.38-.137-.751-.43-.992l-1.003-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.33-.35l1.214.47c.356.138.75.074 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.644-.869l.213-1.281Z",
          "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        ],
        "cog-6-tooth": [
          "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.214-.47a1.125 1.125 0 0 1 1.33.35l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .274c-.008.38.137.751.43.992l1.003.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.329.35l-1.214-.47c-.356-.138-.75-.074-1.075.124-.073.044-.146.087-.22.127-.332.183-.582.495-.644.869l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.214.47a1.125 1.125 0 0 1-1.33-.35L3.905 15.25a1.125 1.125 0 0 1 .26-1.431l1.003-.827c.293-.241.438-.613.43-.992a7.723 7.723 0 0 1 0-.274c.008-.38-.137-.751-.43-.992l-1.003-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.33-.35l1.214.47c.356.138.75.074 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.644-.869l.213-1.281Z",
          "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        ],
        gift: [
          "M12 3.75v16.5M2.25 12h19.5M6.375 17.25a4.875 4.875 0 004.875-4.875V12m6.375 5.25a4.875 4.875 0 01-4.875-4.875V12m-9 8.25h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5z"
        ],
        funnel: [
          "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3z"
        ]
      }

      if (svgMap[name]) {
        return h('svg', {
          class: `${sizeClass} flex-shrink-0 text-slate-400 group-hover:text-white`,
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          style: { 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
        }, svgMap[name].map(d => h('path', { d })))
      }

      // Otherwise, assume it's a CSS class-based icon (e.g. "ri-settings-3-line", "bi-gear-fill")
      return h('i', {
        class: `${name} ${sizeClass} flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:text-white text-base`
      })
    }
  }
}

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const fetchUserInfo = async () => {
  const token = localStorage.getItem('adminToken')
  if (!token) return
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        userInfo.value = data.user
      }
    }
  } catch (e) {
    console.error('Failed to load user info:', e)
  }
}

onMounted(() => {
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
  } else {
    fetchAdminTitle()
    fetchSideMenus()
    fetchUserInfo()
  }
  window.addEventListener('menus-updated', fetchSideMenus)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  window.removeEventListener('menus-updated', fetchSideMenus)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

const logout = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
