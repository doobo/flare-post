<template>
  <div class="p-6 overflow-y-auto h-full flex-1">
    <div class="w-full">
      <div class="mb-5 flex items-center gap-3 flex-wrap">
        <h1 class="text-xl font-bold text-slate-800">{{ t('admin_offers_title') }}</h1>
        <div class="flex-1"></div>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('admin_offers_search')"
            class="w-56 pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        
        <table v-else class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_offers_th_title') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_offers_th_category') }}</th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_offers_th_date') }}</th>
              <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('admin_offers_th_actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="post in filteredPosts" :key="post.id" class="hover:bg-slate-50 transition-colors">
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
                <a :href="'/post/' + post.id" target="_blank" class="text-indigo-600 hover:text-indigo-900 mr-4">{{ t('admin_offers_view') }}</a>
                <router-link :to="'/admin?id=' + post.id" class="text-indigo-600 hover:text-indigo-900 mr-4">{{ t('admin_offers_edit') }}</router-link>
                <button @click="deletePost(post.id)" class="text-red-600 hover:text-red-900">{{ t('admin_offers_delete') }}</button>
              </td>
            </tr>
            <tr v-if="filteredPosts.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-slate-500 text-sm">
                {{ searchQuery ? t('admin_offers_empty_search') : t('admin_offers_empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'
import { t } from '@/utils/i18n'

const router = useRouter()
const posts = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value
  const q = searchQuery.value.toLowerCase()
  return posts.value.filter(p =>
    (p.title && p.title.toLowerCase().includes(q)) ||
    (p.category && p.category.toLowerCase().includes(q))
  )
})

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
  if (!await showConfirm(t('admin_offers_delete_confirm'))) return

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
      localStorage.removeItem('adminToken')
      router.push('/admin/login')
    } else {
      showToast(t('admin_offers_delete_error'), 'error')
    }
  } catch (e) {
    console.error(e)
    showToast(t('admin_offers_network_error'), 'error')
  }
}

onMounted(() => {
  fetchPosts()
})
</script>
