// app/providers.jsx
'use client';

import React from 'react';
import { Provider } from 'react-redux';
import store, { persistor } from '../app/store/index'; // path আপনার প্রজেক্ট অনুযায়ী ঠিক করবেন
import { PersistGate } from 'redux-persist/integration/react';

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      {/* PersistGate is client-only — it's fine inside a client component */}
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
