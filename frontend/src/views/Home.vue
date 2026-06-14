<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold mb-8 text-center text-blue-600">Cloud Web Offers</h1>
    
    <div class="mb-8">
      <input 
        v-model="searchQuery" 
        @input="searchPosts"
        type="text" 
        placeholder="Search for VM, VPN offers..." 
        class="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div v-if="loading" class="text-center py-4">Loading...</div>

    <div v-else class="space-y-6">
      <div v-for="post in posts" :key="post.id" class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <router-link :to="'/post/' + post.id" class="block">
          <h2 class="text-2xl font-semibold mb-2 text-gray-800 hover:text-blue-600 transition-colors">{{ post.title }}</h2>
        </router-link>
        <div class="text-sm text-gray-500 mb-4">
          <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">{{ post.category }}</span>
          <span>{{ new Date(post.created_at).toLocaleDateString() }}</span>
        </div>
        <p class="text-gray-600 line-clamp-3">{{ post.content_md.replace(/[#*`_]/g, '') }}</p>
        <router-link :to="'/post/' + post.id" class="inline-block mt-4 text-blue-500 hover:underline text-sm font-medium">Read details &rarr;</router-link>
      </div>
      <div v-if="posts.length === 0" class="text-center py-4 text-gray-500">
        No offers found.
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
  category: string
  created_at: string
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
