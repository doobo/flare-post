<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="state.visible" class="confirm-overlay" @click.self="cancel">
        <div class="confirm-panel">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="confirm-message">{{ state.message }}</div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancel">Cancel</button>
            <button class="confirm-btn confirm" @click="ok">Confirm</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getConfirmState, subscribe, confirmAction } from '@/utils/confirm'

const state = ref(getConfirmState())
let unsub: (() => void) | null = null

onMounted(() => {
  unsub = subscribe(() => {
    state.value = { ...getConfirmState() }
  })
})

onUnmounted(() => {
  unsub?.()
})

function ok() {
  confirmAction(true)
}

function cancel() {
  confirmAction(false)
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.confirm-panel {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 28px 32px 24px;
  max-width: 420px;
  width: 90%;
  color: #f1f5f9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-icon svg {
  width: 40px;
  height: 40px;
  color: #fbbf24;
}

.confirm-message {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.55;
  letter-spacing: -0.01em;
  margin-bottom: 24px;
  color: #e2e8f0;
  user-select: none;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.confirm-btn {
  flex: 1;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn.cancel {
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.confirm-btn.cancel:hover {
  background: rgba(148, 163, 184, 0.16);
  color: #f1f5f9;
}

.confirm-btn.confirm {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.confirm-btn.confirm:hover {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.confirm-btn.confirm:active {
  transform: translateY(0);
}

/* Transitions */
.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-panel,
.confirm-leave-to .confirm-panel {
  transform: scale(0.92);
}

@media (max-width: 480px) {
  .confirm-panel {
    padding: 24px 20px 20px;
    max-width: 90%;
  }

  .confirm-icon svg {
    width: 32px;
    height: 32px;
  }

  .confirm-message {
    font-size: 14px;
  }
}
</style>
