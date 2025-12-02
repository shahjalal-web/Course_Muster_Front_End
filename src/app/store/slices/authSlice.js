// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Optional: set base URL in .env as NEXT_PUBLIC_API_URL or leave empty to use relative paths
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ---------- helper to normalize server response ----------
const normalizeAuthResponse = (data) => {
  const maybeRoot = data ?? {};
  const maybeData = maybeRoot.data ?? maybeRoot;
  const user = maybeData.user ?? maybeRoot.user ?? maybeData;
  const token = maybeData.token ?? maybeRoot.token ?? maybeData.accessToken ?? null;
  return { user, token };
};

// ---------- login thunk (fetch) ----------
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.message || data?.error || res.statusText || 'Login failed';
        return rejectWithValue(message);
      }

      return normalizeAuthResponse(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Network Error');
    }
  }
);

// ---------- register thunk (fetch) ----------
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.message || data?.error || res.statusText || 'Registration failed';
        return rejectWithValue(message);
      }

      return normalizeAuthResponse(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Network Error');
    }
  }
);

// ---------- logout thunk (optional server call) ----------
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        return rejectWithValue('Logout failed');
      }

      return true;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

// -------------------- NEW: Admin thunks --------------------

// Admin login (separate endpoint)
export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.message || data?.error || res.statusText || 'Admin login failed';
        return rejectWithValue(message);
      }

      return normalizeAuthResponse(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Network Error');
    }
  }
);

// Admin register (requires secret key)
export const adminRegister = createAsyncThunk(
  'auth/adminRegister',
  async ({ name, email, password, key }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, key }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.message || data?.error || res.statusText || 'Admin registration failed';
        return rejectWithValue(message);
      }

      return normalizeAuthResponse(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Network Error');
    }
  }
);

// Admin logout (optional server call)
export const adminLogout = createAsyncThunk(
  'auth/adminLogout',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        return rejectWithValue('Admin logout failed');
      }

      return true;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error');
    }
  }
);

// -----------------------------------------------------------

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = !!token;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload ?? {};
        state.user = user ?? null;
        state.token = token ?? null;
        state.isAuthenticated = !!(token || user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })

      // register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload ?? {};
        state.user = user ?? null;
        state.token = token ?? null;
        state.isAuthenticated = !!(token || user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })

      // logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Logout failed';
      });

    // -------------------- handle admin thunks --------------------
    builder
      // admin login
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload ?? {};
        state.user = user ?? null;
        state.token = token ?? null;
        state.isAuthenticated = !!(token || user);
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Admin login failed';
      })

      // admin register
      .addCase(adminRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminRegister.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload ?? {};
        state.user = user ?? null;
        state.token = token ?? null;
        state.isAuthenticated = !!(token || user);
      })
      .addCase(adminRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Admin registration failed';
      })

      // admin logout
      .addCase(adminLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(adminLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Admin logout failed';
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
