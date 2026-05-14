import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/lib/api';
import { auth } from '@/lib/firebase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithGithub,
  firebaseSignOut,
  getFirebaseIdToken,
  parseDisplayName,
  mapFirebaseAuthError,
} from '@/lib/firebaseAuth';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branch?: { _id: string; name: string; code: string };
  avatar?: string;
  authProvider?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const syncWithBackend = async (idToken: string) => {
  const { data } = await authAPI.firebaseLogin(idToken);
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
  localStorage.removeItem('offlineMode');
  if (typeof window !== 'undefined') sessionStorage.removeItem('auth-redirecting');
  return data.data;
};

const createOfflineSession = () => {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('No Firebase user');

  const parsed = parseDisplayName(fbUser);
  const user: User = {
    id: fbUser.uid,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    role: 'shop_owner',
    avatar: parsed.avatar,
    authProvider: parsed.provider,
  };
  const token = `firebase-offline-${fbUser.uid}`;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('offlineMode', 'true');
  return { user, token };
};

const isNetworkError = (err: unknown) => {
  const e = err as { code?: string; message?: string; response?: unknown };
  return !e.response && (e.code === 'ERR_NETWORK' || e.message === 'Network Error');
};

export const firebaseAuth = createAsyncThunk(
  'auth/firebaseAuth',
  async (mode: 'google' | 'github' | { type: 'email'; email: string; password: string; isSignUp: boolean; displayName?: string }, { rejectWithValue }) => {
    try {
      if (mode === 'google') await signInWithGoogle();
      else if (mode === 'github') await signInWithGithub();
      else if (mode.type === 'email') {
        if (mode.isSignUp) {
          await signUpWithEmail(mode.email, mode.password, mode.displayName || mode.email.split('@')[0]);
        } else {
          await signInWithEmail(mode.email, mode.password);
        }
      }
      const idToken = await getFirebaseIdToken();
      if (!idToken) return rejectWithValue('Failed to get Firebase token');
      try {
        return await syncWithBackend(idToken);
      } catch (syncErr) {
        if (isNetworkError(syncErr) || (syncErr as { response?: { status: number } }).response?.status === undefined) {
          return createOfflineSession();
        }
        throw syncErr;
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string; response?: { data?: { message?: string } } };
      if (error.code?.startsWith('auth/')) {
        return rejectWithValue(mapFirebaseAuthError(error.code));
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Authentication failed');
    }
  }
);

export const login = createAsyncThunk('auth/login', async (credentials: { email: string; password: string }, { rejectWithValue }) => {
  try {
    return await syncWithBackend(
      (await (async () => {
        await signInWithEmail(credentials.email, credentials.password);
        const token = await getFirebaseIdToken();
        if (!token) throw new Error('No token');
        return token;
      })())
    );
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData: Record<string, string>, { rejectWithValue }) => {
  try {
    const displayName = `${userData.firstName} ${userData.lastName}`.trim();
    await signUpWithEmail(userData.email, userData.password, displayName);
    const idToken = await getFirebaseIdToken();
    if (!idToken) throw new Error('No token');
    return await syncWithBackend(idToken);
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return rejectWithValue(error.response?.data?.message || error.message || 'Registration failed');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('offlineMode') === 'true') {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored) as User;
      return rejectWithValue('No offline user');
    }
    const token = localStorage.getItem('token');
    if (!token || token.startsWith('firebase-offline-')) {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored) as User;
      return rejectWithValue('No token');
    }
    const { data } = await authAPI.getMe();
    return data.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    const stored = localStorage.getItem('user');
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue('Session expired');
    }
    if (stored) return JSON.parse(stored) as User;
    return rejectWithValue('Could not refresh session');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await firebaseSignOut();
    await authAPI.logout();
  } catch {
    /* ignore */
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('offlineMode');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('offlineMode');
    },
    clearError: (state) => {
      state.error = null;
    },
    hydrateFromStorage: (state) => {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (stored && token) {
        state.user = JSON.parse(stored);
        state.token = token;
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => { state.isLoading = true; state.error = null; };
    const fulfilled = (state: AuthState, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    };
    const rejected = (state: AuthState, action: { payload: unknown }) => {
      state.isLoading = false;
      state.error = action.payload as string;
    };

    builder
      .addCase(firebaseAuth.pending, pending)
      .addCase(firebaseAuth.fulfilled, fulfilled)
      .addCase(firebaseAuth.rejected, rejected)
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected)
      .addCase(loadUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.token = localStorage.getItem('token');
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, hydrateFromStorage } = authSlice.actions;
export default authSlice.reducer;
