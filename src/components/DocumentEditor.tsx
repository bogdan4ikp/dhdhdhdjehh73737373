import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Download, FileText, Check, List,
  Bold, Italic, Underline, Heading1, Heading2, ListOrdered,
  X, Printer, ListTodo, Trash2, Plus
} from 'lucide-react';
import { Document } from '../types';

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
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Custom list builder states
  const [showListBuilderModal, setShowListBuilderModal] = useState(false);
  const [listBuilderTitle, setListBuilderTitle] = useState('');
  const [listBuilderItems, setListBuilderItems] = useState<string[]>(['']);
  
  // Sync state on load
  useEffect(() => {
    setDoc(initialDoc);
  }, [initialDoc]);

  // Handle auto-saving on edits
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSaved) {
        handleSave();
      }
    }, 2000); // Auto-save after 2 seconds of silence

    return () => clearTimeout(timer);
  }, [isSaved, doc]);

  // Read content stats
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    setIsSaved(false);
    
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    setDoc(prev => ({
      ...prev,
      content: editorRef.current!.innerHTML,
      wordCount: words,
      charCount: chars,
      updatedAt: Date.now()
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSaved(false);
    setDoc(prev => ({
      ...prev,
      title: e.target.value,
      updatedAt: Date.now()
    }));
  };

  // Initial content loading
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== doc.content) {
      editorRef.current.innerHTML = doc.content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Action Save
  const handleSave = () => {
    onSave(doc);
    setIsSaved(true);
  };

  const getPlainText = (html: string) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    
    // Replace breaks/paragraphs with standard formatting
    const elements = temp.querySelectorAll('p, div, br, h1, h2, h3, li');
    elements.forEach(el => {
      if (el.tagName === 'BR') {
        el.after('\n');
      } else {
        el.after('\n');
      }
    });
    
    return temp.textContent || temp.innerText || "";
  };

  const downloadTxtFormat = () => {
    handleSave();
    const element = document.createElement("a");
    const plainText = getPlainText(doc.content);
    const file = new Blob([plainText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title || 'document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadDocFormat = () => {
    handleSave();
    const element = document.createElement("a");
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${doc.title || 'document'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #334155; }
          h1 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          h2 { color: #1e293b; margin-top: 24px; }
          h3 { color: #334155; margin-top: 18px; }
          p { margin-bottom: 12px; }
          ul, ol { margin-left: 20px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h1>${doc.title || 'document'}</h1>
        ${doc.content}
      </body>
      </html>
    `;
    const file = new Blob([htmlContent], {type: 'application/msword;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title || 'document'}.doc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadHtmlFormat = () => {
    handleSave();
    const element = document.createElement("a");
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${doc.title || 'document'}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.7;
            color: #334155;
            max-width: 680px;
            margin: 40px auto;
            padding: 0 20px;
          }
          h1 { color: #0f172a; font-size: 2.25rem; font-weight: 700; margin-bottom: 1.5rem; }
          h2 { color: #1e293b; font-size: 1.5rem; font-weight: 600; margin-top: 2rem; }
          h3 { color: #334155; font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; }
          p { margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <h1>${doc.title || 'document'}</h1>
        ${doc.content}
      </body>
      </html>
    `;
    const file = new Blob([htmlContent], {type: 'text/html;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title || 'document'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownload = () => {
    handleSave();
    setShowExportModal(true);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        setSavedSelection(range);
      }
    }
  };

  const formatText = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleAddListBuilderItem = () => {
    setListBuilderItems([...listBuilderItems, '']);
  };

  const handleListBuilderItemChange = (index: number, value: string) => {
    const updated = [...listBuilderItems];
    updated[index] = value;
    setListBuilderItems(updated);
  };

  const handleRemoveListBuilderItem = (index: number) => {
    if (listBuilderItems.length > 1) {
      setListBuilderItems(listBuilderItems.filter((_, i) => i !== index));
    }
  };

  const handleInsertChecklistFromModal = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }

    const title = listBuilderTitle.trim();
    const itemsHtml = listBuilderItems
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => `
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px; margin-bottom: 6px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          &nbsp;<span style="font-size: 1.05rem;">${item}</span>
        </div>
      `).join('');

    const checklistHtml = `
      <div style="font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; margin-top: 12px; margin-bottom: 12px;">
        ${title ? `<h3 style="margin-bottom: 8px;">${title}</h3>` : ''}
        ${itemsHtml || `
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px; margin-bottom: 6px;">
            <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
            &nbsp;<span style="font-size: 1.05rem;">Новая задача</span>
          </div>
        `}
      </div>
    `;

    document.execCommand('insertHTML', false, checklistHtml);
    handleEditorInput();
    setShowListBuilderModal(false);
  };

  const insertChecklistItem = () => {
    saveSelection();
    setListBuilderTitle('');
    setListBuilderItems(['']);
    setShowListBuilderModal(true);
  };

  return (
    <div className="h-[100dvh] bg-white dark:bg-slate-900 flex flex-col font-sans select-none w-full relative overflow-hidden transition-colors duration-300">
      
      {/* Top Header */}
      <header className="px-4 py-4 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-transparent transition-colors duration-300">
        <button 
          onClick={() => { handleSave(); onBack(); }}
          className="text-slate-900 dark:text-white p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
          {doc.title || 'Новый документ'}
        </h1>
        
        <button 
          onClick={handleDownload}
          title="Скачать файл"
          className="text-slate-900 dark:text-white p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
        >
          <Download className="w-6 h-6" />
        </button>
      </header>

      {/* Main Editor Content Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        {/* Title Input (Acting as H1) */}
        <input
          type="text"
          value={doc.title}
          onChange={handleTitleChange}
          placeholder="Заголовок"
          className="w-full text-3xl font-bold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
        />

        {/* Rich Text Area */}
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onPointerUp={saveSelection}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
              const cb = target as HTMLInputElement;
              if (cb.hasAttribute('checked')) {
                cb.removeAttribute('checked');
              } else {
                cb.setAttribute('checked', 'checked');
              }
              handleEditorInput();
            }
          }}
          data-placeholder="Начните вводить текст здесь..."
          className="flex-1 w-full text-[17px] leading-relaxed text-slate-700 dark:text-slate-300 outline-none pb-32"
          style={{ minHeight: '50vh' }}
        />
      </main>

      {/* Floating Toolbar (Simulating keyboard accessory bar) */}
      <div 
        className="bg-[#F2F2F7] dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-2 pt-3 flex items-center justify-between z-20 shrink-0 w-full relative transition-colors duration-300"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
          <select 
            onChange={(e) => formatText('fontName', e.target.value)}
            className="p-2 bg-transparent text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            defaultValue="Inter"
          >
            <option value="Inter">Inter</option>
            <option value="Merriweather">Serif</option>
            <option value="JetBrains Mono">Mono</option>
          </select>

          <select 
            onChange={(e) => formatText('foreColor', e.target.value)}
            className="p-2 bg-transparent text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
            defaultValue="currentColor"
          >
            <option value="currentColor">Цвет</option>
            <option value="#3b82f6">Синий</option>
            <option value="#ef4444">Красный</option>
            <option value="#10b981">Зеленый</option>
            <option value="#8b5cf6">Фиолетовый</option>
            <option value="#f59e0b">Оранжевый</option>
          </select>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>

          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <Italic className="w-5 h-5" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('underline'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <Underline className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>

          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('insertUnorderedList'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('insertOrderedList'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <ListOrdered className="w-5 h-5" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); insertChecklistItem(); }}
            title="Вставить список задач (Новое)"
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0 flex items-center gap-1 border border-dashed border-emerald-300 dark:border-emerald-800/40"
          >
            <ListTodo className="w-5 h-5 text-emerald-500" />
            <span className="text-[8px] bg-emerald-500 text-white font-extrabold px-1 py-0.2 rounded-sm uppercase scale-90">NEW</span>
          </button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 shrink-0"></div>

          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('formatBlock', 'H2'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <Heading1 className="w-5 h-5" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); formatText('formatBlock', 'H3'); }}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            <Heading2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Indicator */}
        <div className="px-3 flex items-center justify-center">
          {!isSaved ? (
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
          ) : (
            <Check className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          )}
        </div>
      </div>

      {/* Export Format Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Экспорт файла</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Выберите формат для сохранения документа на устройство:</p>
            
            <div className="space-y-3">
              {/* PDF option */}
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setTimeout(() => {
                    window.print();
                  }, 250);
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center flex-shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">PDF Документ (.pdf)</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Сохранить с исходным оформлением</div>
                </div>
              </button>

              {/* DOC Option */}
              <button
                onClick={() => {
                  downloadDocFormat();
                  setShowExportModal(false);
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white font-sans">Документ Word (.doc)</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Идеально для Word и LibreOffice</div>
                </div>
              </button>

              {/* Web Page (.html) */}
              <button
                onClick={() => {
                  downloadHtmlFormat();
                  setShowExportModal(false);
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white font-sans">Веб-страница (.html)</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Открывается в любом браузере</div>
                </div>
              </button>

              {/* TXT Option */}
              <button
                onClick={() => {
                  downloadTxtFormat();
                  setShowExportModal(false);
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-left transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Текстовый файл (.txt)</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Простой текст без стилей</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive List Builder Modal */}
      <AnimatePresence>
        {showListBuilderModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
                    <ListTodo className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Создание списка задач</h3>
                </div>
                <button 
                  onClick={() => setShowListBuilderModal(false)}
                  className="text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List Title Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Заголовок списка (необязательно)
                </label>
                <input
                  type="text"
                  value={listBuilderTitle}
                  onChange={(e) => setListBuilderTitle(e.target.value)}
                  placeholder="например, Список покупок"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-semibold"
                />
              </div>

              {/* Items Container with scroll */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Пункты списка
                </label>
                
                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {listBuilderItems.map((item, index) => (
                    <motion.div 
                      key={index} 
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 flex items-center justify-center text-xs text-slate-300">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleListBuilderItemChange(index, e.target.value)}
                        placeholder={`Пункт ${index + 1}`}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddListBuilderItem();
                          }
                        }}
                      />
                      {listBuilderItems.length > 1 && (
                        <button
                          onClick={() => handleRemoveListBuilderItem(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add Item Button */}
                <button
                  onClick={handleAddListBuilderItem}
                  className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Добавить пункт
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={() => setShowListBuilderModal(false)}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleInsertChecklistFromModal}
                  className="flex-1 py-3 text-white font-bold text-sm bg-blue-500 hover:bg-blue-600 rounded-xl transition shadow-md shadow-blue-500/15 cursor-pointer"
                >
                  Вставить в текст
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Area */}
      <div id="print-area" className="hidden print:block">
        <h1>{doc.title || 'Untitled'}</h1>
        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      </div>
    </div>
  );
}
