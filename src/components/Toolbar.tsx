import React, { useState, useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2,
  Palette, Highlighter, FileImage, Table, Minus,
  CaseSensitive, Quote, Link2, Unlink2,
  ChevronDown, HelpCircle, Eye, Heading1, Heading2, Heading3, Type,
  Sparkles,
  Percent
} from 'lucide-react';

interface ToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  activeFont: string;
  setActiveFont: (font: string) => void;
  activeSize: string;
  setActiveSize: (size: string) => void;
}

// Curated palette of colors
const PRESET_COLORS = [
  '#000000', '#475569', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#2563eb', '#4f46e5', '#9333ea', '#db2777',
  '#ffffff', '#cbd5e1', '#fca5a5', '#fed7aa', '#fde047', '#86efac', '#93c5fd', '#a5b4fc', '#d8b4fe', '#fbcfe8'
];

const PRESET_HIGHLIGHTS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#ddd6fe', '#cbd5e1', '#fca5a5', '#e2e8f0'
];

const FONTS = [
  { name: 'Inter', label: 'Inter (Без засечек)' },
  { name: 'Playfair Display', label: 'Playfair Display (С засечками)' },
  { name: 'Space Grotesk', label: 'Space Grotesk (Техно)' },
  { name: 'JetBrains Mono', label: 'JetBrains Mono (Моно)' },
  { name: 'Merriweather', label: 'Merriweather (Классика)' },
  { name: 'Montserrat', label: 'Montserrat (Геометрический)' },
  { name: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { name: 'Pacifico', label: 'Pacifico (Рукописный)' }
];

const SIZES = ['11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px'];

export default function Toolbar({
  editorRef,
  activeFont,
  setActiveFont,
  activeSize,
  setActiveSize
}: ToolbarProps) {
  // UI Dropdown States
  const [showFonts, setShowFonts] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  // States queried from document
  const [editorStates, setEditorStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    bulletList: false,
    numberList: false
  });

  // Table parameters
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Image parameters
  const [imageUrl, setImageUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  // Custom Colors
  const [customColor, setCustomColor] = useState('#000000');

  const fontRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync editor selections and formats
  const updateActiveStates = () => {
    if (!editorRef.current) return;
    setEditorStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight'),
      alignJustify: document.queryCommandState('justifyFull'),
      bulletList: document.queryCommandState('insertUnorderedList'),
      numberList: document.queryCommandState('insertOrderedList')
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStates();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (fontRef.current && !fontRef.current.contains(target)) setShowFonts(false);
      if (sizeRef.current && !sizeRef.current.contains(target)) setShowSizes(false);
      if (colorRef.current && !colorRef.current.contains(target)) setShowColors(false);
      if (highlightRef.current && !highlightRef.current.contains(target)) setShowHighlights(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format executor
  const execCmd = (command: string, value: string = '') => {
    if (!editorRef.current) return;
    
    // Focus on editor canvas before command invocation
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateActiveStates();
  };

  // Font adjustments
  const applyFontFamily = (fontName: string) => {
    setActiveFont(fontName);
    execCmd('fontName', fontName);
    setShowFonts(false);
  };

  const applyFontSize = (sizeStr: string) => {
    setActiveSize(sizeStr);
    
    // ExecCommand size maps 1-7. We use direct span injection style for standard exact px outputs
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // If nothing selected, just apply style to document default state
      if (range.collapsed) {
        execCmd('fontSize', '3'); // fallback wrapper
        return;
      }

      const span = document.createElement('span');
      span.style.fontSize = sizeStr;
      
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
      } catch (err) {
        // Fallback standard exec
        execCmd('fontSize', '4');
      }
    }
    setShowSizes(false);
  };

  const applyFontColor = (hex: string) => {
    execCmd('foreColor', hex);
  };

  const applyHighlightColor = (hex: string) => {
    execCmd('hiliteColor', hex);
    setShowHighlights(false);
  };

  const applyFormatBlock = (tag: string) => {
    execCmd('formatBlock', tag);
  };

  // Insert Table inside contentEditable canvas
  const insertTable = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 15px 0; border: 1px solid #e2e8f0;"><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 10px; min-width: 50px;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p>&nbsp;</p>';

    document.execCommand('insertHTML', false, tableHtml);
    setShowTableModal(false);
  };

  // Insert Image Helper
  const insertImageByUrl = () => {
    if (!imageUrl || !editorRef.current) return;
    editorRef.current.focus();
    
    const imgHtml = `<img src="${imageUrl}" referrerPolicy="no-referrer" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" alt="Uploaded Image" /><p>&nbsp;</p>`;
    document.execCommand('insertHTML', false, imgHtml);
    setImageUrl('');
    setShowImageModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && editorRef.current) {
        editorRef.current.focus();
        const imgHtml = `<img src="${dataUrl}" referrerPolicy="no-referrer" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block;" alt="Local Image" /><p>&nbsp;</p>`;
        document.execCommand('insertHTML', false, imgHtml);
        setShowImageModal(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible items-center gap-1.5 sm:gap-2 shadow-xxs print:hidden select-none z-20 relative">
      
      {/* Undo/Redo controls */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => execCmd('undo')}
          title="Отменить действие (Ctrl+Z)"
          className="p-1.5 hover:bg-white active:bg-slate-100 rounded-md text-slate-600 transition hover:text-slate-900 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('redo')}
          title="Вернуть отмененное действие (Ctrl+Y)"
          className="p-1.5 hover:bg-white active:bg-slate-100 rounded-md text-slate-600 transition hover:text-slate-900 cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Font Family Dropdown */}
      <div ref={fontRef} className="relative flex-shrink-0">
        <button
          id="toolbar-font-btn"
          onClick={() => setShowFonts(!showFonts)}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-between gap-2 w-44 shadow-xs cursor-pointer"
        >
          <span className="truncate">{activeFont}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>
        {showFonts && (
          <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-md py-2 z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            {FONTS.map(font => (
              <button
                key={font.name}
                onClick={() => applyFontFamily(font.name)}
                style={{ fontFamily: font.name }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition cursor-pointer ${
                  activeFont === font.name ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-700'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Dropdown */}
      <div ref={sizeRef} className="relative flex-shrink-0">
        <button
          id="toolbar-size-btn"
          onClick={() => setShowSizes(!showSizes)}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-between gap-2 w-20 shadow-xs cursor-pointer"
        >
          <span>{activeSize}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>
        {showSizes && (
          <div className="absolute left-0 mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-md py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            {SIZES.map(size => (
              <button
                key={size}
                onClick={() => applyFontSize(size)}
                className={`w-full text-center px-3 py-1.5 text-xs font-mono hover:bg-slate-50 transition cursor-pointer ${
                  activeSize === size ? 'text-indigo-600 font-bold bg-indigo-50/40' : 'text-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Formatting Options (B I U S) */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => execCmd('bold')}
          title="Жирный (Ctrl+B)"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.bold ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('italic')}
          title="Курсив (Ctrl+I)"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.italic ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('underline')}
          title="Подчеркнутый (Ctrl+U)"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.underline ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('strikeThrough')}
          title="Зачеркнутый"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.strikethrough ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Paragraph Formats */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => applyFormatBlock('<p>')}
          title="Обычный текст"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition text-xs font-bold cursor-pointer"
        >
          <Type className="w-4 h-4" />
        </button>
        <button
          onClick={() => applyFormatBlock('<h1>')}
          title="Заголовок 1 (H1)"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition cursor-pointer"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => applyFormatBlock('<h2>')}
          title="Заголовок 2 (H2)"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition cursor-pointer"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => applyFormatBlock('<blockquote>')}
          title="Цитата"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition cursor-pointer"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Colors Dropdown (Font Color) */}
      <div ref={colorRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowColors(!showColors)}
          title="Цвет текста"
          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 flex items-center gap-1 shadow-xs transition hover:text-slate-900 cursor-pointer"
        >
          <Palette className="w-4 h-4" />
          <div className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: customColor }} />
        </button>
        {showColors && (
          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-md p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wide mb-2">Палитра цветов</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setCustomColor(color);
                    applyFontColor(color);
                  }}
                  style={{ backgroundColor: color }}
                  className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 active:scale-95 transition shadow-xs cursor-pointer"
                />
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1">
              <input
                type="color"
                value={customColor}
                onChange={e => {
                  setCustomColor(e.target.value);
                  applyFontColor(e.target.value);
                }}
                className="w-6 h-6 p-0 border-0 cursor-pointer rounded bg-transparent"
              />
              <span className="text-xxs text-slate-500 font-mono uppercase">{customColor}</span>
            </div>
          </div>
        )}
      </div>

      {/* Highlight Background Color */}
      <div ref={highlightRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowHighlights(!showHighlights)}
          title="Цвет выделения текста"
          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 flex items-center gap-1 shadow-xs transition hover:text-slate-900 cursor-pointer"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        {showHighlights && (
          <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-md p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wide mb-2">Маркер текста</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_HIGHLIGHTS.map(color => (
                <button
                  key={color}
                  onClick={() => applyHighlightColor(color)}
                  style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                  className="w-6 h-6 rounded-md border border-slate-200/60 hover:scale-110 active:scale-95 transition shadow-sm cursor-pointer flex items-center justify-center text-[8px] text-slate-400"
                >
                  {color === 'transparent' && 'Нет'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Alignments (Left, Center, Right, Justify) */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => execCmd('justifyLeft')}
          title="Выровнять по левому краю"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.alignLeft ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('justifyCenter')}
          title="Выровнять по центру"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.alignCenter ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('justifyRight')}
          title="Выровнять по правому краю"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.alignRight ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('justifyFull')}
          title="Выровнять по ширине"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.alignJustify ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Indents */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => execCmd('insertUnorderedList')}
          title="Маркированный список"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.bulletList ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('insertOrderedList')}
          title="Нумерованный список"
          className={`p-1.5 rounded-md transition cursor-pointer ${
            editorStates.numberList ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Link Inserting Options */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => {
            const url = window.prompt('Введите адрес ссылки (например, https://example.com):');
            if (url) execCmd('createLink', url);
          }}
          title="Вставить гиперссылку"
          className="p-1.5 text-slate-600 hover:bg-white active:bg-slate-100 rounded-md transition cursor-pointer"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('unlink')}
          title="Удалить ссылку"
          className="p-1.5 text-slate-600 hover:bg-white active:bg-slate-100 rounded-md transition cursor-pointer"
        >
          <Unlink2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Insertions: Tables, Images, Lines */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs flex-shrink-0">
        <button
          onClick={() => setShowTableModal(!showTableModal)}
          title="Вставить таблицу"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition flex items-center justify-center cursor-pointer"
        >
          <Table className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowImageModal(!showImageModal)}
          title="Вставить изображение (Файл или ссылка)"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition flex items-center justify-center cursor-pointer"
        >
          <FileImage className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCmd('insertHorizontalRule')}
          title="Вставить горизонтальный разделитель"
          className="p-1.5 text-slate-600 hover:bg-white rounded-md transition flex items-center justify-center cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Clear Formatting */}
      <button
        onClick={() => {
          if (confirm('Очистить форматирование выделенного текста?')) {
            execCmd('removeFormat');
          }
        }}
        title="Очистить форматирование"
        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-red-500 shadow-xs transition cursor-pointer flex-shrink-0"
      >
        <CaseSensitive className="w-4 h-4" />
      </button>

      {/* Dropdown Modals (Table & Image modals inline as simple, responsive overlays) */}
      {showTableModal && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-md p-4 z-50 w-64 animate-in fade-in slide-in-from-top-1">
          <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <Table className="w-4 h-4 text-indigo-500" />
            Вставить таблицу
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Строки</label>
              <input
                type="number"
                min="1"
                max="10"
                value={tableRows}
                onChange={e => setTableRows(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Столбцы</label>
              <input
                type="number"
                min="1"
                max="10"
                value={tableCols}
                onChange={e => setTableCols(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowTableModal(false)}
              className="px-3 py-1.5 text-xxs bg-slate-100 text-slate-600 rounded-lg font-medium cursor-pointer hover:bg-slate-200"
            >
              Отмена
            </button>
            <button
              onClick={insertTable}
              className="px-3 py-1.5 text-xxs bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-500"
            >
              Вставить
            </button>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-md p-4 z-50 w-80 animate-in fade-in slide-in-from-top-1">
          <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <FileImage className="w-4 h-4 text-indigo-500" />
            Добавить изображение
          </h4>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Ссылка на изображение</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
              <button
                onClick={insertImageByUrl}
                disabled={!imageUrl}
                className="w-full mt-1.5 py-1.5 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-lg text-xs hover:bg-indigo-500 cursor-pointer"
              >
                Добавить по ссылке
              </button>
            </div>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-2 text-xxs text-slate-400 uppercase font-bold tracking-wide">Или загрузить</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>
            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1">Выберите локальный файл</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowImageModal(false)}
              className="px-3 py-1.5 text-xxs bg-slate-100 text-slate-600 rounded-lg font-medium cursor-pointer hover:bg-slate-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
