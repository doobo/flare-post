<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      <router-link to="/" class="text-blue-500 hover:underline">View Site</router-link>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 class="text-xl font-semibold mb-4">Post New Offer</h2>
      <form @submit.prevent="submitPost" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input v-model="form.title" type="text" required class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <input v-model="form.password" type="password" required placeholder="Default is admin123" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="form.category" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="VM">VM</option>
              <option value="VPN">VPN</option>
              <option value="Domain">Domain</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input v-model="form.tags" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
          <div class="flex gap-4">
            <textarea v-model="form.content_md" required rows="10" class="w-1/2 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" placeholder="Write markdown here... Use [Link](external_url) and it will be converted."></textarea>
            <div class="w-1/2 p-4 border border-gray-200 rounded bg-gray-50 overflow-auto prose" v-html="previewMarkdown"></div>
          </div>
        </div>

        <button type="submit" :disabled="submitting" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50">
          {{ submitting ? 'Publishing...' : 'Publish Post' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

const form = ref({
  title: '',
  password: '',
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
  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-token': form.value.password
      },
      body: JSON.stringify(form.value)
    })
    
    if (res.ok) {
      alert('Post published successfully!')
      form.value = { ...form.value, title: '', tags: '', content_md: '' }
    } else {
      const data = await res.json()
      alert('Failed to publish post: ' + (data.error || 'Unknown error'))
    }
  } catch (e) {
    console.error(e)
    alert('Error publishing post.')
  } finally {
    submitting.value = false
  }
}
</script>
