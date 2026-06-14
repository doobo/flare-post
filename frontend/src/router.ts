import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import PostDetail from './views/PostDetail.vue'

// Admin Views
import AdminLayout from './views/admin/Layout.vue'
import AdminLogin from './views/admin/Login.vue'
import AdminPost from './views/admin/AdminPost.vue'
import AdminList from './views/admin/AdminList.vue'
import UserList from './views/admin/UserList.vue'
import DictList from './views/admin/DictList.vue'
import MenuList from './views/admin/MenuList.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/post/:id', component: PostDetail },
  { path: '/admin/login', component: AdminLogin },
  { 
    path: '/admin', 
    component: AdminLayout,
    children: [
      { path: '', component: AdminPost },
      { path: 'list', component: AdminList },
      { path: 'users', component: UserList },
      { path: 'dictionaries', component: DictList },
      { path: 'menus', component: MenuList }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Route guard for admin
router.beforeEach((to, _, next) => {
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      next('/admin/login')
      return
    }
  }
  next()
})

export default router
