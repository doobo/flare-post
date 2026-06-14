<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header/Hero Section -->
    <div class="bg-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div class="max-w-5xl mx-auto py-12 px-6 sm:px-8 flex flex-col items-center text-center">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">
          Cloud Web Offers
        </h1>
        <p class="text-indigo-100 text-lg md:text-xl max-w-2xl mb-8">
          Find the best and latest deals on Virtual Machines, VPNs, and domains. Curated directly for you.
        </p>
        <div class="w-full max-w-2xl relative shadow-xl rounded-full">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery" 
            @input="searchPosts"
            type="text" 
            placeholder="Search for VM, VPN offers..." 
            class="w-full pl-12 pr-4 py-4 text-gray-900 border-0 rounded-full focus:ring-4 focus:ring-indigo-300 focus:outline-none transition-all shadow-sm bg-white/95 backdrop-blur-sm"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-5xl mx-auto py-10 px-6 sm:px-8">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="post in posts" :key="post.id" class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col transform hover:-translate-y-1">
          <div class="flex justify-between items-start mb-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 tracking-wide uppercase shadow-sm">
              {{ post.category }}
            </span>
            <span class="text-xs text-slate-400 font-medium">{{ new Date(post.created_at).toLocaleDateString() }}</span>
          </div>
          <router-link :to="'/post/' + post.id" class="block mb-3">
            <h2 class="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
              {{ post.title }}
            </h2>
          </router-link>
          <p class="text-slate-600 line-clamp-3 mb-6 flex-grow">
            {{ getPreviewText(post) }}
          </p>
          <div class="mt-auto">
            <router-link :to="'/post/' + post.id" class="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Read details 
              <svg class="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
        </div>
        
        <div v-if="posts.length === 0" class="col-span-full text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-slate-900 mb-1">No offers found</h3>
          <p class="text-slate-500">We couldn't find anything matching your search.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Post {
  id: number
  title: string
  content_md: string
  content_type?: string
  category: string
  created_at: string
}

const getPreviewText = (post: Post): string => {
  let text = post.content_md || ''
  if (post.content_type === 'richtext') {
    // Strip HTML tags
    text = text.replace(/<\/?[^>]+(>|$)/g, "")
  } else {
    // Strip markdown links [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Strip headers, bold, italics, code blocks, etc.
    text = text.replace(/[#*`_~]/g, '')
  }
  return text.trim()
}

const posts = ref<Post[]>([])
const loading = ref(true)
const searchQuery = ref('')

const fetchPosts = async (query = '') => {
  loading.value = true
  try {
    const res = await fetch(`/api/posts?q=${encodeURIComponent(query)}`)
    if (res.ok) {
      posts.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch posts', e)
  } finally {
    loading.value = false
  }
}

const searchPosts = () => {
  // Simple debounce could be added here
  fetchPosts(searchQuery.value)
}

onMounted(() => {
  fetchPosts()
})
</script>
