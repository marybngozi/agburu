import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';

const user = ref(
  localStorage.getItem('token')
    ? { token: localStorage.getItem('token'), role: localStorage.getItem('role') }
    : null,
);

// Where to land after a successful login/signup when the route that sent
// the visitor to /login or /signup didn't ask for a specific page back (via
// ?redirect=, set by the router guard below) — e.g. typing /login directly.
// A lineage_owner's natural home is their own lineages; the other two roles
// (platform_admin, profile_editor) keep the original admin dashboard.
const defaultDestinationForRole = (role) =>
  role === 'lineage_owner' ? { name: 'my-lineages' } : { name: 'admin-dashboard' };

const persistSession = ({ token, email, username, role }) => {
  localStorage.setItem('token', token);
  if (role) localStorage.setItem('role', role);
  user.value = { token, email, username, role };
};

// Drops the local session (used on logout and when the server rejects an
// expired token — see main.js).
export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  user.value = null;
};

export function useAuth() {
  const error = ref(null);
  const isPending = ref(false);
  const router = useRouter();
  // useRoute() throws outside a component with an active router view (e.g.
  // if this composable were ever called from plain JS), so this is read
  // defensively — a missing ?redirect= just falls back to the role default.
  let currentRoute;
  try {
    currentRoute = useRoute();
  } catch {
    currentRoute = null;
  }

  const redirectAfterAuth = (role) => {
    const redirect = currentRoute?.query?.redirect;
    router.push(redirect ? String(redirect) : defaultDestinationForRole(role));
  };

  const login = async (email, password) => {
    error.value = null;
    isPending.value = true;
    try {
      const res = await api.login({ email, password });
      persistSession(res);
      redirectAfterAuth(res.role);
    } catch (err) {
      error.value = err.message;
    } finally {
      isPending.value = false;
    }
  };

  const signup = async (username, email, password) => {
    error.value = null;
    isPending.value = true;
    try {
      const res = await api.signup({ username, email, password });
      persistSession(res);
      redirectAfterAuth(res.role);
    } catch (err) {
      error.value = err.message;
    } finally {
      isPending.value = false;
    }
  };

  const logout = () => {
    clearSession();
    router.push({ name: 'login' });
  };

  return { user, error, isPending, login, signup, logout };
}