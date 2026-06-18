<template>
  <header class="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 shadow-sm z-50">
    <div class="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center gap-3">
      <!-- Hamburger (mobile) -->
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Logo -->
      <router-link to="/" class="flex items-center shrink-0">
        <span class="text-base font-bold text-slate-800">FlarePost</span>
      </router-link>

      <!-- Desktop category tabs -->
      <div class="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
        <button
          @click="$emit('selectParentCategory', '')"
          :class="activeParent === '' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:text-slate-700 border-transparent'"
          class="px-3 py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
        >
          All
        </button>
        <button
          v-for="parent in categoriesTree" :key="parent.id"
          @click="$emit('selectParentCategory', parent.name)"
          :class="activeParent === parent.name ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:text-slate-700 border-transparent'"
          class="px-3 py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
        >
          {{ parent.name }}
        </button>
      </div>

      <!-- Right: Search + placeholder for flex -->
      <div class="flex items-center gap-2 ml-auto lg:ml-0">
        <!-- Search desktop -->
        <div class="relative flex items-center">
          <button v-if="!searchExpanded" @click="openSearch" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div v-else class="flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1.5">
            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref="searchInputRef"
              :value="searchQuery"
              @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Search..."
              @blur="onBlur"
              class="w-32 sm:w-48 text-sm bg-transparent border-0 outline-none focus:ring-0 p-0 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile menu overlay -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 bg-black/30 z-40 lg:hidden" @click="mobileMenuOpen = false"></div>
    </Transition>

    <!-- Mobile menu panel -->
    <Transition name="slide">
      <div v-if="mobileMenuOpen" class="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-xl lg:hidden overflow-y-auto">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <span class="text-sm font-bold text-slate-800">Categories</span>
          <button @click="mobileMenuOpen = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-3">
          <button
            @click="selectMobile('')"
            :class="activeParent === '' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'"
            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            All Categories
          </button>
          <div class="border-t border-slate-100 my-2"></div>
          <div v-for="parent in categoriesTree" :key="parent.id" class="mb-2">
            <button
              @click="selectMobile(parent.name)"
              :class="activeParent === parent.name ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {{ parent.name }}
            </button>
            <div v-if="parent.children && parent.children.length > 0" class="ml-4 mt-1 space-y-0.5">
              <button
                v-for="child in parent.children" :key="child.id"
                @click="selectMobile(child.label)"
                :class="activeParent === child.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'"
                class="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                {{ child.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  categoriesTree: { id: number; name: string; children: { id: number; name: string; label: string }[] }[]
  activeParent: string
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'selectParentCategory', val: string): void
}>()

const searchExpanded = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const mobileMenuOpen = ref(false)

const openSearch = () => {
  searchExpanded.value = true
  setTimeout(() => searchInputRef.value?.focus(), 100)
}

const onBlur = () => {
  setTimeout(() => {
    if (!searchInputRef.value?.value) {
      searchExpanded.value = false
    }
  }, 150)
}

const selectMobile = (label: string) => {
  emit('selectParentCategory', label)
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}
</style>
