<template>
  <div class="p-6 lg:p-10">
    <div class="max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Manage Offers</h1>
        <p class="text-sm text-slate-500 mt-1">View, edit, or remove published offers.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="post in posts" :key="post.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900">{{ post.title }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {{ post.category }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ new Date(post.created_at).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a :href="'/post/' + post.id" target="_blank" class="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                <router-link :to="'/admin?id=' + post.id" class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</router-link>
                <button @click="deletePost(post.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
            <tr v-if="posts.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500 text-sm">
                No offers found. Start by publishing a new offer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'

const router = useRouter()
const posts = ref<any[]>([])
const loading = ref(true)

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/posts')
    if (res.ok) {
      posts.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const deletePost = async (id: number) => {
  if (!confirm('Are you sure you want to delete this offer?')) return

  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
    return
  }

  try {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (res.ok) {
      posts.value = posts.value.filter(p => p.id !== id)
    } else if (res.status === 401) {
      showToast('Session expired. Please log in again.', 'error')
      localStorage.removeItem('adminToken')
      router.push('/admin/login')
    } else {
      showToast('Failed to delete post.', 'error')
    }
  } catch (e) {
    console.error(e)
    showToast('Error connecting to server.', 'error')
  }
}

onMounted(() => {
  fetchPosts()
})
</script>
