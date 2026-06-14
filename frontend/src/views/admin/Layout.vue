<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar Menu -->
    <div class="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
      <div class="p-6 flex items-center justify-center border-b border-slate-800">
        <h1 class="text-xl font-bold tracking-wider text-indigo-400">Admin Panel</h1>
      </div>
      <div class="flex-1 py-6 px-4 space-y-2">
        <router-link to="/admin" exact-active-class="bg-indigo-600 text-white" class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center">
          <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Publish Offer
        </router-link>
        <router-link to="/admin/list" active-class="bg-indigo-600 text-white" class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center">
          <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Manage Offers
        </router-link>
        <router-link to="/admin/users" active-class="bg-indigo-600 text-white" class="block px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center">
          <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Manage Users
        </router-link>
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
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
  }
})

const logout = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}
</script>
