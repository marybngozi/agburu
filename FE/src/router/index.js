import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LoginView from '@/views/LoginView.vue';
import Dashboard from '@/views/admin/Dashboard.vue';
import MemberForm from '@/views/admin/MemberForm.vue';
import LineageCreateView from '@/views/LineageCreateView.vue';
import LineagesView from '@/views/admin/LineagesView.vue';
import EditorsView from '@/views/admin/EditorsView.vue';
import LineageMapView from '@/views/LineageMapView.vue';
import { setPageTitle } from '@/composables/useDocumentMeta';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Agburu — Family Lineage Archive' }
  },
  {
    path: '/profile/:id',
    name: 'profile',
    component: ProfileView,
    props: true
    // No static title here — ProfileView sets its own once the person's
    // record loads (see setPageTitle call in loadWorkspaceProfile).
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Sign In · Agburu Admin' }
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, title: 'Dashboard · Agburu Admin' }
  },
  {
    path: '/admin/add-member',
    name: 'add-member',
    component: MemberForm,
    meta: { requiresAuth: true }
    // No static title — MemberForm sets 'Add New Person' / 'Edit <name>'.
  },
  {
    path: '/admin/edit-member/:id',
    name: 'edit-member',
    component: MemberForm,
    props: true,
    meta: { requiresAuth: true }
    // No static title — MemberForm sets 'Add New Person' / 'Edit <name>'.
  },
  {
    path: '/admin/editors',
    name: 'admin-editors',
    component: EditorsView,
    meta: { requiresAuth: true, title: 'Editors · Agburu Admin' }
  },
  {
    path: '/admin/lineages',
    name: 'admin-lineages',
    component: LineagesView,
    meta: { requiresAuth: true, title: 'Lineages · Agburu Admin' }
  },
  {
    path: '/create-lineage',
    name: 'create-lineage',
    component: LineageCreateView,
    meta: { title: 'Create a Lineage · Agburu' }
  },
  {
    path: '/:slug',
    name: 'lineage',
    component: LineageMapView,
    props: true
    // No static title — LineageMapView sets its own once the lineage loads.
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

// Sets the browser tab title (and resets the meta description to the site
// default) on every navigation. Routes with dynamic content — profile,
// add/edit member, lineage map — have no static meta.title, so this call
// falls back to the site default until that view's own data finishes
// loading and calls setPageTitle again with the real name/lineage.
router.afterEach((to) => {
  setPageTitle(to.meta.title);
});

export default router;
