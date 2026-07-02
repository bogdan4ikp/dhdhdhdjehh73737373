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

const DEFAULT_WELCOME_DOC: Document = {
  id: 'doc-welcome',
  title: 'Добро пожаловать в DocuVault 🔒',
  content: `
    <div style="font-family: Inter, sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="font-size: 2rem; font-weight: bold; color: #4f46e5; margin-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">Начало работы с DocuVault</h1>
      <p style="font-style: italic; color: #64748b; margin-bottom: 1.5rem;">Ваш безопасный текстовый процессор с локальным шифрованием</p>
      
      <p style="margin-bottom: 1.5rem;">Добро пожаловать! <strong>DocuVault</strong> — это полнофункциональный текстовый редактор, созданный для предоставления вам абсолютного контроля над форматированием и конфиденциальностью. Каждый созданный вами файл шифруется локально в вашем браузере с использованием <strong>256-битных ключей AES-GCM</strong>, полученных из вашего пароля (в гостевом режиме используется стандартный локальный ключ). <em>Никакие данные никогда не отправляются на внешние серверы.</em></p>

      <h2 style="font-size: 1.4rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">1. Форматирование текста как в Word</h2>
      <p style="margin-bottom: 1rem;">Сверху расположена панель инструментов. Выделите любую часть текста, чтобы изменить её параметры:</p>
      <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc;">
        <li><strong>Семейство шрифтов:</strong> Переключайтесь между строгим sans-serif, изящными шрифтами с засечками и моноширинными шрифтами для кода (например, <em>Merriweather</em>, <em>Montserrat</em>, <em>JetBrains Mono</em>).</li>
        <li><strong>Размер и цвет:</strong> Настраивайте размер букв, цвет текста и маркер выделения.</li>
        <li><strong>Структурные элементы:</strong> Легко вставляйте маркированные или нумерованные списки, горизонтальные разделители или таблицы с настраиваемыми ячейками.</li>
        <li><strong>Изображения:</strong> Вставляйте ссылки на изображения или загружайте локальные файлы; они автоматически преобразуются в безопасный формат base64 для локального хранения!</li>
      </ul>

      <h2 style="font-size: 1.4rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">2. Шаблоны документов</h2>
      <p style="margin-bottom: 1rem;">Часто создаете документы одного формата? Откройте вкладку <strong>«Параметры шаблона»</strong> на боковой панели справа и нажмите <strong>«Сохранить как шаблон»</strong>. Текущий макет будет сохранен в вашу персональную библиотеку для быстрого создания новых документов.</p>
      <p style="margin-bottom: 1.5rem;">Вы также можете изменять поля листа (нормальные, узкие, широкие) и переключать ориентацию с <strong>книжной на альбомную</strong>.</p>

      <h2 style="font-size: 1.4rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem;">3. Дополнительная защита (PIN-коды на документы)</h2>
      <p style="margin-bottom: 1rem;">Если вы хотите защитить конкретный документ от просмотра третьими лицами, откройте вкладку <strong>«Защита документа»</strong> на боковой панели. Вы можете установить отдельный 4-значный PIN-код для этого файла. Документ будет требовать ввода PIN-кода для чтения или изменения!</p>

      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 1rem; border-radius: 8px; margin: 2rem 0;">
        <h4 style="font-weight: bold; color: #4f46e5; margin: 0 0 0.5rem 0;">💡 Полезный совет</h4>
        <p style="margin: 0; font-size: 0.9em; color: #475569;">Чтобы экспортировать или распечатать документ в виде чистого PDF-файла, нажмите кнопку <strong>«Печать / Сохранить в PDF»</strong> на боковой панели или просто нажмите <strong>Ctrl + P</strong>. Приложение автоматически применит стили печати, убрав все меню и панели инструментов для идеального вывода на лист!</p>
      </div>

      <p style="font-weight: 500; color: #4f46e5; margin-top: 2rem;">Приятной работы!<br>— Команда DocuVault</p>
    </div>
  `,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isTemplate: false,
  isLocked: false,
  pinCode: null,
  category: 'Важное',
  wordCount: 420,
  charCount: 2840,
  fontFamily: 'Inter',
  fontSize: '15px',
  orientation: 'portrait'
};

export default function App() {
  // Main states
  const [password, setPassword] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    autoLockMinutes: 10,
    theme: 'slate',
    fontPreference: 'Inter'
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

    // Auto unlock if no password hash exists yet (Guest Mode without registration!)
    const savedHash = localStorage.getItem('doc_master_hash');
    if (!savedHash) {
      handleUnlock('guest_key');
    } else {
      // If there is a password set, see if it is guest_key (meaning it was set as guest initially)
      // Otherwise, stay locked until unlocked
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
      // First sign-up or fresh reset: provision the Welcome Document
      const initialDocs = [DEFAULT_WELCOME_DOC];
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
  const handleCreateDocument = (templateId?: string | null, customTemplateContent?: string | null) => {
    if (!password) return;

    let content = '<div><br></div>';
    let title = 'Новый черновик';
    let fontFamily = 'Inter';
    let fontSize = '16px';
    let category = 'Черновик';

    if (templateId) {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        content = template.content;
        title = `Черновик: ${template.name}`;
        fontFamily = template.fontFamily;
        fontSize = template.fontSize;
        category = 'Работа';
      }
    } else if (customTemplateContent) {
      content = customTemplateContent;
      title = 'Черновик из шаблона';
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
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
              onImportBackup={handleImportBackup}
              onExportBackup={handleExportBackup}
              isGuestMode={password === 'guest_key'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
