<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-4">
      <router-link to="/" class="text-blue-500 hover:underline">&larr; Back to Home</router-link>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Loading...</div>
    <div v-else-if="!post" class="text-center py-8 text-red-500">Post not found.</div>
    <div v-else class="bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-4xl font-bold mb-4">{{ post.title }}</h1>
      <div class="flex items-center text-sm text-gray-500 mb-8 border-b pb-4">
        <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium mr-4">{{ post.category }}</span>
        <span>{{ new Date(post.created_at).toLocaleDateString() }}</span>
      </div>
      
      <!-- Content -->
      <div class="prose prose-blue max-w-none" v-html="renderMarkdown(post.content_md)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const md = new MarkdownIt({ linkify: true, breaks: true })

// Customize markdown renderer to open links in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, _env, self) {
  const aIndex = tokens[idx].attrIndex('target');
  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']);
  } else {
    // @ts-ignore
    tokens[idx].attrs[aIndex][1] = '_blank';
  }
  return defaultRender(tokens, idx, options, _env, self);
};


interface Post {
  id: number
  title: string
  content_md: string
  category: string
  created_at: string
}

const post = ref<Post | null>(null)
const loading = ref(true)

const fetchPost = async () => {
  try {
    const res = await fetch(`/api/posts/${route.params.id}`)
    if (res.ok) {
      post.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const renderMarkdown = (content: string) => {
  return md.render(content)
}

onMounted(() => {
  fetchPost()
})
</script>
