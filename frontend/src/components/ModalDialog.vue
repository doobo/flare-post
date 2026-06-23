<template>
  <div v-if="modelValue" class="relative z-50" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
         :class="{ 'cursor-pointer': closeOnOverlay && !expanded }"
         @click="onOverlayClick"></div>
    <div class="fixed inset-0 z-10" :class="expanded ? '' : 'overflow-y-auto'">
      <div :class="expanded ? 'h-full flex flex-col' : 'flex min-h-full items-center justify-center p-4 text-center sm:p-0'" @click.self="onOverlayClick">
        <div class="relative bg-white overflow-hidden transform transition-all text-left"
             :class="expanded ? 'h-full flex flex-col rounded-none shadow-none' : 'w-full max-w-lg my-8 rounded-2xl shadow-xl'">
          <div class="px-6 py-6 sm:px-8 sm:py-6" :class="expanded ? 'flex-1 overflow-y-auto' : ''">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-slate-900">{{ title }}</h3>
              <button type="button" @click="toggleExpand"
                      class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      :title="expanded ? 'Shrink' : 'Expand'">
                <svg v-if="!expanded" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8V3m0 0h5M3 3l6 6m12 0V3m0 0h-5m5 0l-6 6M3 16v5m0 0h5m-5 0l6-6m12 5v-5m0 5h-5m5 0l-6-6" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9l-6-6m6 6v4.5M15 9h4.5M15 9V4.5M15 9l6-6m-6 6v4.5m-6 4.5v4.5m0-4.5H4.5m6 0l-6 6m6-6h4.5m-4.5 0l6 6" />
                </svg>
              </button>
            </div>
            <slot />
          </div>
          <div v-if="$slots.footer" class="bg-slate-50 px-6 py-4 border-t border-slate-100 shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const expanded = ref(false)

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const onOverlayClick = () => {
  if (props.closeOnOverlay && !expanded.value) {
    emit('update:modelValue', false)
  }
}
</script>
