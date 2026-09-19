import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { prescriptionsReducer } from '../features/prescriptions/prescriptionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    prescriptions: prescriptionsReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      // CryptoKey and Blob instances must never enter the store; this catches
      // it in development if someone tries.
      serializableCheck: { ignoredPaths: [] },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
