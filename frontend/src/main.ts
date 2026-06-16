import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { showToast } from './utils/toast'

// Intercept global fetch to handle 401 Unauthorized errors
const originalFetch = window.fetch
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args)
    if (response.status === 401) {
      // Clear token and show notice
      localStorage.removeItem('adminToken')
      showToast('登录已失效，请重新登录。', 'error')
      
      // Redirect to login page if not already there
      if (router.currentRoute.value.path !== '/admin/login') {
        router.push('/admin/login')
      }
    }
    return response
  } catch (error) {
    throw error
  }
}

createApp(App).use(router).mount('#app')
