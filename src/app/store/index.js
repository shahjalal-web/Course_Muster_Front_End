  // src/store/index.js
  import { configureStore } from '@reduxjs/toolkit';
  import { combineReducers } from 'redux';
  import authReducer from './slices/authSlice';

  import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
  } from 'redux-persist';
  import storage from 'redux-persist/lib/storage';

  const rootReducer = combineReducers({
    auth: authReducer,
    // other reducers...
  });

  const persistConfig = { key: 'root', storage, whitelist: ['auth'] };
  const persistedReducer = persistReducer(persistConfig, rootReducer);

  export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });

  export const persistor = persistStore(store);
  export default store;
