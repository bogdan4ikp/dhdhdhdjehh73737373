import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Save, Shield, ShieldCheck, Download, Eye, FileText,
  Clock, BarChart2, BookOpen, Layers, Sparkles, AlertTriangle, Printer,
  EyeOff, ChevronRight, LayoutGrid, Trash2, HelpCircle
} from 'lucide-react';
import { Document } from '../types';
import Toolbar from './Toolbar';
import { sha256 } from '../utils/crypto';

interface DocumentEditorProps {
  document: Document;
  onBack: () => void;
  onSave: (updatedDoc: Document) => void;
  onDelete: (id: string) => void;
}

export default function DocumentEditor({
  document: initialDoc,
  onBack,
  onSave,
  onDelete
}: DocumentEditorProps) {
  const [doc, setDoc] = useState<Document>(initialDoc);
  const [isSaved, setIsSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFont, setActiveFont] = useState(initialDoc.fontFamily || 'Inter');
  const [activeSize, setActiveSize] = useState(initialDoc.fontSize || '16px');
  
  // Right Sidebar Panels
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'outline' | 'security'>('settings');

  // Stats
  const [wordCount, setWordCount] = useState(initialDoc.wordCount || 0);
  const [charCount, setCharCount] = useState(initialDoc.charCount || 0);
  const [paragraphCount, setParagraphCount] = useState(1);

  // Security features (Individual PIN lock)
  const [pinLockEnabled, setPinLockEnabled] = useState(initialDoc.isLocked);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isTemporarilyUnlocked, setIsTemporarilyUnlocked] = useState(!initialDoc.isLocked);

  // Outline
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);

  // Ruler Toggle
  const [showRuler, setShowRuler] = useState(true);

  // Layout & Margins
  const [marginSize, setMarginSize] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialDoc.orientation || 'portrait');

  const editorRef = useRef<HTMLDivElement | null>(null);

  // Setup margins mapping
  const marginClasses = {
    normal: 'p-[96px]', // 1 inch
    narrow: 'p-[48px]', // 0.5 inch
    wide: 'p-[144px]'   // 1.5 inch
  };

  // Sync state on load
  useEffect(() => {
    setDoc(initialDoc);
    setIsTemporarilyUnlocked(!initialDoc.isLocked);
    setPinLockEnabled(initialDoc.isLocked);
  }, [initialDoc]);

  // Handle auto-saving on edits
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSaved && isTemporarilyUnlocked) {
        handleSave();
      }
    }, 3000); // Auto-save after 3 seconds of silence

    return () => clearTimeout(timer);
  }, [isSaved]);

  // Read content stats and outline
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    setIsSaved(false);
    
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const paragraphs = text.split('\n').filter(p => p.trim() !== '').length || 1;

    setWordCount(words);
    setCharCount(chars);
    setParagraphCount(paragraphs);

    // Build outline from H1, H2, H3 tags
    const headingElements = Array.from(editorRef.current.querySelectorAll('h1, h2, h3, h4')) as HTMLElement[];
    const newOutline = headingElements.map((el, index) => {
      // Ensure element has an ID for scrolling
      if (!el.id) {
        el.id = `header-node-${index}`;
      }
      return {
        id: el.id,
        text: el.textContent || '',
        level: parseInt(el.tagName.substring(1)) || 1
      };
    });
    setOutline(newOutline);
  };

  // Initial stats calculation and outline generation
  useEffect(() => {
    if (editorRef.current && isTemporarilyUnlocked) {
      editorRef.current.innerHTML = doc.content;
      handleEditorInput();
      
      // Focus on editor
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 100);
    }
  }, [isTemporarilyUnlocked]);

  // Action Save
  const handleSave = async () => {
    if (!editorRef.current || !isTemporarilyUnlocked) return;
    setSaving(true);

    const updatedDoc: Document = {
      ...doc,
      content: editorRef.current.innerHTML,
      wordCount,
      charCount,
      updatedAt: Date.now(),
      fontFamily: activeFont,
      fontSize: activeSize,
      isLocked: pinLockEnabled,
      orientation
    };

    onSave(updatedDoc);
    setDoc(updatedDoc);
    setIsSaved(true);
    setSaving(false);
  };

  // individual Document PIN Lock activation
  const handleTogglePinLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setPinError('PIN-код не может быть пустым.');
      return;
    }
    if (pin.length < 4) {
      setPinError('PIN-код должен состоять минимум из 4 цифр.');
      return;
    }

    setPinError('');
    try {
      if (pinLockEnabled) {
        // Disabling PIN lock: require current PIN
        const hashedInput = await sha256(pin);
        if (hashedInput === doc.pinCode) {
          const updatedDoc = { ...doc, isLocked: false, pinCode: null };
          setDoc(updatedDoc);
          setPinLockEnabled(false);
          setIsTemporarilyUnlocked(true);
          onSave(updatedDoc);
          setPin('');
        } else {
          setPinError('Неверный PIN-код. Действие отклонено.');
        }
      } else {
        // Enabling PIN lock
        const hashedPin = await sha256(pin);
        const updatedDoc = { ...doc, isLocked: true, pinCode: hashedPin };
        setDoc(updatedDoc);
        setPinLockEnabled(true);
        setIsTemporarilyUnlocked(true);
        onSave(updatedDoc);
        setPin('');
      }
    } catch (err) {
      setPinError('Произошла ошибка авторизации.');
    }
  };

  // Unlock individual document
  const handleUnlockDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const hashedInput = await sha256(pin);
      if (hashedInput === doc.pinCode) {
        setIsTemporarilyUnlocked(true);
        setPin('');
      } else {
        setPinError('Неверный PIN-код.');
      }
    } catch (err) {
      setPinError('Произошла ошибка авторизации.');
    }
  };

  // Save as custom reusable template
  const handleSaveAsTemplate = () => {
    if (!editorRef.current) return;
    const templateName = window.prompt('Введите название для вашего нового шаблона:', `Шаблон: ${doc.title}`);
    if (!templateName) return;

    // Create a new template object
    const newTemplate: Document = {
      id: `custom-tpl-${Date.now()}`,
      title: templateName,
      content: editorRef.current.innerHTML,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isTemplate: true,
      isLocked: false,
      pinCode: null,
      category: 'Шаблон',
      wordCount,
      charCount,
      fontFamily: activeFont,
      fontSize: activeSize
    };

    onSave(newTemplate);
    alert(`"${templateName}" успешно сохранен в вашу библиотеку шаблонов!`);
  };

  // Exporters
  const handleExportText = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${doc.title}.txt`);
  };

  const handleExportHTML = () => {
    if (!editorRef.current) return;
    const bodyHtml = editorRef.current.innerHTML;
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; }
    h1 { font-size: 2em; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
    h2 { font-size: 1.5em; margin-top: 30px; }
    blockquote { border-left: 4px solid #4f46e5; padding-left: 15px; font-style: italic; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td, th { border: 1px solid #cbd5e1; padding: 10px; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${doc.title}.html`);
  };

  const handleExportMarkdown = () => {
    if (!editorRef.current) return;
    // Simple HTML to MD converter helper
    let html = editorRef.current.innerHTML;
    // Basic formatting regex replacements
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<b>(.*?)<\/b>|<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<i>(.*?)<\/i>|<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '_$1_')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]+>/g, ''); // Strip remaining tags

    const blob = new Blob([md.trim()], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${doc.title}.md`);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `${doc.title}.json`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Browser Print handler (Ctrl+P) styled flawlessly to exclude sidebars & toolbars
  const handlePrint = () => {
    window.print();
  };

  // Scroll header nodes smoothly into view
  const handleScrollToHeader = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative select-text" id="rich-editor-wrapper">
      
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-xs print:hidden z-10 flex-wrap sm:flex-nowrap gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-1/2">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer flex-shrink-0"
            title="Вернуться к списку проектов"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col flex-grow min-w-0">
            <input
              id="editor-document-title-input"
              type="text"
              value={doc.title}
              onChange={e => {
                setIsSaved(false);
                setDoc({ ...doc, title: e.target.value });
              }}
              className="text-base sm:text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-indigo-600 focus:outline-none transition py-0.5 px-1 truncate w-full max-w-xs sm:max-w-sm"
              placeholder="Безымянный документ"
            />
            
            <div className="flex items-center gap-2 sm:gap-3 text-xxs text-slate-400 mt-0.5 sm:mt-1 flex-wrap">
              <span className="hidden sm:flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Автосохранение активно
              </span>
              <span className="hidden sm:inline">•</span>
              <span className={`font-semibold ${isSaved ? 'text-green-600 font-bold' : 'text-amber-500'}`}>
                {saving ? 'Сохранение...' : isSaved ? 'Сохранено локально' : 'Несохраненные изменения'}
              </span>
              <span>•</span>
              <select
                value={doc.category}
                onChange={e => {
                  setIsSaved(false);
                  setDoc({ ...doc, category: e.target.value });
                }}
                className="bg-transparent text-slate-500 focus:outline-none font-medium hover:text-indigo-600 cursor-pointer"
              >
                <option value="Работа">💼 Работа</option>
                <option value="Личное">🏡 Личное</option>
                <option value="Черновик">📝 Черновик</option>
                <option value="Важное">⭐ Важное</option>
                <option value="Творчество">🎨 Творчество</option>
                <option value="Шаблон">📂 Шаблон</option>
              </select>
            </div>
          </div>
        </div>

        {/* Primary action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaved || !isTemporarilyUnlocked}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-semibold text-white text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Сохранить</span>
          </button>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 sm:p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 bg-white transition cursor-pointer ${
              showSidebar ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : ''
            }`}
            title="Переключить боковую панель инструментов"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content Area (Locked vs. Open) */}
      {!isTemporarilyUnlocked ? (
        <div className="flex-grow flex items-center justify-center p-4 min-h-[600px] bg-[#f8fafc]">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6 shadow-md text-center"
          >
            <div className="inline-flex p-3 bg-red-50 rounded-xl border border-red-100 mb-4 text-red-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Файл защищен паролем</h3>
            <p className="text-slate-500 text-xs mb-6">
              Этот документ защищен индивидуальным кодом. Введите 4-значный PIN-код, чтобы продолжить.
            </p>

            <form onSubmit={handleUnlockDoc} className="space-y-4">
              <input
                id="doc-pin-unlock-input"
                type="password"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-32 mx-auto text-center tracking-widest text-lg font-bold py-2 bg-white border border-slate-200 focus:border-indigo-500 text-slate-800 rounded-lg focus:outline-none transition animate-pulse"
                required
              />

              {pinError && (
                <div className="text-xs text-red-600 font-semibold">{pinError}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-1/2 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Главная
                </button>
                <button
                  id="doc-pin-unlock-submit"
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Проверить PIN
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Main Workspace with Toolbars */}
          <Toolbar
            editorRef={editorRef}
            activeFont={activeFont}
            setActiveFont={setActiveFont}
            activeSize={activeSize}
            setActiveSize={setActiveSize}
          />

          <div className="flex-grow flex relative overflow-hidden h-full">
            {/* Scrollable Document Canvas Container */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden p-0 sm:p-8 flex flex-col items-center print:p-0 print:overflow-visible bg-white sm:bg-transparent">
              
              {/* Horizontal Ruler */}
              {showRuler && (
                <div className="hidden sm:flex w-[816px] h-6 bg-white border border-slate-200 rounded-t-sm items-end px-[96px] py-1 select-none text-[8px] font-mono text-slate-400 relative shadow-sm mb-2 print:hidden flex-shrink-0">
                  <div className="absolute left-4 bottom-1 font-bold text-[9px] text-slate-500">ЛИНЕЙКА ПОЛЕЙ</div>
                  <div className="w-full flex justify-between">
                    <span>1"</span>
                    <span>2"</span>
                    <span>3"</span>
                    <span>4"</span>
                    <span>5"</span>
                    <span>6"</span>
                    <span>7"</span>
                    <span>8"</span>
                  </div>
                </div>
              )}

              {/* Physical Word-like White Sheet Page */}
              <div
                className={`bg-white sm:shadow-2xl sm:rounded-sm border-0 sm:border border-slate-200 ring-0 sm:ring-1 ring-black ring-opacity-5 transition-all duration-300 print:shadow-none print:border-none print:m-0 print:p-0 ${
                  orientation === 'portrait'
                    ? 'w-full sm:w-[816px] min-h-[calc(100vh-140px)] sm:min-h-[1056px]' // standard letter size
                    : 'w-full sm:w-[1056px] min-h-[calc(100vh-140px)] sm:min-h-[816px]'
                } ${marginClasses[marginSize].replace(/p-\[/g, 'sm:p-[')} relative flex-shrink-0`}
                onClick={() => {
                  if (editorRef.current) editorRef.current.focus();
                }}
              >
                {/* Physical sheet watermark grid guides */}
                <div className="absolute top-4 left-4 text-xxs font-mono text-slate-300 hidden sm:block print:hidden select-none">
                  {orientation === 'portrait' ? 'КНИЖНАЯ' : 'АЛЬБОМНАЯ'}
                </div>

                {/* Main Content editable area */}
                <div
                  id="rich-editor-canvas"
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  data-placeholder="Начните вводить текст здесь..."
                  style={{
                    fontFamily: `"${activeFont}", sans-serif`,
                    fontSize: activeSize,
                    minHeight: '100%'
                  }}
                  className="focus:outline-none min-h-[600px] sm:min-h-[850px] leading-relaxed break-words text-slate-800 p-4 sm:p-0"
                />
              </div>

              {/* Quick statistics tag under the page */}
              <div className="hidden sm:flex w-[816px] max-w-full justify-between items-center text-slate-400 text-xxs mt-4 px-2 print:hidden">
                <span className="flex items-center gap-1.5 font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  Стандартный макет страницы
                </span>
                <span className="font-mono">
                  Символов: {charCount} | Слов: {wordCount}
                </span>
              </div>
            </div>

            {/* Collapsible Utility Sidebar panel */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: window.innerWidth < 640 ? '100%' : 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="absolute sm:relative inset-0 sm:inset-auto bg-white border-l border-slate-200 flex flex-col flex-shrink-0 print:hidden h-full shadow-2xl sm:shadow-sm z-30 overflow-hidden"
                >
                  <div className="w-full h-full flex flex-col min-w-[320px]">
                    {/* Close button for mobile */}
                    <div className="sm:hidden flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
                      <span className="text-sm font-bold text-slate-800">Меню инструментов</span>
                      <button
                        onClick={() => setShowSidebar(false)}
                        className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-slate-200 shrink-0">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex-1 py-3 text-center text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'settings'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Разметка
                    </button>
                    <button
                      onClick={() => setActiveTab('outline')}
                      className={`flex-1 py-3 text-center text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'outline'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Содержание ({outline.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className={`flex-1 py-3 text-center text-xs font-semibold transition cursor-pointer ${
                        activeTab === 'security'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Безопасность
                    </button>
                  </div>

                  {/* Sidebar Body */}
                  <div className="flex-grow p-5 overflow-y-auto space-y-6">
                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        {/* Page Setup */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Геометрия страницы</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xxs font-bold text-slate-400 block uppercase mb-1">Ориентация</label>
                              <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                <button
                                  onClick={() => {
                                    setOrientation('portrait');
                                    setIsSaved(false);
                                  }}
                                  className={`py-1.5 text-xxs font-semibold rounded-lg transition cursor-pointer ${
                                    orientation === 'portrait' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                                  }`}
                                >
                                  Книжная
                                </button>
                                <button
                                  onClick={() => {
                                    setOrientation('landscape');
                                    setIsSaved(false);
                                  }}
                                  className={`py-1.5 text-xxs font-semibold rounded-lg transition cursor-pointer ${
                                    orientation === 'landscape' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                                  }`}
                                >
                                  Альбомная
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="text-xxs font-bold text-slate-400 block uppercase mb-1">Размер полей</label>
                              <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                                {([['normal', 'Обычные'], ['narrow', 'Узкие'], ['wide', 'Широкие']] as const).map(([size, label]) => (
                                  <button
                                    key={size}
                                    onClick={() => setMarginSize(size)}
                                    className={`py-1.5 text-xxs font-semibold rounded-lg transition cursor-pointer ${
                                      marginSize === size ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-xxs text-slate-500 font-medium">Показывать разметку линейки</span>
                              <input
                                type="checkbox"
                                checked={showRuler}
                                onChange={e => setShowRuler(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Formatting Summary */}
                        <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                            <BarChart2 className="w-4 h-4 text-indigo-500" />
                            Статистика текста
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-slate-600 mt-3">
                            <div className="bg-white p-2.5 border border-slate-200/60 rounded-xl">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Слов</p>
                              <p className="text-lg font-bold text-slate-800">{wordCount}</p>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200/60 rounded-xl">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Знаков</p>
                              <p className="text-lg font-bold text-slate-800">{charCount}</p>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200/60 rounded-xl">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Абзацев</p>
                              <p className="text-lg font-bold text-slate-800">{paragraphCount}</p>
                            </div>
                            <div className="bg-white p-2.5 border border-slate-200/60 rounded-xl flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Время чтения</p>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                ~{Math.ceil(wordCount / 180)} мин
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* File Export Tools */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Скачать и экспортировать</h4>
                          <div className="space-y-2">
                            <button
                              id="btn-export-pdf"
                              onClick={handlePrint}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left text-slate-700 text-xs transition font-semibold cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Printer className="w-4 h-4 text-slate-400" />
                                Печать / Сохранить в PDF
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              id="btn-export-md"
                              onClick={handleExportMarkdown}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left text-slate-700 text-xs transition font-semibold cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-slate-400" />
                                Экспорт в Markdown (.md)
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              id="btn-export-html"
                              onClick={handleExportHTML}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left text-slate-700 text-xs transition font-semibold cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Веб-страница HTML (.html)
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              id="btn-export-txt"
                              onClick={handleExportText}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left text-slate-700 text-xs transition font-semibold cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-slate-400" />
                                Обычный текст (.txt)
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              id="btn-export-json"
                              onClick={handleExportJSON}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-left text-slate-700 text-xs transition font-semibold cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-slate-400" />
                                Резервная копия JSON (.json)
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </div>

                        {/* Create Template option */}
                        <div className="pt-2">
                          <button
                            id="btn-save-as-template"
                            onClick={handleSaveAsTemplate}
                            className="w-full py-2.5 border border-indigo-200/80 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <LayoutGrid className="w-4 h-4" />
                            Сохранить как шаблон
                          </button>
                        </div>

                        {/* Delete document button */}
                        <div className="pt-4 border-t border-slate-100">
                          <button
                            onClick={() => {
                              if (confirm('Вы абсолютно уверены, что хотите навсегда удалить этот документ? Это действие невозможно отменить!')) {
                                onDelete(doc.id);
                              }
                            }}
                            className="w-full py-2.5 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-transparent hover:border-red-200/50 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить этот документ
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'outline' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Структура документа</h4>
                        {outline.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Заголовки не найдены.<br />Создайте заголовки H1-H4 на панели форматирования для построения содержания.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                            {outline.map((item, idx) => (
                              <button
                                key={`${item.id}-${idx}`}
                                onClick={() => handleScrollToHeader(item.id)}
                                className="w-full text-left py-1.5 px-2 hover:bg-slate-50 rounded-lg transition text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-start gap-1 cursor-pointer"
                                style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                              >
                                <span className="text-[10px] text-slate-400 select-none">#</span>
                                <span className="truncate">{item.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Защита PIN-кодом</h4>
                          <p className="text-slate-500 text-xxs leading-relaxed mb-4">
                            Установите уникальный 4-значный PIN-код на этот конкретный документ, чтобы защитить его отдельно от главного мастер-пароля. Это поможет уберечь личные записи от посторонних глаз!
                          </p>
                          
                          <form onSubmit={handleTogglePinLock} className="space-y-3 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-slate-700">Статус защиты</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                pinLockEnabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {pinLockEnabled ? 'Защищен' : 'Открыт'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wide block">
                                {pinLockEnabled ? 'Введите текущий PIN для отключения' : 'Придумайте 4-значный PIN-код'}
                              </label>
                              <input
                                id="doc-pin-security-input"
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="••••"
                                className="w-24 text-center text-sm font-bold tracking-widest py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg focus:outline-none"
                              />
                            </div>

                            {pinError && (
                              <div className="text-xxs text-red-500 font-semibold">{pinError}</div>
                            )}

                            <button
                              id="doc-pin-security-submit"
                              type="submit"
                              className={`w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                pinLockEnabled
                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              {pinLockEnabled ? 'Отключить защиту' : 'Включить защиту'}
                            </button>
                          </form>
                        </div>

                        <div className="p-3 bg-yellow-50 border border-yellow-200/50 text-yellow-800 text-xxs rounded-xl flex gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>Внимание: PIN-коды документов хранятся в зашифрованном виде на вашем устройстве. Запишите PIN-код; его невозможно восстановить в случае утери!</span>
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Styled media print definitions specifically for high-craft PDF output */}
      <style>{`
        @media print {
          body, html {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #rich-editor-wrapper {
            background-color: white !important;
            min-height: auto !important;
            display: block !important;
          }
          #rich-editor-canvas {
            min-height: auto !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden, #rich-editor-wrapper > *:not(.overflow-y-auto), #rich-editor-wrapper .flex-grow > div:not(.overflow-y-auto) {
            display: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
            padding: 0 !important;
            display: block !important;
          }
          .bg-white.shadow-xl {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
