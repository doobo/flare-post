<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <NavBar
      :categoriesTree="categoriesTree"
      :activeParent="activeParent"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      @selectParentCategory="onSelectParent"
    />

    <!-- Main Content -->
    <div class="max-w-5xl mx-auto pt-16 px-4 sm:px-6 pb-24">
      <!-- Toolbar: Category dropdown | Count | Sort -->
      <div class="flex items-center gap-2 mb-4 bg-white border border-slate-100 rounded-lg shadow-sm px-2.5 py-1.5">
        <!-- Category tree dropdown -->
        <div class="relative category-dropdown">
          <button @click="showCategoryDropdown = !showCategoryDropdown" class="flex items-center gap-1 text-sm text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap">
            {{ selectedCategoryLabel }}
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="showCategoryDropdown" class="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-72 overflow-y-auto p-2">
            <CategoryTree
              :tree="categoriesTree"
              :selected-value="selectedCategory"
              :all-label="t('all_categories')"
              @select="selectCategory"
            />
          </div>
        </div>

        <div class="flex-1"></div>

        <!-- Results count -->
        <p class="text-xs text-slate-400 whitespace-nowrap">
          <span class="font-semibold text-slate-600">{{ totalCount }}</span> {{ totalCount === 1 ? t('offer') : t('offers') }}
        </p>

        <!-- Sort -->
        <select
          v-model="sortBy"
          @change="handleSortChange"
          class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="latest">{{ t('sort_latest') }}</option>
          <option value="ending_soon">{{ t('sort_ending_soon') }}</option>
        </select>
      </div>

      <!-- Loading: Skeleton -->
      <div v-if="loading && posts.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="n in 4" :key="n" class="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
          <div class="h-40 bg-slate-200"></div>
          <div class="px-3 py-4">
            <div class="flex justify-between items-start mb-4">
              <div class="h-5 w-20 bg-slate-200 rounded-full"></div>
              <div class="h-4 w-16 bg-slate-200 rounded"></div>
            </div>
            <div class="h-6 bg-slate-200 rounded mb-3 w-3/4"></div>
            <div class="h-4 bg-slate-200 rounded mb-2 w-full"></div>
            <div class="h-4 bg-slate-200 rounded mb-6 w-2/3"></div>
            <div class="h-5 w-28 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-400 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-xl font-medium text-slate-900 mb-1">{{ t('error_title') }}</h3>
        <p class="text-slate-500 mb-4">{{ t('error_desc') }}</p>
        <button @click="fetchPosts()" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {{ t('retry') }}
        </button>
      </div>

      <!-- Post Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="post in posts" :key="post.id" class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 group flex flex-col transform hover:-translate-y-0.5 overflow-hidden">
          <!-- Card Image -->
          <router-link :to="'/post/' + post.id" class="h-40 overflow-hidden bg-slate-100 block">
            <img :src="getPostImage(post)" :alt="post.title"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              @error="handleImgError" />
          </router-link>
          <div class="px-3 py-4 flex flex-col flex-1">
          <!-- Top Row: Discount Badge + Category + Countdown -->
          <div class="flex items-center gap-2 mb-3">
            <span v-if="post.discount" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
              💰 {{ post.discount }}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 whitespace-nowrap">
              {{ post.category }}
            </span>
            <span v-if="post.remainingDays !== undefined && post.remainingDays > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ml-auto whitespace-nowrap">
              ⏳ {{ t('days_left', { d: post.remainingDays }) }}
            </span>
            <span v-else-if="post.remainingDays !== undefined && post.remainingDays <= 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 ml-auto">
              {{ t('expired') }}
            </span>
          </div>

          <!-- Title (with search highlight) -->
          <router-link :to="'/post/' + post.id" class="block mb-2">
            <h2 class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight" v-html="highlightText(post.title)"></h2>
          </router-link>

          <!-- Excerpt (with search highlight) -->
          <p class="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow" v-html="highlightText(getPreviewText(post))"></p>

          <!-- Bottom: CTA + Date -->
          <div class="mt-auto flex items-center justify-between">
            <router-link :to="'/post/' + post.id" class="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-all">
              {{ t('read_details') }}
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
            <span class="text-xs text-slate-400">{{ formatDate(post.created_at) }}</span>
          </div>
          </div>
          </div>

        <!-- Empty State -->
        <div v-if="posts.length === 0 && !loading" class="col-span-full text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-slate-900 mb-1">{{ t('empty_title') }}</h3>
          <p class="text-slate-500">{{ t('empty_desc') }}</p>
          <button @click="resetFilters" class="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors">
            {{ t('clear_filters') }}
          </button>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-8">
        <button @click="loadMore" class="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          {{ t('load_more') }}
        </button>
      </div>
      <div v-if="loading && posts.length > 0" class="text-center mt-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 inline-block"></div>
      </div>
    </div>

    <!-- Floating action button (bottom right) -->
    <div class="fixed bottom-6 right-6 z-30 category-fab">
      <button @click="showFabMenu = !showFabMenu" class="w-11 h-11 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Floating panel -->
      <Transition name="scale">
        <div v-if="showFabMenu" class="absolute bottom-14 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2">
          <!-- Toolbar row -->
          <div class="flex gap-1 mb-1">
            <button @click="scrollToTop" class="flex-1 flex items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" :title="t('back_to_top')">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button @click="openQRCode" class="flex-1 flex items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" :title="t('qr_title')">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>

          <div class="border-t border-slate-100 my-1"></div>

          <!-- Categories header -->
          <div class="flex items-center justify-between px-3 py-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ t('categories') }}</span>
          </div>

          <CategoryTree
            :tree="categoriesTree"
            :selected-value="selectedCategory"
            :all-label="t('all_categories')"
            @select="selectCategoryFab"
          />
        </div>
      </Transition>
    </div>

    <!-- QR Code Modal -->
    <Transition name="fade">
      <div v-if="showQRModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="closeQRCode">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-800">{{ t('qr_title') }}</h3>
            <button @click="closeQRCode" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex justify-center mb-4">
            <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code" class="w-48 h-48" />
            <div v-else class="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-xl">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          </div>
          <p class="text-xs text-slate-500 text-center break-all">{{ qrUrl }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import CategoryTree from '@/components/CategoryTree.vue'
import QRCode from 'qrcode'

interface Post {
  id: number
  title: string
  content_md: string
  content_type?: string
  category: string
  created_at: string
  search_content?: string
  discount?: string
  remainingDays?: number
}

interface CategoryNode {
  id: number
  name: string
  label: string
  children: CategoryNode[]
}

interface DictionaryItem {
  id: number
  code: string
  parent_id: number
  sort_order: number
  name: string
}

interface ApiResponse {
  posts: Post[]
  total: number
  page: number
  limit: number
}

import { t } from '@/utils/i18n'
import { parseFrontmatter } from '@/utils/frontmatter'

const POST_LIMIT = 20
const CATEGORY_CACHE_KEY = 'flarepost_categories_cache'
const CATEGORY_CACHE_TTL = 5 * 60 * 1000

const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref(false)
const route = useRoute()
const router = useRouter()
const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref('')
const activeParent = ref((route.query.category as string) || '')
const selectedCategoryLabel = ref(activeParent.value || t('all_categories'))
const showCategoryDropdown = ref(false)
const showFabMenu = ref(false)
const showQRModal = ref(false)
const qrCodeDataUrl = ref('')
const qrUrl = ref('')
const categoriesTree = ref<CategoryNode[]>([])
const sortBy = ref('latest')
const currentPage = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)

const getPreviewText = (post: Post): string => {
  if (post.search_content) return post.search_content
  let rawText = post.content_md || ''
  const { body } = parseFrontmatter(rawText)
  let text = body
  if (post.content_type === 'richtext') {
    text = text.replace(/<\/?[^>]+(>|$)/g, "")
  } else {
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    text = text.replace(/[#*`_~]/g, '')
  }
  return text.trim()
}

const extractDiscount = (contentMd: string): string | undefined => {
  const { metadata } = parseFrontmatter(contentMd)
  return metadata.discount_strength || undefined
}

const extractEndDate = (contentMd: string): string | undefined => {
  const { metadata } = parseFrontmatter(contentMd)
  return metadata.end_date || undefined
}

const calcRemainingDays = (contentMd: string): number | undefined => {
  const endDate = extractEndDate(contentMd)
  if (!endDate) return undefined
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
}

const buildApiParams = (): URLSearchParams => {
  const params = new URLSearchParams()
  params.set('page', String(currentPage.value))
  params.set('limit', String(POST_LIMIT))
  params.set('sort', sortBy.value)
  if (searchQuery.value) params.set('q', searchQuery.value)
  if (selectedCategory.value) {
    params.set('category', selectedCategory.value)
  } else if (activeParent.value) {
    params.set('parent_category', activeParent.value)
  }
  return params
}

const fetchPosts = async (append = false) => {
  loading.value = true
  error.value = false

  try {
    const params = buildApiParams()
    const res = await fetch(`/api/posts?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch')

    const data: ApiResponse = await res.json()
    const processedPosts = (data.posts || []).map(p => ({
      ...p,
      discount: extractDiscount(p.content_md),
      remainingDays: calcRemainingDays(p.content_md)
    }))

    if (append) {
      posts.value = [...posts.value, ...processedPosts]
    } else {
      posts.value = processedPosts
    }

    totalCount.value = data.total || 0
    currentPage.value = data.page || 1
    hasMore.value = (currentPage.value * POST_LIMIT) < totalCount.value

  } catch (e) {
    console.error('Failed to fetch posts', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  currentPage.value++
  fetchPosts(true)
}

const handleSortChange = () => {
  currentPage.value = 1
  fetchPosts()
}

const updateRoute = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  const categoryParam = selectedCategory.value || activeParent.value
  if (categoryParam) query.category = categoryParam
  router.replace({ query })
}

const handleCategorySelect = (label: string, isParent: boolean) => {
  currentPage.value = 1
  if (isParent) {
    activeParent.value = label
    selectedCategory.value = ''
    selectedCategoryLabel.value = label || t('all_categories')
  } else {
    selectedCategory.value = label
    selectedCategoryLabel.value = label || t('all_categories')
    activeParent.value = ''
  }
  updateRoute()
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onSelectParent = (name: string) => {
  handleCategorySelect(name, true)
}

const selectCategory = (label: string) => {
  showCategoryDropdown.value = false
  handleCategorySelect(label, false)
}

const selectCategoryFab = (label: string) => {
  showFabMenu.value = false
  handleCategorySelect(label, false)
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  activeParent.value = ''
  selectedCategoryLabel.value = t('all_categories')
  router.replace({ query: {} })
  currentPage.value = 1
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToTop = () => {
  showFabMenu.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const openQRCode = async () => {
  showFabMenu.value = false
  showQRModal.value = true
  qrUrl.value = window.location.href
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(window.location.href, {
      width: 384,
      margin: 2,
      color: { dark: '#1E293B', light: '#FFFFFF' }
    })
  } catch {
    qrCodeDataUrl.value = ''
  }
}

const closeQRCode = () => {
  showQRModal.value = false
  qrCodeDataUrl.value = ''
}

const highlightText = (text: string): string => {
  if (!searchQuery.value || !text) return text
  const q = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${q})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 text-slate-900 rounded px-0.5">$1</mark>')
}

const getCategoryImage = (category: string): string => {
  const cat = category.toLowerCase()
  if (cat.includes('vps') || cat.includes('虚拟机') || cat.includes('kvm') || cat.includes('vmware')) return '/images/vps.svg'
  if (cat.includes('vpn')) return '/images/vpn.svg'
  if (cat.includes('域名') || cat.includes('domain') || cat.includes('dns') || cat.includes('注册商')) return '/images/domain.svg'
  if (cat.includes('服务器') || cat.includes('server')) return '/images/server.svg'
  if (cat.includes('网络') || cat.includes('network')) return '/images/network.svg'
  if (cat.includes('安全') || cat.includes('security') || cat.includes('lock')) return '/images/security.svg'
  return '/images/default.svg'
}

const getPostImage = (post: Post): string => {
  const md = post.content_md
  if (!md) return getCategoryImage(post.category)
  const mdMatch = md.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (mdMatch) return mdMatch[1]
  const htmlMatch = md.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/)
  if (htmlMatch) return htmlMatch[1]
  return getCategoryImage(post.category)
}

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.src && !img.src.includes('/images/default.svg')) {
    img.src = '/images/default.svg'
  }
}

const buildCategoryTree = (list: DictionaryItem[], parentId: number, parentName = ''): CategoryNode[] => {
  return list
    .filter((item: DictionaryItem) => item.parent_id === parentId)
    .sort((a: DictionaryItem, b: DictionaryItem) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((item: DictionaryItem) => {
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
  const cached = localStorage.getItem(CATEGORY_CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CATEGORY_CACHE_TTL) {
        categoriesTree.value = data
        return
      }
    } catch {
      // invalid cache, ignore
    }
  }

  try {
    const res = await fetch('/api/dictionaries')
    if (!res.ok) return
    const data = await res.json()
    const raw = data.filter((item: DictionaryItem) => item.code === 'category_list')
    const tree = buildCategoryTree(raw, 100)
    categoriesTree.value = tree
    localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify({ data: tree, timestamp: Date.now() }))
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchPosts()
  }, 300)
})

watch(() => route.query, (query) => {
  searchQuery.value = (query.q as string) || ''
  const cat = (query.category as string) || ''
  currentPage.value = 1
  if (cat) {
    activeParent.value = cat
    selectedCategory.value = ''
    selectedCategoryLabel.value = cat
  } else {
    activeParent.value = ''
    selectedCategory.value = ''
    selectedCategoryLabel.value = t('all_categories')
  }
  fetchPosts()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

const closeDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.category-dropdown')) {
    showCategoryDropdown.value = false
  }
  if (!target.closest('.category-fab')) {
    showFabMenu.value = false
  }
}

onMounted(() => {
  const cat = route.query.category as string | undefined
  if (cat) {
    activeParent.value = cat
    selectedCategory.value = ''
    selectedCategoryLabel.value = cat
  }
  fetchPosts()
  fetchCategories()
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:deep(mark) {
  background-color: #fef08a;
  color: #0f172a;
  border-radius: 2px;
  padding: 0 2px;
}

.scale-enter-active, .scale-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
