<template>
  <div class="category-tree-root">
    <button
      @click="$emit('select', '')"
      :class="selectedValue === '' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
      class="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
    >
      {{ allLabel }}
    </button>
    <div v-for="parent in tree" :key="parent.id" class="mt-0.5">
      <div class="px-3 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ parent.name }}</div>
      <button
        v-for="child in flattenChildren(parent)" :key="child.id"
        @click="$emit('select', child.label)"
        :class="selectedValue === child.label ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'"
        class="w-full text-left px-3 py-1 pl-6 rounded-lg text-sm transition-colors"
      >
        {{ child.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CategoryNode {
  id: number
  name: string
  label: string
  children: CategoryNode[]
}

defineProps<{
  tree: CategoryNode[]
  selectedValue: string
  allLabel: string
}>()

defineEmits<{
  (e: 'select', label: string): void
}>()

const flattenChildren = (parent: CategoryNode): CategoryNode[] => {
  if (!parent.children || parent.children.length === 0) {
    return [{ id: parent.id, name: parent.name, label: parent.label, children: [] }]
  }
  return parent.children
}
</script>
