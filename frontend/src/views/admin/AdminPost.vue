<template>
  <div class="p-6 h-full flex flex-col overflow-hidden">
    <!-- Page Header -->
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0">
      <div class="flex items-baseline space-x-2">
        <h1 class="text-xl font-bold text-slate-800">{{ isEditing ? t('admin_post_edit') : t('admin_post_create') }}</h1>
        <span class="text-xs text-slate-400 hidden sm:inline">{{ t('admin_post_subtitle') }}</span>
      </div>
      <div class="flex items-center space-x-2 mt-2 sm:mt-0">
        <!-- Toggle Preview Button -->
        <button 
          type="button" 
          @click="showPreview = !showPreview" 
          :class="showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'"
          class="px-3 py-1.5 border text-xs rounded-lg transition-all cursor-pointer flex items-center space-x-1"
        >
          <span>{{ showPreview ? '👁️ ' + t('admin_post_toggle_preview') : '👁️ ' + t('admin_post_toggle_preview_on') }}</span>
        </button>
        <button type="button" @click="saveDraft(true)" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer">
          {{ t('admin_post_save_draft') }}
        </button>
      </div>
    </div>

    <!-- Stepper Navigation -->
    <div class="bg-white border border-slate-100 rounded-xl px-6 py-3.5 mb-4 shadow-sm shrink-0 flex items-center justify-between">
      <div class="flex items-center space-x-8 w-full max-w-3xl mx-auto justify-around">
        <!-- Step 1 -->
        <button @click="goToStep(1)" class="flex items-center space-x-2.5 focus:outline-none cursor-pointer">
          <div :class="currentStep >= 1 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-400'" class="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all">
            1
          </div>
          <span :class="currentStep === 1 ? 'text-indigo-600 font-semibold text-sm' : 'text-slate-500 text-sm'">{{ t('admin_post_step1') }}</span>
        </button>
        <div class="flex-1 h-px bg-slate-200"></div>
        <!-- Step 2 -->
        <button @click="goToStep(2)" class="flex items-center space-x-2.5 focus:outline-none cursor-pointer">
          <div :class="currentStep >= 2 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-400'" class="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all">
            2
          </div>
          <span :class="currentStep === 2 ? 'text-indigo-600 font-semibold text-sm' : 'text-slate-500 text-sm'">{{ t('admin_post_step2') }}</span>
        </button>
        <div class="flex-1 h-px bg-slate-200"></div>
        <!-- Step 3 -->
        <button @click="goToStep(3)" class="flex items-center space-x-2.5 focus:outline-none cursor-pointer">
          <div :class="currentStep === 3 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-400'" class="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all">
            3
          </div>
          <span :class="currentStep === 3 ? 'text-indigo-600 font-semibold text-sm' : 'text-slate-500 text-sm'">{{ t('admin_post_step3') }}</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace (Split / Content Area) -->
    <div class="flex-1 flex gap-6 overflow-hidden min-h-0">
      <!-- Left: Form Input Pane -->
      <div :class="showPreview ? 'w-full lg:w-1/2' : 'w-full'" class="bg-white border border-slate-100 rounded-xl shadow-sm p-6 overflow-y-auto flex flex-col justify-between transition-all duration-300 editor-scrollbar">
        <div class="space-y-6">
          <!-- STEP 1: Basic Info -->
          <div v-show="currentStep === 1" class="space-y-5">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">{{ t('admin_post_basic_info') }}</h2>
            
            <!-- Title -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-bold text-slate-700 uppercase">{{ t('admin_post_title') }} <span class="text-red-500">*</span></label>
                <span :class="form.title.length > 90 ? 'text-red-500 font-semibold' : 'text-slate-400'" class="text-[10px] font-mono">
                  {{ form.title.length }} / 90
                </span>
              </div>
              <input 
                v-model="form.title" 
                type="text" 
                maxlength="90"
                @blur="validateField('title')"
                class="w-full px-3.5 py-2 border rounded-lg outline-none text-sm transition-all"
                :class="errors.title ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-slate-300 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500'" 
                :placeholder="t('admin_post_title_ph')" 
              />
              <p v-if="errors.title" class="text-red-500 text-xs mt-1">{{ errors.title }}</p>
            </div>

            <!-- Category -->
            <div class="relative category-select-container">
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_category') }} <span class="text-red-500">*</span></label>
              <button 
                type="button" 
                @click="showCategoryDropdown = !showCategoryDropdown"
                class="w-full px-3.5 py-2.5 text-left border rounded-lg bg-white text-sm flex items-center justify-between transition-all"
                :class="errors.category ? 'border-red-300' : 'border-slate-300 focus:ring-2 focus:ring-indigo-100'"
              >
                <span :class="form.category ? 'text-slate-700 font-medium' : 'text-slate-400'">
                  {{ form.category || t('admin_post_category_ph') }}
                </span>
                <svg class="h-4 w-4 text-slate-400 transition-transform duration-200" :class="showCategoryDropdown ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p v-if="errors.category" class="text-red-500 text-xs mt-1">{{ errors.category }}</p>

              <!-- Category Dropdown -->
              <div v-if="showCategoryDropdown" class="absolute left-0 right-0 z-50 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl p-2 max-h-56 overflow-y-auto">
                <div v-for="parent in categoriesTree" :key="parent.id" class="mb-2">
                  <div class="px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase bg-slate-50 rounded">
                    {{ parent.name }}
                  </div>
                  <div class="mt-1 pl-1 space-y-0.5">
                    <button 
                      v-if="!parent.children || parent.children.length === 0"
                      type="button"
                      @click="selectCategory(parent.id, parent.name)"
                      :class="form.category_id === parent.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
                      class="w-full text-left px-3 py-1.5 rounded text-xs transition-colors"
                    >
                      {{ parent.name }}
                    </button>
                    <button 
                      v-for="child in parent.children" 
                      :key="child.id"
                      type="button"
                      @click="selectCategory(child.id, `${parent.name} / ${child.name}`)"
                      :class="form.category_id === child.id ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-50'"
                      class="w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-between"
                    >
                      <span>{{ child.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tags Input Component -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_tags') }}</label>
              <div class="border border-slate-300 rounded-lg p-2 bg-white flex flex-wrap gap-1.5 items-center min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500 transition-all">
                <span 
                  v-for="(tag, index) in tagsList" 
                  :key="index"
                  class="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                >
                  {{ tag }}
                  <button type="button" @click="removeTag(index)" class="ml-1 text-indigo-400 hover:text-indigo-600 focus:outline-none">
                    &times;
                  </button>
                </span>
                <input 
                  type="text" 
                  v-model="tagInput" 
                  @keydown.enter.prevent="addTag"
                  @keydown.comma.prevent="addTag"
                  @keydown.backspace="handleTagBackspace"
                  :placeholder="t('admin_post_tags_ph')"
                  class="flex-1 bg-transparent border-0 outline-none text-xs p-0.5 min-w-[100px]"
                />
              </div>

              <!-- Hot Tags -->
              <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] text-slate-400 font-semibold mr-1">{{ t('admin_post_hot_tags') }}</span>
                <button 
                  v-for="ht in hotTags" 
                  :key="ht"
                  type="button" 
                  @click="quickAddTag(ht)"
                  class="px-2 py-0.5 rounded-full border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer"
                >
                  + {{ ht }}
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2: Offer Details & Editor -->
          <div v-show="currentStep === 2" class="space-y-5">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">{{ t('admin_post_details') }}</h2>

            <!-- Extra metadata inputs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Discount Strength -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_discount') }}</label>
                <input 
                  v-model="discountStrength" 
                  type="text" 
                  class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all" 
                  :placeholder="t('admin_post_discount_ph')" 
                />
              </div>

              <!-- Promo Code -->
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_promo_code') }}</label>
                <div class="flex space-x-2">
                  <input 
                    v-model="promoCode" 
                    type="text" 
                    class="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg outline-none text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-mono" 
                    :placeholder="t('admin_post_promo_ph')" 
                  />
                  <!-- Toggle Code visibility -->
                  <div class="flex items-center space-x-1.5 border border-slate-200 rounded-lg px-2 bg-slate-50">
                    <input type="checkbox" id="show_promo" v-model="showPromoCode" class="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded" />
                    <label for="show_promo" class="text-[10px] font-semibold text-slate-500 select-none cursor-pointer">{{ t('admin_post_promo_public') }}</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Date Picker for validity -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_start_date') }}</label>
                <input v-model="startDate" type="datetime-local" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1">{{ t('admin_post_end_date') }}</label>
                <input v-model="endDate" type="datetime-local" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>

            <!-- Date Presets -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-semibold mr-1">{{ t('admin_post_end_date_label') }}</span>
              <button type="button" @click="setEndDatePreset(1)" class="px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer">{{ t('admin_post_1day') }}</button>
              <button type="button" @click="setEndDatePreset(3)" class="px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer">{{ t('admin_post_3days') }}</button>
              <button type="button" @click="setEndDatePreset(7)" class="px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer">{{ t('admin_post_7days') }}</button>
              <button type="button" @click="setEndDatePreset(30)" class="px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer">{{ t('admin_post_1month') }}</button>
              <button type="button" @click="setEndDatePreset(0)" class="px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[10px] transition-all cursor-pointer">{{ t('admin_post_forever') }}</button>
              
              <!-- Custom Days Input -->
              <div class="flex items-center space-x-1 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                <input 
                  type="number" 
                  v-model.number="customDays" 
                  min="1" 
                  placeholder=""
                  @blur="applyCustomDays"
                  @change="applyCustomDays"
                  class="w-8 border-0 bg-transparent text-[10px] font-semibold text-slate-600 text-center focus:ring-0 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span class="text-[9px] text-slate-400 font-medium">{{ t('admin_post_days_later') }}</span>
              </div>
            </div>

            <!-- Content Area Editor -->
            <div>
              <div class="flex items-center justify-between border border-slate-200 rounded-t-lg bg-slate-50/80 px-3 py-1.5">
                <!-- Mode Toggle -->
                <div class="flex space-x-1.5 bg-slate-200/60 p-0.5 rounded border border-slate-300/30">
                  <button 
                    type="button" 
                    @click="switchEditorMode('markdown')"
                    :class="form.content_type === 'markdown' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'"
                    class="px-2.5 py-0.5 text-[10px] rounded transition-all font-medium"
                  >
                    {{ t('admin_post_markdown') }}
                  </button>
                  <button 
                    type="button" 
                    @click="switchEditorMode('richtext')"
                    :class="form.content_type === 'richtext' ? 'bg-white text-indigo-600 font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-800'"
                    class="px-2.5 py-0.5 text-[10px] rounded transition-all font-medium"
                  >
                    {{ t('admin_post_richtext') }}
                  </button>
                </div>

                <!-- Toolbar -->
                <div class="flex items-center space-x-1">
                  <button type="button" @click="insertFormatting('h1')" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold">{{ t('admin_post_h1') }}</button>
                  <button type="button" @click="insertFormatting('h2')" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold">{{ t('admin_post_h2') }}</button>
                  <button type="button" @click="insertFormatting('bold')" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold">{{ t('admin_post_bold') }}</button>
                  <button type="button" @click="insertFormatting('italic')" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] italic font-bold">{{ t('admin_post_italic') }}</button>
                  <button type="button" @click="insertFormatting('link')" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold">{{ t('admin_post_link') }}</button>
                  <button type="button" @click="triggerImageUpload" :disabled="uploadingImage" class="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-0.5">
                    <svg v-if="uploadingImage" class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {{ t('admin_post_image') }}
                  </button>
                  <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/bmp" class="hidden" @change="onImageSelected" />
                </div>
              </div>

              <!-- Editor inputs -->
              <div class="relative">
                <textarea 
                  v-if="form.content_type === 'markdown'"
                  v-model="form.content_md" 
                  ref="markdownTextareaRef"
                  @blur="validateField('content')"
                  class="w-full p-3 border-x border-b border-slate-200 rounded-b-lg outline-none font-mono text-xs resize-none bg-slate-50/20 h-56 focus:ring-2 focus:ring-indigo-100" 
                  :placeholder="t('admin_post_content_ph_md')"
                ></textarea>
                <div 
                  v-else
                  ref="richEditorRef"
                  contenteditable="true"
                  @input="onRichInput"
                  @blur="validateField('content')"
                  class="w-full p-4 border-x border-b border-slate-200 rounded-b-lg outline-none overflow-auto prose prose-indigo max-w-none text-xs bg-slate-50/20 h-56 focus:ring-2 focus:ring-indigo-100"
                  :placeholder="t('admin_post_content_ph_rt')"
                ></div>
                <p v-if="errors.content" class="text-red-500 text-xs mt-1">{{ errors.content }}</p>
              </div>

              <!-- Stats & Alerts -->
              <div class="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                <span>{{ t('admin_post_word_count', { n: wordCount }) }}</span>
                <span :class="wordCountTip.type === 'error' ? 'text-red-500' : 'text-slate-400'">
                  {{ wordCountTip.msg }}
                </span>
              </div>
            </div>
          </div>

          <!-- STEP 3: Preview and Publish -->
          <div v-show="currentStep === 3" class="space-y-4">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">{{ t('admin_post_check_publish') }}</h2>
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 space-y-2">
              <div class="font-bold flex items-center">
                <span>📢 {{ t('admin_post_ready') }}</span>
              </div>
              <p>{{ t('admin_post_ready_desc') }}</p>
            </div>
            
            <div class="space-y-3 pt-2">
              <div class="text-xs font-bold text-slate-700">{{ t('admin_post_checklist') }}</div>
              <ul class="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>{{ t('admin_post_check_title', { n: form.title.length }) }}</li>
                <li>{{ t('admin_post_check_category', { name: form.category || t('admin_post_not_selected') }) }}</li>
                <li>{{ t('admin_post_check_tags', { n: tagsList.length }) }}</li>
                <li>{{ t('admin_post_check_discount', { name: discountStrength || t('admin_post_not_set') }) }}</li>
                <li>{{ t('admin_post_check_promo', { name: promoCode || t('admin_post_none') }) }}</li>
              </ul>
            </div>

            <!-- Search Content Editor -->
            <div class="border border-slate-200 rounded-xl p-4">
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">
                {{ t('admin_post_search_content') }}
              </label>
              <p class="text-[10px] text-slate-400 mb-2">{{ t('admin_post_search_content_desc') }}</p>
              <textarea
                v-model="searchContent"
                rows="3"
                maxlength="500"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none text-xs resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                :placeholder="t('admin_post_search_content_ph')"
              ></textarea>
              <div class="flex items-center justify-between mt-1.5">
                <span class="text-[10px] text-slate-400 font-mono">{{ searchContent.length }} / 500</span>
                <button
                  type="button"
                  @click="refreshSearchContent"
                  class="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ t('admin_post_search_content_refresh') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Step Navigator Footer in left box -->
        <div class="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
          <button 
            type="button" 
            v-show="currentStep > 1" 
            @click="goToStep(currentStep - 1)" 
            class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {{ t('admin_post_step_prev') }}
          </button>
          <div v-show="currentStep === 1"></div>
          
          <button 
            type="button" 
            v-if="currentStep < 3" 
            @click="goToStep(currentStep + 1)" 
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer ml-auto"
          >
            {{ t('admin_post_step_next') }}
          </button>
          <button 
            type="button" 
            v-else 
            @click="submitPost"
            :disabled="submitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center cursor-pointer ml-auto disabled:opacity-50"
          >
            <svg v-if="submitting" class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ submitting ? t('admin_post_publishing') : (isEditing ? t('admin_post_save_changes') : t('admin_post_confirm_publish')) }}
          </button>
        </div>
      </div>

      <!-- Right: Real-time Interactive Preview Pane -->
      <div v-if="showPreview" class="hidden lg:flex lg:w-1/2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl flex-col overflow-hidden">
        <!-- Device & Mode Switcher Header -->
        <div class="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
          <div class="flex items-center space-x-1.5">
            <button 
              @click="previewDevice = 'desktop'" 
              :class="previewDevice === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
              class="p-1 rounded text-xs cursor-pointer flex items-center space-x-1" 
              title="Desktop"
            >
              <span>🖥️</span> <span class="text-[9px] font-bold">{{ t('admin_post_desktop') }}</span>
            </button>
            <button 
              @click="previewDevice = 'tablet'" 
              :class="previewDevice === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
              class="p-1 rounded text-xs cursor-pointer flex items-center space-x-1" 
              title="Tablet"
            >
              <span>📱</span> <span class="text-[9px] font-bold">{{ t('admin_post_tablet') }}</span>
            </button>
            <button 
              @click="previewDevice = 'mobile'" 
              :class="previewDevice === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'"
              class="p-1 rounded text-xs cursor-pointer flex items-center space-x-1" 
              title="Mobile"
            >
              <span>📲</span> <span class="text-[9px] font-bold">{{ t('admin_post_mobile') }}</span>
            </button>
          </div>
          <span class="text-[10px] text-slate-500 font-bold">🔍 {{ t('admin_post_preview_device') }}</span>
        </div>

        <!-- Scrollable Preview Workspace -->
        <div class="flex-1 overflow-y-auto p-6 bg-slate-950/40 flex flex-col items-center preview-scrollbar">
          <div 
            :style="{ width: previewWidth }"
            class="transition-all duration-300 max-w-full bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/50"
          >
            <!-- Card Head -->
            <div class="p-6 border-b border-slate-100 bg-slate-50/50">
              <div class="flex items-center gap-2 mb-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                  {{ form.category || t('admin_post_uncategorized') }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">{{ t('admin_post_just_now') }}</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight highlight-title">
                {{ form.title || t('admin_post_unnamed') }}
              </h1>
            </div>

            <!-- Highlights Metadata -->
            <div class="px-6 pt-5 flex flex-wrap gap-3">
              <div v-if="discountStrength" class="flex-1 min-w-[140px] bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center space-x-2.5 shadow-sm highlight-discount">
                <span class="text-xl">💰</span>
                <div>
                  <div class="text-[8px] uppercase font-bold text-emerald-600 tracking-wider">{{ t('admin_post_discount_label') }}</div>
                  <div class="text-xs font-bold text-slate-800">{{ discountStrength }}</div>
                </div>
              </div>
              <div v-if="promoCode && showPromoCode" class="flex-1 min-w-[140px] bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between shadow-sm highlight-code">
                <div class="flex items-center space-x-2.5">
                  <span class="text-xl">🏷️</span>
                  <div>
                    <div class="text-[8px] uppercase font-bold text-indigo-600 tracking-wider">{{ t('admin_post_promo_label') }}</div>
                    <div class="text-xs font-mono font-bold text-indigo-800">{{ promoCode }}</div>
                  </div>
                </div>
              </div>
              <div v-if="startDate || endDate" class="flex-1 min-w-[140px] bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center space-x-2.5 shadow-sm highlight-date">
                <span class="text-xl">📅</span>
                <div>
                  <div class="text-[8px] uppercase font-bold text-amber-600 tracking-wider">{{ t('admin_post_validity') }}</div>
                  <div class="text-[10px] text-slate-700">
                    <div v-if="startDate" class="scale-90 origin-left">{{ t('admin_post_start', { date: formatDate(startDate) }) }}</div>
                    <div v-if="endDate" class="scale-90 origin-left">{{ t('admin_post_end', { date: formatDate(endDate) }) }}</div>
                    <div v-else class="font-medium text-amber-800 text-[10px]">{{ t('admin_post_forever_valid') }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Rendered Body content -->
            <div class="p-6">
              <div class="prose prose-indigo prose-sm max-w-none text-xs" v-html="previewHtml"></div>
            </div>
          </div>

          <!-- Google SEO Preview Mock -->
          <div class="w-full mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div class="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">{{ t('admin_post_seo_preview') }}</div>
            <div class="space-y-1">
              <div class="text-[11px] text-slate-400 truncate">https://didton.com/post/preview-id</div>
              <div class="text-sm text-sky-400 font-medium hover:underline cursor-pointer truncate">
                {{ form.title || t('admin_post_unnamed') }} - FlarePost
              </div>
              <div class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {{ cleanContentText || t('admin_post_content_ph_md') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Feedback Overlay Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-100 animate-scale-up">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4 text-emerald-600 text-2xl">
          ✓
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">{{ t('admin_post_success_title') }}</h3>
        <p class="text-xs text-slate-500 mb-6">{{ t('admin_post_success_desc') }}</p>
        <div class="flex space-y-2 sm:space-y-0 sm:space-x-3 flex-col sm:flex-row">
          <router-link to="/admin/list" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center">
            {{ t('admin_post_view_offers') }}
          </router-link>
          <button @click="resetFormAndContinue" class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer">
            {{ t('admin_post_create_another') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Draft recovery alert -->
    <div v-if="showDraftPrompt" class="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center animate-scale-up">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4 text-amber-600 text-xl">
          ✏️
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">{{ t('admin_post_draft_title') }}</h3>
        <p class="text-xs text-slate-500 mb-6">{{ t('admin_post_draft_desc') }}</p>
        <div class="flex space-y-2 sm:space-y-0 sm:space-x-3 flex-col sm:flex-row">
          <button @click="discardDraft" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            {{ t('admin_post_draft_discard') }}
          </button>
          <button @click="restoreDraft" class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer">
            {{ t('admin_post_draft_restore') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Link Insertion Modal -->
    <div v-if="showLinkModal" class="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{{ t('admin_post_insert_link') }}</h3>
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ t('admin_post_link_text') }}</label>
            <input v-model="linkText" type="text" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500" :placeholder="t('admin_post_link_ph_text')" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">{{ t('admin_post_link_url') }}</label>
            <input v-model="linkUrl" type="text" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500" :placeholder="t('admin_post_link_ph_url')" />
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button @click="showLinkModal = false" class="flex-1 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            {{ t('admin_post_cancel') }}
          </button>
          <button @click="confirmInsertLink" class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer">
            {{ t('admin_post_confirm') }}
          </button>
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
import { parseFrontmatter, stringifyFrontmatter } from '@/utils/frontmatter'
import { t } from '@/utils/i18n'

const router = useRouter()
const route = useRoute()
const md = new MarkdownIt({ html: true, linkify: true, breaks: true })

const postId = computed(() => route.query.id as string | undefined)
const isEditing = computed(() => !!postId.value)

const currentStep = ref(1)
const previewDevice = ref('desktop')
const showPreview = ref(true)
const showSuccessModal = ref(false)

const form = ref({
  title: '',
  category: '',
  category_id: 0,
  content_md: '',
  content_html: '',
  content_type: 'markdown'
})

// Validation error messages
const errors = ref({
  title: '',
  category: '',
  content: ''
})

// Promo Code, validity, discount variables
const discountStrength = ref('')
const promoCode = ref('')
const showPromoCode = ref(true)
const startDate = ref('')
const endDate = ref('')
const customDays = ref<number | null>(null)
const searchContent = ref('')
const SEARCH_CONTENT_MAX_LENGTH = 500
const SEARCH_CONTENT_DEFAULT_LENGTH = 200

const defaultSearchContent = computed(() => {
  const content = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
  if (!content) return ''
  const text = content
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, SEARCH_CONTENT_DEFAULT_LENGTH)
})

const refreshSearchContent = () => {
  searchContent.value = defaultSearchContent.value
}

const applyCustomDays = () => {
  if (customDays.value && customDays.value > 0) {
    setEndDatePreset(customDays.value)
  }
}

const showLinkModal = ref(false)
const linkText = ref('')
const linkUrl = ref('https://')
const savedStart = ref(0)
const savedEnd = ref(0)
let savedRange: Range | null = null

const saveSelection = () => {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    savedRange = sel.getRangeAt(0)
  }
}

const restoreSelection = () => {
  if (savedRange) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }
  }
}

const tagInput = ref('')
const tagsList = ref<string[]>([])
const hotTags = ref<string[]>(['kvm', 'cheap', 'us', 'annual', 'unlimited', 'ssd', 'dDoS保护'])

const submitting = ref(false)
const showDraftPrompt = ref(false)
const showAutosaveTip = ref(false)
const enableAutosave = ref(localStorage.getItem('admin_enable_autosave') !== 'false')

const showCategoryDropdown = ref(false)
const categoriesTree = ref<any[]>([])

const richEditorRef = ref<HTMLElement | null>(null)
const markdownTextareaRef = ref<HTMLTextAreaElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const uploadingImage = ref(false)

const previewWidth = computed(() => {
  if (previewDevice.value === 'mobile') return '375px'
  if (previewDevice.value === 'tablet') return '768px'
  return '100%'
})

const previewHtml = computed(() => {
  const content = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
  const previewPlaceholder = t('admin_post_content_ph_md')
  return md.render(content || `*${previewPlaceholder}*`)
})

const wordCount = computed(() => {
  const content = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
  if (!content) return 0
  // Strip tags first
  const cleanText = content.replace(/<\/?[^>]+(>|$)/g, "").trim()
  return cleanText ? cleanText.length : 0
})

const wordCountTip = computed(() => {
  const count = wordCount.value
  if (count === 0) return { msg: t('admin_post_word_tip_empty'), type: 'info' }
  if (count < 200) return { msg: t('admin_post_word_tip_short', { n: count }), type: 'warning' }
  if (count > 1000) return { msg: t('admin_post_word_tip_long', { n: count }), type: 'info' }
  return { msg: t('admin_post_word_tip_good'), type: 'success' }
})

const cleanContentText = computed(() => {
  const content = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
  if (!content) return ''
  return content
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*`_~]/g, '')
    .trim()
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
      
      // Load category lists
      const rawCategories = data.filter((item: any) => item.code === 'category_list')
      categoriesTree.value = buildCategoryTree(rawCategories, 100)

      // Load hot tags dynamically
      const hotTagsItem = data.find((item: any) => item.code === 'hot_tags')
      if (hotTagsItem && hotTagsItem.value) {
        hotTags.value = hotTagsItem.value.split(',').map((t: string) => t.trim()).filter(Boolean)
      }
    }
  } catch (e) {
    console.error('Failed to load categories/tags:', e)
  }
}

const selectCategory = (id: number, name: string) => {
  form.value.category_id = id
  form.value.category = name
  showCategoryDropdown.value = false
  validateField('category')
}

const closeCategoryDropdownOnOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.category-select-container')) {
    showCategoryDropdown.value = false
  }
}

// Validation helper
const validateField = (field: 'title' | 'category' | 'content') => {
  if (field === 'title') {
    if (!form.value.title.trim()) {
      errors.value.title = t('admin_post_validate_title')
    } else if (form.value.title.length > 90) {
      errors.value.title = t('admin_post_validate_title_length')
    } else {
      errors.value.title = ''
    }
  }
  
  if (field === 'category') {
    if (!form.value.category_id) {
      errors.value.category = t('admin_post_validate_category')
    } else {
      errors.value.category = ''
    }
  }

  if (field === 'content') {
    const content = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
    if (!content.trim()) {
      errors.value.content = t('admin_post_validate_content')
    } else {
      errors.value.content = ''
    }
  }
}

const goToStep = (step: number) => {
  // Validate before proceeding to next steps
  if (step > 1 && currentStep.value === 1) {
    validateField('title')
    validateField('category')
    if (errors.value.title || errors.value.category) {
      showToast(t('admin_post_validate_step'), 'warning')
      return
    }
  }
  if (step > 2 && currentStep.value === 2) {
    validateField('content')
    if (errors.value.content) {
      showToast(t('admin_post_validate_content_detail'), 'warning')
      return
    }
  }
  currentStep.value = step
  // Auto-generate search content when entering Step 3
  if (step === 3 && !searchContent.value && defaultSearchContent.value) {
    searchContent.value = defaultSearchContent.value
  }
}

// Tag input functions
const addTag = () => {
  const val = tagInput.value.trim().replace(/,/g, '')
  if (val && !tagsList.value.includes(val)) {
    tagsList.value.push(val)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  tagsList.value.splice(index, 1)
}

const handleTagBackspace = () => {
  if (!tagInput.value && tagsList.value.length > 0) {
    tagsList.value.pop()
  }
}

const quickAddTag = (tag: string) => {
  if (!tagsList.value.includes(tag)) {
    tagsList.value.push(tag)
  }
}

// Date helper presets
const setEndDatePreset = (days: number) => {
  if (days === 0) {
    endDate.value = ''
    return
  }
  const date = new Date()
  date.setDate(date.getDate() + days)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  endDate.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

const formatDate = (val: string) => {
  try {
    return new Date(val).toLocaleDateString()
  } catch (e) {
    return val
  }
}

const confirmInsertLink = () => {
  showLinkModal.value = false
  const text = linkText.value.trim() || t('admin_post_link')
  const url = linkUrl.value.trim() || 'https://'
  
  if (form.value.content_type === 'richtext') {
    restoreSelection()
    richEditorRef.value?.focus()
    const linkHtml = `<a href="${url}" target="_blank" class="text-indigo-600 hover:underline font-semibold">${text}</a>`
    document.execCommand('insertHTML', false, linkHtml)
    if (richEditorRef.value) {
      form.value.content_html = richEditorRef.value.innerHTML
    }
  } else {
    const el = markdownTextareaRef.value
    if (!el) return
    const originalText = el.value
    const start = savedStart.value
    const end = savedEnd.value
    
    const replacement = `[${text}](${url})`
    form.value.content_md = originalText.substring(0, start) + replacement + originalText.substring(end)
    
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }
}

// Markdown formatting helper
const insertFormatting = (type: 'h1' | 'h2' | 'bold' | 'italic' | 'link') => {
  if (type === 'link') {
    linkUrl.value = 'https://'
    if (form.value.content_type === 'richtext') {
      saveSelection()
      const selText = window.getSelection()?.toString()
      linkText.value = selText || ''
    } else {
      const el = markdownTextareaRef.value
      if (el) {
        savedStart.value = el.selectionStart
        savedEnd.value = el.selectionEnd
        const selText = el.value.substring(el.selectionStart, el.selectionEnd)
        linkText.value = selText || ''
      } else {
        linkText.value = ''
      }
    }
    showLinkModal.value = true
    return
  }

  if (form.value.content_type === 'richtext') {
    if (type === 'h1') document.execCommand('formatBlock', false, '<h1>')
    else if (type === 'h2') document.execCommand('formatBlock', false, '<h2>')
    else if (type === 'bold') document.execCommand('bold')
    else if (type === 'italic') document.execCommand('italic')
    if (richEditorRef.value) {
      form.value.content_html = richEditorRef.value.innerHTML
    }
  } else {
    const el = markdownTextareaRef.value
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value
    const selected = text.substring(start, end)
    
    let replacement = ''
    if (type === 'h1') replacement = `# ${selected || t('admin_post_title')}`
    else if (type === 'h2') replacement = `## ${selected || t('admin_post_subtitle')}`
    else if (type === 'bold') replacement = `**${selected || t('admin_post_title')}**`
    else if (type === 'italic') replacement = `*${selected || t('admin_post_title')}*`
    
    form.value.content_md = text.substring(0, start) + replacement + text.substring(end)
    
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }
}

const triggerImageUpload = () => {
  imageInputRef.value?.click()
}

const onImageSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingImage.value = true
  const token = localStorage.getItem('adminToken')

  try {
    const formData = new FormData()
    formData.append('image', file)

    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    const data = await res.json()

    if (!res.ok) {
      showToast(data.error || t('admin_post_upload_error'), 'error')
      return
    }

    const imageUrl = data.url
    if (form.value.content_type === 'richtext') {
      richEditorRef.value?.focus()
      document.execCommand('insertHTML', false, `<img src="${imageUrl}" alt="uploaded image" style="max-width:100%" />`)
      if (richEditorRef.value) {
        form.value.content_html = richEditorRef.value.innerHTML
      }
    } else {
      const el = markdownTextareaRef.value
      if (!el) return
      const start = el.selectionStart
      const end = el.selectionEnd
      const text = el.value
      const imageMd = `![uploaded image](${imageUrl})`
      form.value.content_md = text.substring(0, start) + imageMd + text.substring(end)
      setTimeout(() => {
        el.focus()
        el.setSelectionRange(start + imageMd.length, start + imageMd.length)
      }, 0)
    }
    showToast(t('admin_post_upload_success'), 'success')
  } catch (err) {
    showToast(t('admin_post_upload_network_error'), 'error')
  } finally {
    uploadingImage.value = false
    target.value = ''
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
      let rawContent = data.content_md || ''
      if (data.content_type === 'markdown') {
        rawContent = decodeMarkdownLinks(rawContent)
      } else {
        rawContent = decodeHtmlLinks(rawContent)
      }

      const { metadata: fetchedMeta, body: cleanBody } = parseFrontmatter(rawContent)

      form.value = {
        title: data.title,
        category: data.category || '',
        category_id: data.category_id || 0,
        content_md: data.content_type === 'markdown' ? cleanBody : '',
        content_html: data.content_type === 'richtext' ? cleanBody : '',
        content_type: data.content_type || 'markdown'
      }

      promoCode.value = fetchedMeta.promo_code || ''
      showPromoCode.value = fetchedMeta.show_promo_code !== false
      startDate.value = fetchedMeta.start_date || ''
      endDate.value = fetchedMeta.end_date || ''
      discountStrength.value = fetchedMeta.discount_strength || ''
      searchContent.value = data.search_content || ''

      tagsList.value = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

      if (form.value.content_type === 'richtext') {
        setTimeout(() => {
          if (richEditorRef.value) {
            richEditorRef.value.innerHTML = form.value.content_html
          }
        }, 0)
      }
    } else {
      showToast(t('admin_post_load_failed'), 'error')
      router.push('/admin/list')
    }
  } catch (e) {
    console.error(e)
    showToast(t('admin_post_load_error'), 'error')
  }
}

const htmlToMarkdown = (html: string): string => {
  if (!html) return ''
  let mdText = html
  mdText = mdText.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
  mdText = mdText.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
  mdText = mdText.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
  mdText = mdText.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  mdText = mdText.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  mdText = mdText.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  mdText = mdText.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  mdText = mdText.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, p1) => {
    return p1.replace(/<li>(.*?)<\/li>/gi, '* $1\n') + '\n'
  })
  mdText = mdText.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, p1) => {
    let index = 1
    return p1.replace(/<li>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n'
  })
  mdText = mdText.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  mdText = mdText.replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
  mdText = mdText.replace(/<div>(.*?)<\/div>/gi, '$1\n')
  mdText = mdText.replace(/<br\s*\/?>/gi, '\n')
  mdText = mdText.replace(/<[^>]+>/g, '')
  return mdText.trim().replace(/\n{3,}/g, '\n\n')
}

const switchEditorMode = async (newMode: 'markdown' | 'richtext') => {
  if (form.value.content_type === newMode) return
  if (newMode === 'richtext') {
    const htmlContent = md.render(form.value.content_md || '')
    form.value.content_html = htmlContent
    form.value.content_type = 'richtext'
    setTimeout(() => {
      if (richEditorRef.value) richEditorRef.value.innerHTML = htmlContent
    }, 0)
  } else {
    if (await showConfirm(t('admin_post_switch_md'))) {
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

// Autosave system
let autosaveTimer: any = null
let lastSavedContent = ''

const saveDraft = (manual = false) => {
  if (form.value.content_type === 'richtext' && richEditorRef.value) {
    form.value.content_html = richEditorRef.value.innerHTML
  }

  const payload = {
    form: form.value,
    tagsList: tagsList.value,
    searchContent: searchContent.value,
    metadata: {
      promo_code: promoCode.value,
      show_promo_code: showPromoCode.value,
      start_date: startDate.value,
      end_date: endDate.value,
      discount_strength: discountStrength.value
    }
  }

  const currentContent = JSON.stringify(payload)
  localStorage.setItem('admin_draft_post', currentContent)
  lastSavedContent = currentContent
  
  if (manual) {
    showToast(t('admin_post_draft_saved'), 'success')
  } else {
    showAutosaveTip.value = true
    setTimeout(() => { showAutosaveTip.value = false }, 2000)
  }
}

const startAutosave = () => {
  if (autosaveTimer) clearInterval(autosaveTimer)
  if (!enableAutosave.value) return
  
  lastSavedContent = JSON.stringify({
    form: form.value,
    tagsList: tagsList.value,
    searchContent: searchContent.value,
    metadata: {
      promo_code: promoCode.value,
      show_promo_code: showPromoCode.value,
      start_date: startDate.value,
      end_date: endDate.value,
      discount_strength: discountStrength.value
    }
  })

  autosaveTimer = setInterval(() => {
    if (!isEditing.value && enableAutosave.value && (form.value.title || form.value.content_md || form.value.content_html)) {
      if (form.value.content_type === 'richtext' && richEditorRef.value) {
        form.value.content_html = richEditorRef.value.innerHTML
      }
      
      const payload = {
        form: form.value,
        tagsList: tagsList.value,
        searchContent: searchContent.value,
        metadata: {
          promo_code: promoCode.value,
          show_promo_code: showPromoCode.value,
          start_date: startDate.value,
          end_date: endDate.value,
          discount_strength: discountStrength.value
        }
      }
      const currentContent = JSON.stringify(payload)
      if (currentContent !== lastSavedContent) {
        saveDraft(false)
      }
    }
  }, 30000)
}

watch(enableAutosave, (newVal) => {
  localStorage.setItem('admin_enable_autosave', String(newVal))
  if (newVal) {
    if (!isEditing.value) startAutosave()
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
      form.value = data.form || form.value
      tagsList.value = data.tagsList || []
      searchContent.value = data.searchContent || ''
      
      const meta = data.metadata || {}
      promoCode.value = meta.promo_code || ''
      showPromoCode.value = meta.show_promo_code !== false
      startDate.value = meta.start_date || ''
      endDate.value = meta.end_date || ''
      discountStrength.value = meta.discount_strength || ''

      if (form.value.content_type === 'richtext') {
        setTimeout(() => {
          if (richEditorRef.value) {
            richEditorRef.value.innerHTML = form.value.content_html
          }
        }, 0)
      }
      lastSavedContent = JSON.stringify(data)
      showToast(t('admin_post_draft_restored'), 'success')
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
    if (localStorage.getItem('admin_draft_post')) {
      showDraftPrompt.value = true
    }
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

const resetFormAndContinue = () => {
  showSuccessModal.value = false
  currentStep.value = 1
  form.value = { 
    title: '', 
    category: '', 
    category_id: 0, 
    content_md: '', 
    content_html: '', 
    content_type: 'markdown' 
  }
  tagsList.value = []
  searchContent.value = ''
  promoCode.value = ''
  showPromoCode.value = true
  startDate.value = ''
  endDate.value = ''
  discountStrength.value = ''
  
  if (richEditorRef.value) richEditorRef.value.innerHTML = ''
}

const submitPost = async () => {
  validateField('title')
  validateField('category')
  validateField('content')
  
  if (errors.value.title || errors.value.category || errors.value.content) {
    showToast(t('admin_post_validate_step'), 'warning')
    return
  }

  submitting.value = true
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
    return
  }

  if (form.value.content_type === 'richtext' && richEditorRef.value) {
    form.value.content_html = richEditorRef.value.innerHTML
  }

  const meta = {
    promo_code: promoCode.value,
    show_promo_code: showPromoCode.value,
    start_date: startDate.value,
    end_date: endDate.value,
    discount_strength: discountStrength.value
  }
  const bodyText = form.value.content_type === 'markdown' ? form.value.content_md : form.value.content_html
  const contentWithFrontmatter = stringifyFrontmatter(meta, bodyText)

  const payload = {
    title: form.value.title,
    category: form.value.category,
    category_id: form.value.category_id,
    tags: tagsList.value.join(','),
    content: contentWithFrontmatter,
    content_type: form.value.content_type,
    search_content: searchContent.value || null
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
      localStorage.removeItem('admin_draft_post')
      
      if (form.value.category_id && form.value.category) {
        localStorage.setItem('recent_category_id', String(form.value.category_id))
        localStorage.setItem('recent_category_name', form.value.category)
      }

      showSuccessModal.value = true
    } else {
      const data = await res.json()
      if (res.status === 401) {
        localStorage.removeItem('adminToken')
        router.push('/admin/login')
      } else {
        showToast(t('admin_post_save_failed', { error: data.error || '' }), 'error')
      }
    }
  } catch (e) {
    console.error(e)
    showToast(t('admin_post_save_network_error'), 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
.animate-scale-up {
  animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.preview-scrollbar::-webkit-scrollbar,
.editor-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.preview-scrollbar::-webkit-scrollbar-track,
.editor-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.preview-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}
.preview-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
.editor-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 3px;
}
.editor-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.6);
}
.preview-scrollbar,
.editor-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}
</style>
