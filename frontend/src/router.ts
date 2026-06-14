import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Admin from './views/Admin.vue'

import PostDetail from './views/PostDetail.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/admin', component: Admin },
  { path: '/post/:id', component: PostDetail },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
