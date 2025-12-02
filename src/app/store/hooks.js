// src/store/hooks.js
import { useDispatch, useSelector } from 'react-redux';

// plain JS: export these helpers for consistency
export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
