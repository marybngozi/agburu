import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';

const user = ref(localStorage.getItem('token') ? { token: localStorage.getItem('token') } : null);

export function useAuth() {
  const error = ref(null);
  const isPending = ref(false);
  const router = useRouter();

  const login = async (email, password) => {
    error.value = null;
    isPending.value = true;
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('token', res.token);
        user.value = { token: res.token, email: res.email };
        router.push({ name: 'admin-dashboard' });
      } else {
        error.value = res.message || 'Login failed';
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      isPending.value = false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    user.value = null;
    router.push({ name: 'login' });
  };

  return { user, error, isPending, login, logout };
}