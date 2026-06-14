<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
      <div>
        <h2 class="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Login
        </h2>
        <p class="mt-2 text-center text-sm text-slate-500">
          Sign in to manage your offers
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              v-model="username"
              class="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors" 
              placeholder="Username" 
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              v-model="password"
              class="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors" 
              placeholder="Password" 
            />
          </div>
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
        
        <div class="text-center mt-4">
          <router-link to="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Home
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 1. Fetch public key from backend
    const keyRes = await fetch('/api/auth/public-key')
    if (!keyRes.ok) {
      throw new Error('Failed to retrieve secure login key')
    }
    const jwk = await keyRes.json()

    // 2. Import public key
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    )

    // 3. Encrypt the password
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password.value)
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      passwordData
    )

    // 4. Base64 encode the encrypted password
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))

    // 5. Submit encrypted credentials
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: encryptedBase64 })
    })
    
    const data = await res.json()
    
    if (res.ok && data.success) {
      localStorage.setItem('adminToken', data.token)
      router.push('/admin')
    } else {
      error.value = data.error || 'Invalid credentials'
    }
  } catch (e: any) {
    console.error(e)
    error.value = e.message || 'Failed to connect to server'
  } finally {
    loading.value = false
  }
}
</script>
