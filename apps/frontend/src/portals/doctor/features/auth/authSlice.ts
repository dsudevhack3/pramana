import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Doctor, OnboardingProgress } from '@pramana/types';
import { getMe, getOnboardingProgress } from '../../api/doctors.api';
import { setAccessToken } from '../../api/client';

/**
 * Session and identity for the signed-in doctor.
 *
 * `signingUnlocked` is deliberately separate from `authenticated`: being signed
 * in does not mean the private key has been unlocked in this browser session.
 * Signing is gated on both.
 */
interface AuthState {
  doctor: Doctor | null;
  progress: OnboardingProgress | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  signingUnlocked: boolean;
}

const initialState: AuthState = {
  doctor: null,
  progress: null,
  status: 'idle',
  error: null,
  signingUnlocked: false,
};

export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  const [doctor, progress] = await Promise.all([getMe(), getOnboardingProgress()]);
  return { doctor, progress };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenReceived(_state, action: { payload: string }) {
      setAccessToken(action.payload);
    },
    signedOut(state) {
      setAccessToken(null);
      state.doctor = null;
      state.progress = null;
      state.status = 'idle';
      state.signingUnlocked = false;
    },
    signingUnlockedChanged(state, action: { payload: boolean }) {
      state.signingUnlocked = action.payload;
    },
    doctorUpdated(state, action: { payload: Doctor }) {
      state.doctor = action.payload;
    },
    progressUpdated(state, action: { payload: Partial<OnboardingProgress> }) {
      if (state.progress) state.progress = { ...state.progress, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.status = 'ready';
        state.doctor = action.payload.doctor;
        state.progress = action.payload.progress;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message ?? 'Your profile could not be loaded. Reload the page to try again.';
      });
  },
});

export const { tokenReceived, signedOut, signingUnlockedChanged, doctorUpdated, progressUpdated } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
