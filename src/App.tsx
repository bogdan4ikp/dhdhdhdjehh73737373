/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import DocumentEditor from './components/DocumentEditor';
import { Document, UserSettings } from './types';
import { decryptData, encryptData, sha256 } from './utils/crypto';
import { BUILT_IN_TEMPLATES } from './utils/templates';

export default function App() {
  // Main states
  const [password, setPassword] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    autoLockMinutes: 10,
    theme: 'light',
    fontPreference: 'Inter',
    language: 'ru'
  });

  // Load basic settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('doc_vault_settings');
    if (savedSettings) {
      try {
        setUserSettings(JSON.parse(savedSettings));
      } catch (e) {
        // Fallback to default
      }
    }

    // Check if password hash exists, do NOT auto-unlock guest mode.
    // Let the AuthScreen/Welcome screen handle the initial interaction.
    const savedHash = localStorage.getItem('doc_master_hash');
    if (savedHash) {
      // If there is a password set, stay locked until unlocked
    }
  }, []);

  // Handle auto-lock inactivity timer
  useEffect(() => {
    if (!password || password === 'guest_key' || userSettings.autoLockMinutes === 0) return;

    let idleTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        handleLock();
      }, userSettings.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer(); // Start timer immediately

    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [password, userSettings.autoLockMinutes]);

  // Lock and clean sensitive memory state
  const handleLock = () => {
    setPassword(null);
    setDocuments([]);
    setSelectedDoc(null);
  };

  // Unlock and decrypt data payload
  const handleUnlock = async (masterPassword: string) => {
    setPassword(masterPassword);
    
    const encryptedPayload = localStorage.getItem('doc_encrypted_payload');
    
    if (!encryptedPayload) {
      // First sign-up or fresh reset: provision empty docs
      const initialDocs: Document[] = [];
      setDocuments(initialDocs);
      await saveDocumentsEncrypted(initialDocs, masterPassword);
    } else {
      try {
        const encryptedData = JSON.parse(encryptedPayload);
        const decryptedString = await decryptData(encryptedData, masterPassword);
        const parsedDocs = JSON.parse(decryptedString) as Document[];
        setDocuments(parsedDocs);
      } catch (err) {
        // Critical: hash matched but decryption failed (should not happen normally)
        console.error('Decryption failed', err);
        alert('Ошибка расшифровки данных. Возможно, требуется повторная авторизация.');
        handleLock();
      }
    }
  };

  // Encrypt and persist documents array
  const saveDocumentsEncrypted = async (docs: Document[], activePw: string) => {
    try {
      const stringified = JSON.stringify(docs);
      const encrypted = await encryptData(stringified, activePw);
      localStorage.setItem('doc_encrypted_payload', JSON.stringify(encrypted));
      setDocuments(docs);
    } catch (err) {
      console.error('Error encrypting and saving documents', err);
    }
  };

  // Save changes to settings
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    localStorage.setItem('doc_vault_settings', JSON.stringify(newSettings));
  };

  // Create document (optionally from built-in or custom templates)
  const handleCreateDocument = (templateId?: string | null, customTemplateContent?: string | null, customTitle?: string | null) => {
    if (!password) return;

    let content = '<div><br></div>';
    let title = customTitle || 'Новый черновик';
    let fontFamily = 'Inter';
    let fontSize = '16px';
    let category = 'Черновик';

    if (templateId) {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        content = template.content;
        title = customTitle || (templateId === 'tpl-checklist' ? template.name : `Черновик: ${template.name}`);
        fontFamily = template.fontFamily;
        fontSize = template.fontSize;
        category = templateId === 'tpl-checklist' ? 'Список' : 'Работа';
      }
    } else if (customTemplateContent) {
      content = customTemplateContent;
      title = customTitle || 'Черновик из шаблона';
      category = 'Список';
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isTemplate: false,
      isLocked: false,
      pinCode: null,
      category,
      wordCount: 0,
      charCount: 0,
      fontFamily,
      fontSize,
      orientation: 'portrait'
    };

    const updatedDocs = [newDoc, ...documents];
    saveDocumentsEncrypted(updatedDocs, password);
    setSelectedDoc(newDoc);
  };

  // Save edited document back to vault
  const handleSaveDocument = (updatedDoc: Document) => {
    if (!password) return;

    const updatedDocs = documents.map(doc => (doc.id === updatedDoc.id ? updatedDoc : doc));
    
    // Add if it doesn't exist (e.g. newly created custom template)
    if (!documents.some(doc => doc.id === updatedDoc.id)) {
      updatedDocs.unshift(updatedDoc);
    }

    saveDocumentsEncrypted(updatedDocs, password);

    // If active document is the one edited, update selector reference
    if (selectedDoc && selectedDoc.id === updatedDoc.id) {
      setSelectedDoc(updatedDoc);
    }
  };

  // Delete document
  const handleDeleteDocument = (id: string) => {
    if (!password) return;

    const updatedDocs = documents.filter(doc => doc.id !== id);
    saveDocumentsEncrypted(updatedDocs, password);

    if (selectedDoc && selectedDoc.id === id) {
      setSelectedDoc(null);
    }
  };

  // Change master key & re-encrypt documents array
  const handleChangeMasterPassword = async (oldPw: string, newPw: string): Promise<boolean> => {
    if (!password) return false;

    try {
      // Validate current password hash
      const oldHash = await sha256(oldPw);
      const storedHash = localStorage.getItem('doc_master_hash');
      
      // If setting master password for the first time from Guest Mode, oldHash can be guest_key
      if (storedHash && oldHash !== storedHash) {
        return false;
      }

      // Compute and update new hash
      const newHash = await sha256(newPw);
      localStorage.setItem('doc_master_hash', newHash);

      // Re-encrypt files using the new password key
      await saveDocumentsEncrypted(documents, newPw);
      setPassword(newPw);
      return true;
    } catch (err) {
      console.error('Password re-encryption failure', err);
      return false;
    }
  };

  // Export master JSON document backup
  const handleExportBackup = () => {
    // Only exports non-locked or fully decrypted documents
    const payload = JSON.stringify(documents, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DocuVault_РезервнаяКопия_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import master JSON backup
  const handleImportBackup = (payloadString: string): boolean => {
    if (!password) return false;

    try {
      const parsed = JSON.parse(payloadString);
      if (!Array.isArray(parsed)) return false;

      // Validate parsed content structure
      const validatedDocs: Document[] = parsed.filter(item => {
        return item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.content === 'string';
      });

      if (validatedDocs.length === 0) return false;

      // Merge backup documents with existing ones
      const existingIds = new Set(documents.map(d => d.id));
      const mergedDocs = [...documents];

      validatedDocs.forEach(doc => {
        if (existingIds.has(doc.id)) {
          // Rename or override duplicate keys safely
          doc.id = `imported-${doc.id}-${Date.now()}`;
          doc.title = `${doc.title} (Копия)`;
        }
        mergedDocs.unshift(doc);
      });

      saveDocumentsEncrypted(mergedDocs, password);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (userSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userSettings.theme]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!password ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow"
          >
            <AuthScreen onUnlock={handleUnlock} />
          </motion.div>
        ) : selectedDoc ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col"
          >
            <DocumentEditor
              document={selectedDoc}
              onBack={() => setSelectedDoc(null)}
              onSave={handleSaveDocument}
              onDelete={handleDeleteDocument}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col"
          >
            <Dashboard
              documents={documents}
              userSettings={userSettings}
              onUpdateSettings={handleUpdateSettings}
              onSelectDoc={setSelectedDoc}
              onCreateDoc={handleCreateDocument}
              onDeleteDoc={handleDeleteDocument}
              onChangeMasterPassword={handleChangeMasterPassword}
              onLock={handleLock}
              isGuestMode={password === 'guest_key'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
