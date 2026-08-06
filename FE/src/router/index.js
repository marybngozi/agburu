import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LoginView from '@/views/LoginView.vue';
import Dashboard from '@/views/admin/Dashboard.vue';
import MemberForm from '@/views/admin/MemberForm.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/profile/:id',
    name: 'profile',
    component: ProfileView,
    props: true
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/add-member',
    name: 'add-member',
    component: MemberForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/edit-member/:id',
    name: 'edit-member',
    component: MemberForm,
    props: true,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard protecting the administrative routes via local JWT presence
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const token = localStorage.getItem('token');

  if (requiresAuth && !token) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;