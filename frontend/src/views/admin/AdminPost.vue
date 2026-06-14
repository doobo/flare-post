<template>
  <div class="p-6 lg:p-10">
    <div class="max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Publish New Offer</h1>
        <p class="text-sm text-slate-500 mt-1">Create and publish a new discount or offer.</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 sm:p-8">
          <form @submit.prevent="submitPost" class="space-y-6">
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input v-model="form.title" type="text" required class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" placeholder="e.g. 50% Off VPS Hosting" />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <div class="relative">
                  <select v-model="form.category" class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-shadow bg-white">
                    <option value="VM">VM</option>
                    <option value="VPN">VPN</option>
                    <option value="Domain">Domain</option>
                    <option value="Other">Other</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input v-model="form.tags" type="text" class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" placeholder="e.g. kvm, cheap, us" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>Content (Markdown)</span>
                <span class="text-xs text-slate-400 font-normal">Use [Link Name](https://...) to automatically create internal shortlinks</span>
              </label>
              <div class="flex flex-col lg:flex-row gap-6 h-[500px]">
                <textarea v-model="form.content_md" required class="w-full lg:w-1/2 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm resize-none bg-slate-50/50" placeholder="Write your markdown here..."></textarea>
                <div class="w-full lg:w-1/2 p-6 border border-slate-200 rounded-xl bg-white overflow-auto prose prose-indigo max-w-none shadow-inner" v-html="previewMarkdown"></div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" :disabled="submitting" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ submitting ? 'Publishing...' : 'Publish Post' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'

const router = useRouter()
const md = new MarkdownIt()

const form = ref({
  title: '',
  category: 'VM',
  tags: '',
  content_md: ''
})

const submitting = ref(false)

const previewMarkdown = computed(() => {
  return md.render(form.value.content_md || '*Preview will appear here*')
})

const submitPost = async () => {
  submitting.value = true
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
    return
  }

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    
    if (res.ok) {
      alert('Post published successfully!')
      form.value = { ...form.value, title: '', tags: '', content_md: '' }
    } else {
      const data = await res.json()
      if (res.status === 401) {
        alert('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        alert('Failed to publish post: ' + (data.error || 'Unknown error'))
      }
    }
  } catch (e) {
    console.error(e)
    alert('Error publishing post.')
  } finally {
    submitting.value = false
  }
}
</script>
