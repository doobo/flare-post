<template>
  <div class="p-6 lg:p-10">
    <div class="max-w-5xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">{{ isEditing ? 'Edit Offer' : 'Publish New Offer' }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ isEditing ? 'Update the details of this discount or offer.' : 'Create and publish a new discount or offer.' }}</p>
      </div>
      <!-- Draft recovery alert -->
      <div v-if="showDraftPrompt" class="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-sm text-amber-800 shadow-sm animate-fade-in">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>检测到您有未保存的编辑草稿，是否恢复？</span>
        </div>
        <div class="flex space-x-3">
          <button type="button" @click="restoreDraft" class="text-amber-900 font-semibold hover:underline">恢复草稿</button>
          <button type="button" @click="discardDraft" class="text-slate-500 hover:underline">放弃</button>
        </div>
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
              <div class="relative category-select-container">
                <label class="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <div class="relative">
                  <button 
                    type="button" 
                    @click="showCategoryDropdown = !showCategoryDropdown"
                    class="w-full px-4 py-2.5 text-left border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm flex items-center justify-between transition-shadow"
                  >
                    <span class="text-slate-700 font-medium">
                      {{ form.category || 'Select a category...' }}
                    </span>
                    <svg class="h-4 w-4 text-slate-400 transition-transform duration-200" :class="showCategoryDropdown ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- Category Dropdown Panel -->
                  <div 
                    v-if="showCategoryDropdown" 
                    class="absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl p-2 max-h-60 overflow-y-auto"
                  >
                    <div v-for="parent in categoriesTree" :key="parent.id" class="mb-2">
                      <!-- First-level Category (Header) -->
                      <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded-lg">
                        {{ parent.name }}
                      </div>
                      
                      <!-- Second-level Categories -->
                      <div class="mt-1 pl-2 space-y-0.5">
                        <button 
                          v-if="!parent.children || parent.children.length === 0"
                          type="button"
                          @click="selectCategory(parent.id, parent.name)"
                          :class="form.category_id === parent.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
                          class="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                        >
                          {{ parent.name }}
                        </button>
                        
                        <button 
                          v-for="child in parent.children" 
                          :key="child.id"
                          type="button"
                          @click="selectCategory(child.id, `${parent.name} / ${child.name}`)"
                          :class="form.category_id === child.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
                          class="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between"
                        >
                          <span>{{ child.name }}</span>
                          <svg v-if="form.category_id === child.id" class="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input v-model="form.tags" type="text" class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow" placeholder="e.g. kvm, cheap, us" />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between border border-slate-200 rounded-t-xl bg-slate-50/80 px-4 py-2">
                <!-- Edit Mode Toggle -->
                <div class="flex space-x-1.5 bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/30">
                  <button 
                    type="button" 
                    @click="switchEditorMode('markdown')"
                    :class="form.content_type === 'markdown' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'"
                    class="px-3 py-1 text-xs rounded-md transition-all font-medium"
                  >
                    Markdown
                  </button>
                  <button 
                    type="button" 
                    @click="switchEditorMode('richtext')"
                    :class="form.content_type === 'richtext' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'"
                    class="px-3 py-1 text-xs rounded-md transition-all font-medium"
                  >
                    Rich Text
                  </button>
                </div>

                <!-- Rich Text Editor Toolbar -->
                <div v-show="form.content_type === 'richtext'" class="flex items-center space-x-1">
                  <button type="button" @click="execRichCommand('formatBlock', '<h1>')" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-bold" title="H1">H1</button>
                  <button type="button" @click="execRichCommand('formatBlock', '<h2>')" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-bold" title="H2">H2</button>
                  <button type="button" @click="execRichCommand('formatBlock', '<h3>')" class="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 text-xs font-bold" title="H3">H3</button>
                  <div class="h-4 w-px bg-slate-300 mx-1"></div>
                  <button type="button" @click="execRichCommand('bold')" class="p-1 rounded hover:bg-slate-200 text-slate-700 font-bold" title="Bold">B</button>
                  <button type="button" @click="execRichCommand('italic')" class="p-1 rounded hover:bg-slate-200 text-slate-700 italic font-medium" title="Italic">I</button>
                  <div class="h-4 w-px bg-slate-300 mx-1"></div>
                  <button type="button" @click="execRichCommand('insertUnorderedList')" class="p-1 rounded hover:bg-slate-200 text-slate-700" title="Unordered List">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button type="button" @click="execRichCommand('insertOrderedList')" class="p-1 rounded hover:bg-slate-200 text-slate-700" title="Ordered List">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  </button>
                  <div class="h-4 w-px bg-slate-300 mx-1"></div>
                  <button type="button" @click="execLinkCommand" class="p-1.5 rounded hover:bg-slate-200 text-slate-700" title="Insert Link">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Editors container -->
              <div class="flex flex-col lg:flex-row gap-6 border-x border-b border-slate-200 rounded-b-xl p-4 bg-white min-h-[500px]">
                <!-- Markdown Editor -->
                <template v-if="form.content_type === 'markdown'">
                  <textarea 
                    v-model="form.content_md" 
                    required 
                    class="w-full lg:w-1/2 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm resize-none bg-slate-50/50" 
                    placeholder="Write your markdown here..."
                  ></textarea>
                  <div 
                    class="w-full lg:w-1/2 p-6 border border-slate-200 rounded-xl bg-white overflow-auto prose prose-indigo max-w-none shadow-inner min-h-[468px]" 
                    v-html="previewMarkdown"
                  ></div>
                </template>

                <!-- Rich Text Editor -->
                <template v-else>
                  <div 
                    ref="richEditorRef"
                    contenteditable="true"
                    @input="onRichInput"
                    class="w-full p-6 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none overflow-auto prose prose-indigo max-w-none shadow-inner min-h-[468px] bg-slate-50/30"
                    placeholder="Start writing rich text..."
                  ></div>
                </template>
              </div>
            </div>

            <!-- Autosave notice tip -->
            <div v-if="showAutosaveTip" class="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center">
              <svg class="h-3.5 w-3.5 mr-2 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              已自动保存草稿
            </div>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <!-- Autosave Toggle Switch (Visible only on create new post) -->
              <div v-if="!isEditing" class="flex items-center space-x-2 select-none">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="enableAutosave" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span class="ml-3 text-sm font-medium text-slate-600">自动保存草稿 (30秒间隔)</span>
                </label>
              </div>
              <div v-else class="text-xs text-slate-400 italic">Editing mode: autosave disabled</div>
              <button type="submit" :disabled="submitting" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="submitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {{ submitting ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish Post') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { showToast } from '@/utils/toast'
import { showConfirm } from '@/utils/confirm'

const router = useRouter()
const route = useRoute()
const md = new MarkdownIt()

const postId = computed(() => route.query.id as string | undefined)
const isEditing = computed(() => !!postId.value)

const form = ref({
  title: '',
  category: '',
  category_id: 0,
  tags: '',
  content_md: '',
  content_html: '',
  content_type: 'markdown'
})

const submitting = ref(false)
const showDraftPrompt = ref(false)
const showAutosaveTip = ref(false)
const enableAutosave = ref(localStorage.getItem('admin_enable_autosave') !== 'false')

const showCategoryDropdown = ref(false)
const categoriesTree = ref<any[]>([])

const richEditorRef = ref<HTMLElement | null>(null)

const previewMarkdown = computed(() => {
  return md.render(form.value.content_md || '*Preview will appear here*')
})

const buildCategoryTree = (list: any[], parentId: number): any[] => {
  return list
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(item => ({
      id: item.id,
      name: item.name,
      children: buildCategoryTree(list, item.id)
    }))
}

const fetchCategories = async () => {
  const token = localStorage.getItem('adminToken')
  try {
    const res = await fetch('/api/dictionaries', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      const rawCategories = data.filter((item: any) => item.code === 'category_list')
      categoriesTree.value = buildCategoryTree(rawCategories, 100)
    }
  } catch (e) {
    console.error('Failed to load categories:', e)
  }
}

const selectCategory = (id: number, name: string) => {
  form.value.category_id = id
  form.value.category = name
  showCategoryDropdown.value = false
}

const closeCategoryDropdownOnOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.category-select-container')) {
    showCategoryDropdown.value = false
  }
}
const decodeMarkdownLinks = (content: string): string => {
  if (!content) return ''
  const regex = /\[([^\]]+)\]\(\/redirect\?url=([^)]+)\)/g
  return content.replace(regex, (match, text, url) => {
    try {
      return `[${text}](${decodeURIComponent(url)})`
    } catch (e) {
      return match
    }
  })
}

const decodeHtmlLinks = (content: string): string => {
  if (!content) return ''
  const regex = /href=(["'])\/redirect\?url=([^"'\s]+)\1/g
  return content.replace(regex, (match, quote, url) => {
    try {
      return `href=${quote}${decodeURIComponent(url)}${quote}`
    } catch (e) {
      return match
    }
  })
}

const fetchPost = async (id: string) => {
  try {
    const res = await fetch(`/api/posts/${id}`)
    if (res.ok) {
      const data = await res.json()
      let content = data.content_md || ''
      if (data.content_type === 'markdown') {
        content = decodeMarkdownLinks(content)
      } else {
        content = decodeHtmlLinks(content)
      }

      form.value = {
        title: data.title,
        category: data.category || '',
        category_id: data.category_id || 0,
        tags: data.tags || '',
        content_md: data.content_type === 'markdown' ? content : '',
        content_html: data.content_type === 'richtext' ? content : '',
        content_type: data.content_type || 'markdown'
      }

      if (form.value.content_type === 'richtext') {
        setTimeout(() => {
          if (richEditorRef.value) {
            richEditorRef.value.innerHTML = form.value.content_html
          }
        }, 0)
      }
    } else {
      showToast('Post not found.', 'error')
      router.push('/admin/list')
    }
  } catch (e) {
    console.error(e)
    showToast('Error loading post data.', 'error')
  }
}

const htmlToMarkdown = (html: string): string => {
  if (!html) return ''
  let mdText = html
  
  // Convert headings
  mdText = mdText.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
  mdText = mdText.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
  mdText = mdText.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
  
  // Convert bold/italic
  mdText = mdText.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  mdText = mdText.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  mdText = mdText.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  mdText = mdText.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  
  // Convert lists
  mdText = mdText.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, p1) => {
    return p1.replace(/<li>(.*?)<\/li>/gi, '* $1\n') + '\n'
  })
  mdText = mdText.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, p1) => {
    let index = 1
    return p1.replace(/<li>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n'
  })
  
  // Convert links
  mdText = mdText.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  
  // Convert paragraphs/divs/br
  mdText = mdText.replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
  mdText = mdText.replace(/<div>(.*?)<\/div>/gi, '$1\n')
  mdText = mdText.replace(/<br\s*\/?>/gi, '\n')
  
  // Strip remaining HTML tags
  mdText = mdText.replace(/<[^>]+>/g, '')
  
  // Clean up spacing
  return mdText.trim().replace(/\n{3,}/g, '\n\n')
}

const switchEditorMode = async (newMode: 'markdown' | 'richtext') => {
  if (form.value.content_type === newMode) return

  if (newMode === 'richtext') {
    // Markdown -> HTML
    const htmlContent = md.render(form.value.content_md || '')
    form.value.content_html = htmlContent
    form.value.content_type = 'richtext'
    
    setTimeout(() => {
      if (richEditorRef.value) {
        richEditorRef.value.innerHTML = htmlContent
      }
    }, 0)
  } else {
    // HTML -> Markdown
    if (await showConfirm('切换到 Markdown 将进行格式转换。一些复杂的 Rich Text 排版可能需要手动调整，是否继续？')) {
      const htmlContent = richEditorRef.value ? richEditorRef.value.innerHTML : (form.value.content_html || '')
      form.value.content_md = htmlToMarkdown(htmlContent)
      form.value.content_type = 'markdown'
    }
  }
}

const onRichInput = (e: Event) => {
  const target = e.target as HTMLElement
  form.value.content_html = target.innerHTML
}

const execRichCommand = (command: string, value: string = '') => {
  document.execCommand(command, false, value)
  if (richEditorRef.value) {
    form.value.content_html = richEditorRef.value.innerHTML
  }
}

const execLinkCommand = () => {
  const url = prompt('请输入链接地址 (URL):', 'https://')
  if (url) {
    execRichCommand('createLink', url)
  }
}

// Autosave & draft system
let autosaveTimer: any = null
let lastSavedContent = ''

const startAutosave = () => {
  if (autosaveTimer) clearInterval(autosaveTimer)
  if (!enableAutosave.value) return

  lastSavedContent = JSON.stringify(form.value)
  autosaveTimer = setInterval(() => {
    if (!isEditing.value && enableAutosave.value && (form.value.title || form.value.content_md || form.value.content_html)) {
      if (form.value.content_type === 'richtext' && richEditorRef.value) {
        form.value.content_html = richEditorRef.value.innerHTML
      }
      
      const currentContent = JSON.stringify(form.value)
      if (currentContent !== lastSavedContent) {
        localStorage.setItem('admin_draft_post', currentContent)
        lastSavedContent = currentContent
        showAutosaveTip.value = true
        setTimeout(() => {
          showAutosaveTip.value = false
        }, 2000)
      }
    }
  }, 30000) // 30 seconds interval
}

watch(enableAutosave, (newVal) => {
  localStorage.setItem('admin_enable_autosave', String(newVal))
  if (newVal) {
    if (!isEditing.value) {
      startAutosave()
    }
  } else {
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }
  }
})

const restoreDraft = () => {
  const draft = localStorage.getItem('admin_draft_post')
  if (draft) {
    try {
      const data = JSON.parse(draft)
      form.value = {
        title: data.title || '',
        category: data.category || '',
        category_id: data.category_id || 0,
        tags: data.tags || '',
        content_md: data.content_md || '',
        content_html: data.content_html || '',
        content_type: data.content_type || 'markdown'
      }
      if (form.value.content_type === 'richtext') {
        setTimeout(() => {
          if (richEditorRef.value) {
            richEditorRef.value.innerHTML = form.value.content_html
          }
        }, 0)
      }
      lastSavedContent = JSON.stringify(form.value)
      showToast('草稿已成功恢复！', 'success')
    } catch (e) {
      console.error(e)
    }
  }
  showDraftPrompt.value = false
}

const discardDraft = () => {
  localStorage.removeItem('admin_draft_post')
  showDraftPrompt.value = false
}

onMounted(() => {
  fetchCategories()
  document.addEventListener('click', closeCategoryDropdownOnOutside)
  
  if (postId.value) {
    fetchPost(postId.value)
  } else {
    // Check if draft exists
    if (localStorage.getItem('admin_draft_post')) {
      showDraftPrompt.value = true
    }
    
    // Select default recently used category
    const recentId = localStorage.getItem('recent_category_id')
    const recentName = localStorage.getItem('recent_category_name')
    if (recentId && recentName) {
      form.value.category_id = parseInt(recentId, 10)
      form.value.category = recentName
    }
    
    startAutosave()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeCategoryDropdownOnOutside)
  if (autosaveTimer) clearInterval(autosaveTimer)
})

const submitPost = async () => {
  submitting.value = true
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
    return
  }

  // Bind rich text content if active
  if (form.value.content_type === 'richtext' && richEditorRef.value) {
    form.value.content_html = richEditorRef.value.innerHTML
  }

  const payload = {
    title: form.value.title,
    category: form.value.category,
    category_id: form.value.category_id,
    tags: form.value.tags,
    content: form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html,
    content_type: form.value.content_type
  }

  try {
    const url = isEditing.value ? `/api/posts/${postId.value}` : '/api/posts'
    const method = isEditing.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      // Clear draft on successful save
      localStorage.removeItem('admin_draft_post')
      
      // Save recently used category
      if (form.value.category_id && form.value.category) {
        localStorage.setItem('recent_category_id', String(form.value.category_id))
        localStorage.setItem('recent_category_name', form.value.category)
      }

      if (isEditing.value) {
        showToast('Post updated successfully!', 'success')
        router.push('/admin/list')
      } else {
        showToast('Post published successfully!', 'success')
        form.value = { 
          title: '', 
          category: '', 
          category_id: 0, 
          tags: '', 
          content_md: '', 
          content_html: '', 
          content_type: 'markdown' 
        }
      }
    } else {
      const data = await res.json()
      if (res.status === 401) {
        showToast('Session expired. Please log in again.', 'error')
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        showToast('Failed to save post: ' + (data.error || 'Unknown error'), 'error')
      }
    }
  } catch (e) {
    console.error(e)
    showToast('Error saving post.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
