<template>
  <router-view></router-view>
  
  <ConfirmDialog />
  <!-- Global Toasts Container -->
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          :class="['toast-item', `toast-${toast.type}`]"
        >
          <!-- Icon based on type -->
          <div class="toast-icon">
            <!-- Success -->
            <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <!-- Error -->
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <!-- Warning -->
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <!-- Info -->
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button @click="removeToast(toast.id)" class="toast-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <!-- Progress bar -->
          <div class="toast-progress" :style="{ animationDuration: '4s' }"></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onToast, type ToastType } from './utils/toast'
import ConfirmDialog from './components/ConfirmDialog.vue'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let toastId = 0

const addToast = (message: string, type: ToastType) => {
  const id = toastId++
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 4000)
}

const removeToast = (id: number) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = onToast(({ message, type }) => {
    addToast(message, type)
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<style>
/* ===== Toast Container ===== */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  max-width: 400px;
  width: 100%;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* ===== Toast Item ===== */
.toast-item {
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Type-specific left border accent */
.toast-success {
  border-left: 3px solid #34d399;
}
.toast-error {
  border-left: 3px solid #fb7185;
}
.toast-warning {
  border-left: 3px solid #fbbf24;
}
.toast-info {
  border-left: 3px solid #818cf8;
}

/* ===== Icon ===== */
.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-icon svg {
  width: 20px;
  height: 20px;
}

.toast-success .toast-icon svg {
  color: #34d399;
}
.toast-error .toast-icon svg {
  color: #fb7185;
  animation: toast-shake 0.4s ease-in-out;
}
.toast-warning .toast-icon svg {
  color: #fbbf24;
}
.toast-info .toast-icon svg {
  color: #818cf8;
}

/* ===== Message ===== */
.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
  user-select: none;
  letter-spacing: -0.01em;
}

/* ===== Close Button ===== */
.toast-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(148, 163, 184, 0.6);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.08);
}

.toast-close svg {
  width: 14px;
  height: 14px;
}

/* ===== Progress Bar ===== */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 0 0 16px 16px;
  animation: toast-progress-shrink linear forwards;
}

.toast-success .toast-progress {
  background: linear-gradient(90deg, #34d399, #10b981);
}
.toast-error .toast-progress {
  background: linear-gradient(90deg, #fb7185, #f43f5e);
}
.toast-warning .toast-progress {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}
.toast-info .toast-progress {
  background: linear-gradient(90deg, #818cf8, #6366f1);
}

@keyframes toast-progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* ===== Transitions ===== */
.toast-enter-active {
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}
.toast-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== Animations ===== */
@keyframes toast-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

/* ===== Responsive ===== */
@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
  }
}
</style>
