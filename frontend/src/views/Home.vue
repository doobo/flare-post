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
            <button @click="selectCategory('')" :class="selectedCategory === '' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'" class="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              All Categories
            </button>
            <div class="border-t border-slate-100 my-1"></div>
            <div v-for="parent in categoriesTree" :key="parent.id">
              <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ parent.name }}</div>
              <button
                v-for="child in parent.children" :key="child.id"
                @click="selectCategory(child.label)"
                :class="selectedCategory === child.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
                class="w-full text-left px-3 py-1.5 pl-6 rounded-lg text-sm transition-colors"
              >
                {{ child.name }}
              </button>
              <button
                v-if="!parent.children || parent.children.length === 0"
                @click="selectCategory(parent.label)"
                :class="selectedCategory === parent.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
                class="w-full text-left px-3 py-1.5 pl-6 rounded-lg text-sm transition-colors"
              >
                {{ parent.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1"></div>

        <!-- Results count -->
        <p class="text-xs text-slate-400 whitespace-nowrap">
          <span class="font-semibold text-slate-600">{{ totalCount }}</span> {{ totalCount === 1 ? 'offer' : 'offers' }}
        </p>

        <!-- Sort -->
        <select
          v-model="sortBy"
          @change="fetchPosts()"
          class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="latest">Latest</option>
          <option value="ending_soon">Ending Soon</option>
        </select>
      </div>

      <!-- Loading: Skeleton -->
      <div v-if="loading && posts.length === 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="n in 4" :key="n" class="bg-white rounded-xl px-3 py-4 border border-slate-100 animate-pulse">
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

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-400 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-xl font-medium text-slate-900 mb-1">Failed to load offers</h3>
        <p class="text-slate-500 mb-4">Something went wrong. Please try again.</p>
        <button @click="fetchPosts()" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>

      <!-- Post Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="post in posts" :key="post.id" class="bg-white rounded-xl px-3 py-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 group flex flex-col transform hover:-translate-y-0.5">
          <!-- Top Row: Discount Badge + Category + Countdown -->
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span v-if="post.discount" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              💰 {{ post.discount }}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {{ post.category }}
            </span>
            <span v-if="post.remainingDays !== undefined && post.remainingDays > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ml-auto">
              ⏳ {{ post.remainingDays }}d left
            </span>
            <span v-else-if="post.remainingDays !== undefined && post.remainingDays <= 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 ml-auto">
              Expired
            </span>
          </div>

          <!-- Title (with search highlight) -->
          <router-link :to="'/post/' + post.id" class="block mb-2">
            <h2 class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight" v-html="highlightText(post.title)"></h2>
          </router-link>

          <!-- Excerpt (with search highlight) -->
          <p class="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow" v-html="highlightText(getPreviewText(post))"></p>

          <!-- Bottom: CTA -->
          <div class="mt-auto">
            <router-link :to="'/post/' + post.id" class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-all group-hover:shadow-md">
              Read details
              <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="posts.length === 0 && !loading" class="col-span-full text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-medium text-slate-900 mb-1">No offers found</h3>
          <p class="text-slate-500">Try different keywords or browse all categories.</p>
          <button @click="searchQuery = ''; selectedCategory = ''; activeParent = ''; selectedCategoryLabel = 'All Categories'; fetchPosts()" class="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors">
            Clear all filters
          </button>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && !loading" class="text-center mt-8">
        <button @click="loadMore" class="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          Load more offers
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
            <button @click="scrollToTop" class="flex-1 flex items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Back to top">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button @click="openQRCode" class="flex-1 flex items-center justify-center py-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="QR Code">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>

          <div class="border-t border-slate-100 my-1"></div>

          <!-- Categories header -->
          <div class="flex items-center justify-between px-3 py-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categories</span>
          </div>

          <button
            @click="selectCategoryFab('')"
            :class="selectedCategory === '' && activeParent === '' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
            class="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            All Categories
          </button>
          <div v-for="parent in categoriesTree" :key="parent.id" class="mt-0.5">
            <div class="px-3 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ parent.name }}</div>
            <button
              v-for="child in parent.children" :key="child.id"
              @click="selectCategoryFab(child.label)"
              :class="selectedCategory === child.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left px-3 py-1 pl-6 rounded-lg text-sm transition-colors"
            >
              {{ child.name }}
            </button>
            <button
              v-if="!parent.children || parent.children.length === 0"
              @click="selectCategoryFab(parent.label)"
              :class="selectedCategory === parent.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full text-left px-3 py-1 pl-6 rounded-lg text-sm transition-colors"
            >
              {{ parent.name }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- QR Code Modal -->
    <Transition name="fade">
      <div v-if="showQRModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click="closeQRCode">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-80 mx-4" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-800">QR Code</h3>
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
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import QRCode from 'qrcode'

interface Post {
  id: number
  title: string
  content_md: string
  content_type?: string
  category: string
  created_at: string
  discount?: string
  remainingDays?: number
}

interface CategoryNode {
  id: number
  name: string
  label: string
  children: CategoryNode[]
}

import { parseFrontmatter } from '@/utils/frontmatter'

const posts = ref<Post[]>([])
const loading = ref(false)
const error = ref(false)
const route = useRoute()
const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref((route.query.category as string) || '')
const selectedCategoryLabel = ref(selectedCategory.value || 'All Categories')
const showCategoryDropdown = ref(false)
const showFabMenu = ref(false)
const showQRModal = ref(false)
const qrCodeDataUrl = ref('')
const qrUrl = ref('')
const activeParent = ref('')
const categoriesTree = ref<CategoryNode[]>([])
const sortBy = ref('latest')
const page = ref(1)
const totalCount = ref(0)
const hasMore = ref(false)

const getPreviewText = (post: Post): string => {
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

let fetchedAllPosts: Post[] = []
const allResultsCount = ref(0)

const filterPostsClientSide = () => {
  let filtered = [...fetchedAllPosts]

  if (activeParent.value) {
    filtered = filtered.filter(p => p.category === activeParent.value || p.category.startsWith(activeParent.value + ' / '))
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  allResultsCount.value = filtered.length

  const limit = 20
  posts.value = filtered.slice(0, limit)
  totalCount.value = filtered.length
  hasMore.value = filtered.length > limit
}

const fetchPosts = async () => {
  loading.value = true
  error.value = false
  page.value = 1

  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.set('q', searchQuery.value)
    params.set('sort', sortBy.value)

    const res = await fetch(`/api/posts?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch')

    const data = await res.json()
    const rawPosts: Post[] = Array.isArray(data) ? data : data.posts || []

    fetchedAllPosts = rawPosts.map(p => ({
      ...p,
      discount: extractDiscount(p.content_md),
      remainingDays: calcRemainingDays(p.content_md)
    }))

    filterPostsClientSide()

  } catch (e) {
    console.error('Failed to fetch posts', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  const limit = 20
  const nextCount = posts.value.length + limit
  posts.value = fetchedAllPosts.slice(0, nextCount)
  hasMore.value = fetchedAllPosts.length > nextCount
}

const onSelectParent = (name: string) => {
  activeParent.value = name
  selectedCategory.value = ''
  selectedCategoryLabel.value = 'All Categories'
  filterPostsClientSide()
}

const selectCategory = (label: string) => {
  selectedCategory.value = label
  selectedCategoryLabel.value = label || 'All Categories'
  activeParent.value = ''
  showCategoryDropdown.value = false
  filterPostsClientSide()
}

const selectCategoryFab = (label: string) => {
  showFabMenu.value = false
  selectedCategory.value = label
  selectedCategoryLabel.value = label || 'All Categories'
  activeParent.value = ''
  filterPostsClientSide()
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
    const tree = buildCategoryTree(raw, 100)
    categoriesTree.value = tree
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchPosts()
  }, 300)
})

watch(() => route.query, (query) => {
  searchQuery.value = (query.q as string) || ''
  selectedCategory.value = (query.category as string) || ''
  selectedCategoryLabel.value = selectedCategory.value || 'All Categories'
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
