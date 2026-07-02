export interface Document {
  id: string;
  title: string;
  content: string; // HTML rich content
  createdAt: number;
  updatedAt: number;
  isTemplate: boolean;
  isLocked: boolean; // locked with a unique individual PIN
  pinCode: string | null; // hashed PIN
  category: string;
  wordCount: number;
  charCount: number;
  fontFamily?: string;
  fontSize?: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  orientation?: 'portrait' | 'landscape';
}

export interface UserSettings {
  autoLockMinutes: number; // 0 for disabled, or 1, 5, 10, 15, 30
  theme: 'light' | 'dark' | 'sepia' | 'slate';
  fontPreference: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}
