'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { restoreSession } from '@/store/authSlice';
import { ToastContainer } from '@/components/ui/Toast';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(restoreSession());
  }, []);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}

