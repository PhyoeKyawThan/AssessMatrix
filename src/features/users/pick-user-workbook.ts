import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';

import type { UploadAsset } from '@/features/users/api';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function pickWebWorkbook(): Promise<UploadAsset | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? {
        uri: URL.createObjectURL(file), name: file.name,
        type: file.type || XLSX_MIME, webFile: file,
      } : null);
    };
    input.click();
  });
}

export async function pickUserWorkbook(): Promise<UploadAsset | null> {
  if (Platform.OS === 'web') return pickWebWorkbook();

  const result = await ExpoFile.pickFileAsync({
    mimeTypes: [XLSX_MIME],
    multipleFiles: false,
  });
  if (result.canceled) return null;
  const file = result.result;
  return {
    uri: file.uri,
    name: file.name || 'users.xlsx',
    type: file.type || XLSX_MIME,
  };
}
