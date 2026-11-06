import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ProfileView from '@/views/ProfileView.vue';
import LoginView from '@/views/LoginView.vue';
import SignupView from '@/views/SignupView.vue';
import Dashboard from '@/views/admin/Dashboard.vue';
import MemberForm from '@/views/admin/MemberForm.vue';
import LineageCreateView from '@/views/LineageCreateView.vue';
import LineagesView from '@/views/admin/LineagesView.vue';
import MyLineagesView from '@/views/MyLineagesView.vue';
import EditorsView from '@/views/admin/EditorsView.vue';
import LineageMapView from '@/views/LineageMapView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
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
    meta: { title: 'Sign In · Agburu' }
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
    meta: { title: 'Create Your Account · Agburu' }
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresPlatformAdmin: true, title: 'Dashboard · Agburu Admin' }
  },
  {
    // Shared by platform_admin (reached from the global directory) and
    // lineage_owner (reached from "My lineages") — see requirePersonOwnerOrAdmin
    // on the backend and the ?returnTo handling in MemberForm.vue, which is
    // the only thing that differs between the two callers.
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
    meta: { requiresAuth: true, requiresPlatformAdmin: true, title: 'Editors · Agburu Admin' }
  },
  {
    path: '/admin/lineages',
    name: 'admin-lineages',
    component: LineagesView,
    meta: { requiresAuth: true, requiresPlatformAdmin: true, title: 'Lineages · Agburu Admin' }
  },
  {
    // A signed-in lineage_owner's own scoped equivalent of /admin/lineages —
    // their own lineages only, no cross-lineage approval powers.
    path: '/my-lineages',
    name: 'my-lineages',
    component: MyLineagesView,
    meta: { requiresAuth: true, title: 'My Lineages · Agburu' }
  },
  {
    path: '/create-lineage',
    name: 'create-lineage',
    component: LineageCreateView,
    // Creating a lineage now needs an account (see BE requestLineage) so
    // every lineage has a real owner — signed-out visitors get bounced to
    // /login (which links to /signup) and back here via ?redirect=.
    meta: { requiresAuth: true, title: 'Create a Lineage · Agburu' }
  },
  {
    path: '/:slug',
    name: 'lineage',
    component: LineageMapView,
    props: true
    // No static title — LineageMapView sets its own once the lineage loads.
  },
  {
    // Anything deeper than /:slug (e.g. /foo/bar) isn't a real page.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Page not found · Agburu' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard protecting the administrative routes via local JWT presence, plus a
// role check for routes that are platform_admin-only (the global people
// directory, editors, and the all-lineages approval queue — see each
// route's requiresPlatformAdmin meta above). A lineage_owner who's simply
// not logged in yet gets sent to /login with ?redirect= so they land back
// on the page they wanted (handled by useAuth's redirectAfterAuth); one
// who's logged in but lacks the platform_admin role gets sent to their own
// "My Lineages" home instead of a 403 page, since that's almost always
// where they actually meant to go.
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresPlatformAdmin = to.matched.some((record) => record.meta.requiresPlatformAdmin);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    // A KNOWN non-admin role gets redirected client-side as a courtesy.
    // role === null (a session from before this role check existed, or any
    // other unexpected gap) falls through instead of guessing — the
    // backend's own requirePlatformAdmin still enforces the real boundary
    // on every API call that route makes, so this is a UX nicety, not the
    // security check.
  } else if (requiresPlatformAdmin && role && role !== 'platform_admin') {
    next({ name: 'my-lineages' });
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
