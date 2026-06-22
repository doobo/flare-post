<template>
  <div class="min-h-screen bg-slate-50">
    <NavBar
      :categoriesTree="categoriesTree"
      :activeParent="''"
      :searchQuery="searchQuery"
      @update:searchQuery="onSearch"
      @selectParentCategory="onSelectCategory"
    />
    <div class="max-w-4xl mx-auto pt-16 px-3 sm:px-5 lg:px-6 pb-24">

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
      <div v-else-if="!post" class="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900">{{ t('detail_not_found') }}</h3>
        <p class="mt-2 text-sm text-slate-500">{{ t('detail_not_found_desc') }}</p>
      </div>
      <div v-else>
        <div class="py-6">
          <div class="flex items-center justify-between mb-4">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 tracking-wide uppercase">
              {{ post.category }}
            </span>
            <span class="text-sm text-slate-500 font-medium flex items-center ml-auto">
              <svg class="mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ new Date(post.created_at).toLocaleDateString() }}
            </span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">{{ post.title }}</h1>
        </div>
        
        <div v-if="hasMetadata" class="flex flex-wrap gap-4 mb-6">
          <div v-if="metadata.discount_strength" class="flex-1 min-w-[200px] bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3">
            <span class="text-2xl">💰</span>
            <div>
              <div class="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">{{ t('detail_price') }}</div>
              <div class="text-base font-bold text-slate-800">{{ metadata.discount_strength }}</div>
            </div>
          </div>
          <div v-if="metadata.promo_code && metadata.show_promo_code !== false" class="flex-1 min-w-[200px] bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-2xl">🏷️</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">{{ t('detail_promo_code') }}</div>
                <div class="text-base font-mono font-bold text-indigo-800">{{ metadata.promo_code }}</div>
              </div>
            </div>
            <button @click="copyPromoCode" class="px-2 py-1 text-[10px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer leading-none">
              {{ t('detail_copy') }}
            </button>
          </div>
          <div v-if="metadata.start_date || metadata.end_date" class="flex-1 min-w-[200px] bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center space-x-3">
            <span class="text-2xl">📅</span>
            <div>
              <div class="text-[10px] uppercase font-bold text-amber-600 tracking-wider">{{ t('detail_validity') }}</div>
              <div class="text-xs text-slate-700">
                <div v-if="metadata.start_date">{{ t('detail_start', { date: formatDate(metadata.start_date) }) }}</div>
                <div v-if="metadata.end_date">{{ t('detail_end', { date: formatDate(metadata.end_date) }) }}</div>
                <div v-else class="font-medium text-amber-800">{{ t('detail_always_valid') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="prose prose-indigo prose-lg max-w-none prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-img:rounded-xl prose-img:shadow-md" v-html="renderContent()"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import NavBar from '@/components/NavBar.vue'
import { parseFrontmatter, type ContentMetadata } from '@/utils/frontmatter'
import { showToast } from '@/utils/toast'
import { t } from '@/utils/i18n'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const categoriesTree = ref<any[]>([])

const onSearch = (val: string) => {
  router.push({ path: '/', query: { q: val } })
}

const onSelectCategory = (name: string) => {
  router.push({ path: '/', query: name ? { category: name } : {} })
}

const buildCategoryTree = (list: any[], parentId: number, parentName = ''): any[] => {
  return list
    .filter((item: any) => item.parent_id === parentId)
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((item: any) => {
      const label = parentName ? `${parentName} / ${item.name}` : item.name
      return {
        id: item.id,
        name: item.name,
        label,
        children: buildCategoryTree(list, item.id, label)
      }
    })
}

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/dictionaries')
    if (!res.ok) return
    const data = await res.json()
    const raw = data.filter((item: any) => item.code === 'category_list')
    categoriesTree.value = buildCategoryTree(raw, 100)
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}
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
  content_type?: string
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

const metadata = computed<ContentMetadata>(() => {
  if (!post.value) return {}
  return parseFrontmatter(post.value.content_md).metadata
})

const hasMetadata = computed(() => {
  const meta = metadata.value
  return !!(meta.promo_code || meta.start_date || meta.end_date || meta.discount_strength)
})

const copyPromoCode = async () => {
  if (metadata.value.promo_code) {
    try {
      await navigator.clipboard.writeText(metadata.value.promo_code)
      showToast(t('detail_copied'), 'success')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = metadata.value.promo_code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast(t('detail_copied'), 'success')
    }
  }
}

const formatDate = (val: string) => {
  try {
    return new Date(val).toLocaleString()
  } catch (e) {
    return val
  }
}

const renderContent = () => {
  if (!post.value) return ''
  const { body } = parseFrontmatter(post.value.content_md)
  if (post.value.content_type === 'richtext') {
    return body
  }
  return md.render(body)
}

onMounted(() => {
  fetchPost()
  fetchCategories()
})
</script>
