// Client-side Web Crypto API helpers for password hashing and AES-GCM encryption

export async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert Uint8Array to Hex
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex to Uint8Array
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Derive AES-GCM key from password using PBKDF2
async function deriveKey(password: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as raw key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the 256-bit AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 10000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt payload
export async function encryptData(
  text: string,
  password: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);

  // Generate a random 16-byte salt and 12-byte IV
  const saltBuffer = window.crypto.getRandomValues(new Uint8Array(16));
  const ivBuffer = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, saltBuffer.buffer);

  // Encrypt the text data
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer.buffer
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: bufferToHex(ivBuffer.buffer),
    salt: bufferToHex(saltBuffer.buffer)
  };
}

// Decrypt payload
export async function decryptData(
  encrypted: { ciphertext: string; iv: string; salt: string },
  password: string
): Promise<string> {
  try {
    const saltBuffer = hexToBuffer(encrypted.salt);
    const ivBuffer = hexToBuffer(encrypted.iv);
    const ciphertextBuffer = base64ToArrayBuffer(encrypted.ciphertext);

    const key = await deriveKey(password, saltBuffer);

    // Decrypt the text data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Authentication or Decryption failed. Incorrect password.');
  }
}
