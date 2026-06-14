<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar Menu -->
    <div class="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
      <div class="p-6 flex items-center justify-center border-b border-slate-800">
        <h1 class="text-xl font-bold tracking-wider text-indigo-400">Admin Panel</h1>
      </div>
      <div class="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div v-for="menu in sideMenus" :key="menu.id" class="space-y-1">
          <!-- Folder / Directory or Menu with submenus -->
          <div v-if="menu.children && menu.children.length > 0">
            <!-- Directory Type (no route path): clicking item toggles fold -->
            <button 
              v-if="menu.type === 'directory' || !menu.path"
              @click="toggleMenu(menu.id)" 
              class="w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between text-sm"
            >
              <span class="flex items-center">
                <component :is="getIconComponent(menu.icon)" />
                {{ menu.menu_name }}
              </span>
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
            
            <!-- Menu Type with path and submenus: link navigates, chevron toggles fold -->
            <router-link 
              v-else
              :to="menu.path" 
              exact-active-class="bg-indigo-600 text-white" 
              class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between text-sm group"
            >
              <span class="flex items-center">
                <component :is="getIconComponent(menu.icon)" />
                {{ menu.menu_name }}
              </span>
              <button 
                @click.stop.prevent="toggleMenu(menu.id)" 
                class="p-1 rounded hover:bg-slate-700/50 transition-colors"
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
            
            <!-- Submenu Items -->
            <div v-show="openMenus[menu.id]" class="pl-4 mt-1 space-y-1 border-l border-slate-800 ml-4">
              <template v-for="sub in menu.children" :key="sub.id">
                <!-- External Sub Link -->
                <a 
                  v-if="sub.is_external === 1" 
                  :href="sub.url || '#'" 
                  :target="sub.target"
                  class="block px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center text-xs"
                >
                  <component :is="getIconComponent(sub.icon, true)" />
                  {{ sub.menu_name }}
                </a>
                <!-- Internal Sub Link -->
                <router-link 
                  v-else 
                  :to="sub.path || '/admin'" 
                  exact-active-class="bg-indigo-600/80 text-white font-medium" 
                  class="block px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center text-xs"
                >
                  <component :is="getIconComponent(sub.icon, true)" />
                  {{ sub.menu_name }}
                </router-link>
              </template>
            </div>
          </div>
          
          <!-- Flat item (No submenus) -->
          <template v-else>
            <!-- External Link -->
            <a 
              v-if="menu.is_external === 1" 
              :href="menu.url || '#'" 
              :target="menu.target"
              class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center text-sm"
            >
              <component :is="getIconComponent(menu.icon)" />
              {{ menu.menu_name }}
            </a>
            <!-- Internal Link -->
            <router-link 
              v-else 
              :to="menu.path || '/admin'" 
              exact-active-class="bg-indigo-600 text-white" 
              class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center text-sm"
            >
              <component :is="getIconComponent(menu.icon)" />
              {{ menu.menu_name }}
            </router-link>
          </template>
        </div>
      </div>
      <div class="p-4 border-t border-slate-800 space-y-2">
        <router-link to="/" class="block px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          View Site
        </router-link>
        <button @click="logout" class="w-full text-left px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors text-sm flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-auto h-screen">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, h } from 'vue'

const router = useRouter()

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

const toggleMenu = (id: number) => {
  openMenus.value[id] = !openMenus.value[id]
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

const getIconComponent = (iconName: string | null, isSub = false) => {
  return {
    render() {
      if (isSub && !iconName) {
        return h('span', {
          class: 'w-1.5 h-1.5 rounded-full bg-slate-500 mr-3.5 ml-1.5'
        })
      }

      const name = iconName || 'list'
      const sizeClass = isSub ? 'w-3.5 h-3.5 mr-2.5' : 'w-5 h-5 mr-3'

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

onMounted(() => {
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
  } else {
    fetchSideMenus()
  }
  window.addEventListener('menus-updated', fetchSideMenus)
})

onUnmounted(() => {
  window.removeEventListener('menus-updated', fetchSideMenus)
})

const logout = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}
</script>
