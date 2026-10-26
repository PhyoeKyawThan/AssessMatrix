import { Platform } from 'react-native';

const LOCALHOST = 'http://localhost:8000';
const ANDROID_EMULATOR = 'http://10.0.2.2:8000';

function defaultBaseUrl(): string {
  return Platform.OS === 'android' ? ANDROID_EMULATOR : LOCALHOST;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? defaultBaseUrl()).replace(/\/+$/, '');
