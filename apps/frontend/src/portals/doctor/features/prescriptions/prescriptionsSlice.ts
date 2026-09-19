import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Prescription } from '@pramana/types';
import { listPrescriptions } from '../../api/prescriptions.api';

interface PrescriptionsState {
  items: Prescription[];
  total: number;
  page: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** The record just sealed in this session, so the confirmation survives a re-render. */
  lastSealed: Prescription | null;
}

const initialState: PrescriptionsState = {
  items: [], total: 0, page: 1, status: 'idle', error: null, lastSealed: null,
};

export const fetchPrescriptions = createAsyncThunk(
  'prescriptions/fetch',
  async (query: { page?: number; state?: string; q?: string } = {}) => listPrescriptions(query),
);

const prescriptionsSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    sealed(state, action: { payload: Prescription }) {
      state.lastSealed = action.payload;
      state.items = [action.payload, ...state.items];
      state.total += 1;
    },
    sealedCleared(state) {
      state.lastSealed = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrescriptions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.status = 'ready';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message ?? 'Your prescriptions could not be loaded.';
      });
  },
});

export const { sealed, sealedCleared } = prescriptionsSlice.actions;
export const prescriptionsReducer = prescriptionsSlice.reducer;
