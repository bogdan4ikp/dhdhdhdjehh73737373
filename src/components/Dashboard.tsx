import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus, Search, Lock, ShieldCheck, Settings, KeyRound, LogOut,
  Folder, Calendar, FileText, Download, Upload, Trash2, LayoutGrid,
  ChevronRight, ArrowRightLeft, Clock, ShieldAlert, Check, HelpCircle
} from 'lucide-react';
import { Document, UserSettings } from '../types';
import { BUILT_IN_TEMPLATES } from '../utils/templates';

interface DashboardProps {
  documents: Document[];
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onSelectDoc: (doc: Document) => void;
  onCreateDoc: (templateId?: string | null, customTemplateContent?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onChangeMasterPassword: (oldPw: string, newPw: string) => Promise<boolean>;
  onLock: () => void;
  onImportBackup: (payload: string) => boolean;
  onExportBackup: () => void;
  isGuestMode?: boolean;
}

export default function Dashboard({
  documents,
  userSettings,
  onUpdateSettings,
  onSelectDoc,
  onCreateDoc,
  onDeleteDoc,
  onChangeMasterPassword,
  onLock,
  onImportBackup,
  onExportBackup,
  isGuestMode = false
}: DashboardProps) {
  // Query Filters & Searching
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Все');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'words'>('updated');

  // Master Settings UI state
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // Backup loading
  const [backupPayload, setBackupPayload] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Categories list in Russian matching Document properties
  const categories = ['Все', 'Работа', 'Личное', 'Черновик', 'Важное', 'Творчество', 'Шаблон'];

  // Handle document counts
  const regularDocs = documents.filter(d => !d.isTemplate);
  const customTemplates = documents.filter(d => d.isTemplate);

  // Filter regular documents
  const filteredDocs = regularDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || 
                          doc.content.toLowerCase().includes(search.toLowerCase());
    
    // Map category check
    if (categoryFilter === 'Все') return matchesSearch;
    return matchesSearch && doc.category === categoryFilter;
  });

  // Sort filtered regular documents
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'words') {
      return (b.wordCount || 0) - (a.wordCount || 0);
    }
    return b.updatedAt - a.updatedAt; // default to modified time descending
  });

  // Handle Master PW modification
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword.length < 4) {
      setPwError('Новый пароль должен содержать не менее 4 символов.');
      return;
    }

    const currentOldPw = isGuestMode ? 'guest_key' : oldPassword;
    const success = await onChangeMasterPassword(currentOldPw, newPassword);
    if (success) {
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
      // Reload page or let parent state update to reflect non-guest mode
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setPwError('Неверный текущий пароль. Не удалось обновить ключ.');
    }
  };

  // Import JSON backup flow
  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setBackupError('');
    setBackupSuccess(false);

    if (!backupPayload.trim()) {
      setBackupError('Данные файла резервной копии пусты.');
      return;
    }

    const success = onImportBackup(backupPayload);
    if (success) {
      setBackupSuccess(true);
      setBackupPayload('');
    } else {
      setBackupError('Ошибка импорта. Убедитесь, что формат файла соответствует структуре DocuVault.');
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBackupPayload(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans select-none">
      
      {/* Top dashboard header bar */}
      <header className="bg-white border-b border-slate-200 text-slate-900 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
            D
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none sm:leading-normal">
              Docu<span className="text-indigo-600 font-bold">Vault</span>
            </h1>
            <p className="hidden sm:block text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
              Безопасный центр документов
            </p>
          </div>
        </div>

        {/* Header Action Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-nav-settings"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 sm:px-4 sm:py-2 border rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showSettings 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
            title="Настройки хранилища"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Настройки</span>
          </button>

          {!isGuestMode && (
            <button
              id="btn-nav-lock"
              onClick={onLock}
              className="p-2 sm:px-4 sm:py-2 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-600 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Заблокировать хранилище"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          )}
        </div>
      </header>

      {/* Guest Mode Informational Banner */}
      {isGuestMode && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 sm:px-8 py-3 text-indigo-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-7xl mx-auto w-full mt-2 sm:mt-4 rounded-lg shadow-xxs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Гостевой режим без регистрации активен.</strong> Все ваши проекты хранятся локально на этом устройстве. Вы можете свободно создавать, редактировать, скачивать и импортировать файлы!
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-indigo-600 hover:text-indigo-800 font-bold underline text-left cursor-pointer"
          >
            Установить пароль защиты
          </button>
        </div>
      )}

      {/* Settings Overlay Sidebar */}
      {showSettings && (
        <div className="bg-white border-b border-slate-200 text-slate-800 p-6 shadow-sm animate-in fade-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* AutoLock Timeout Settings */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-indigo-600" />
                Таймер автоблокировки
              </h3>
              <p className="text-slate-500 text-xxs leading-relaxed">
                Автоматически блокирует панель управления и удаляет расшифрованные данные из временной памяти при отсутствии активности.
              </p>
              <div>
                <label className="text-xxs font-bold text-slate-400 block mb-1">ВРЕМЯ БЛОКИРОВКИ</label>
                <select
                  value={userSettings.autoLockMinutes}
                  onChange={e => onUpdateSettings({ ...userSettings, autoLockMinutes: parseInt(e.target.value) })}
                  className="w-full bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  disabled={isGuestMode}
                >
                  {isGuestMode ? (
                    <option>Отключено в гостевом режиме</option>
                  ) : (
                    <>
                      <option value={0}>Отключено (никогда не блокировать)</option>
                      <option value={1}>1 минута</option>
                      <option value={5}>5 минут</option>
                      <option value={10}>10 минут</option>
                      <option value={15}>15 минут</option>
                      <option value={30}>30 минут</option>
                    </>
                  )}
                </select>
                {isGuestMode && (
                  <p className="text-[10px] text-amber-600 mt-1">Установите мастер-пароль, чтобы активировать автоблокировку.</p>
                )}
              </div>
            </div>

            {/* Change Master Password */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                {isGuestMode ? 'Установить мастер-пароль' : 'Изменить мастер-пароль'}
              </h3>
              <form onSubmit={handlePasswordUpdate} className="space-y-3">
                <p className="text-slate-500 text-xxs leading-relaxed">
                  {isGuestMode 
                    ? 'Защитите свои локальные проекты шифрованием AES-GCM 256 бит, установив надежный мастер-пароль.'
                    : 'Изменение основного пароля приведет к полной перешифровке всех сохраненных локально документов.'
                  }
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {!isGuestMode && (
                    <div>
                      <label className="text-xxs font-bold text-slate-400 block mb-1">ТЕКУЩИЙ ПАРОЛЬ</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                  <div className={isGuestMode ? 'col-span-2' : ''}>
                    <label className="text-xxs font-bold text-slate-400 block mb-1">НОВЫЙ МАСТЕР-ПАРОЛЬ</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Минимум 4 символа"
                      className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                {pwError && <div className="text-xxs text-red-600 font-semibold">{pwError}</div>}
                {pwSuccess && (
                  <div className="text-xxs text-green-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-green-600" /> Пароль успешно установлен! Перезагрузка...
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-xs rounded-lg transition cursor-pointer"
                >
                  {isGuestMode ? 'Защитить хранилище' : 'Обновить мастер-пароль'}
                </button>
              </form>
            </div>

            {/* Bulk Backup / JSON Restoration */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                Импорт и экспорт данных
              </h3>
              <p className="text-slate-500 text-xxs leading-relaxed">
                Выгрузите все свои документы в файл JSON для резервного копирования или загрузите ранее сохраненный файл для восстановления.
              </p>
              <div className="flex gap-2">
                <button
                  id="btn-export-backup"
                  onClick={onExportBackup}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xxs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Экспорт в JSON
                </button>
                <div className="flex-1 relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBackupFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full h-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xxs">
                    <Upload className="w-3.5 h-3.5" />
                    Импорт JSON
                  </button>
                </div>
              </div>

              {backupPayload && (
                <form onSubmit={handleImport} className="space-y-2 pt-2 border-t border-slate-200">
                  <p className="text-[9px] text-indigo-600 font-bold">ОБНАРУЖЕНЫ ДАННЫЕ ДЛЯ ИМПОРТА</p>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-green-600 hover:bg-green-500 font-bold text-white text-xxs rounded-lg transition"
                  >
                    Подтвердить и восстановить проекты
                  </button>
                  {backupError && <div className="text-xxs text-red-600 font-semibold">{backupError}</div>}
                  {backupSuccess && (
                    <div className="text-xxs text-green-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Восстановление выполнено успешно!
                    </div>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto overflow-x-hidden">

        {/* 1. Pre-formatted Document Templates Row */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                Быстрый старт из шаблонов
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Начните писать мгновенно, выбрав один из готовых профессиональных макетов.
              </p>
            </div>
            <button
              id="btn-create-blank-doc"
              onClick={() => onCreateDoc(null)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center sm:justify-start gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Пустой документ
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {BUILT_IN_TEMPLATES.map(tpl => {
              // Map template categories to Russian
              const catLabel = tpl.category === 'Business' ? 'Бизнес' :
                               tpl.category === 'Academic' ? 'Академия' :
                               tpl.category === 'Creative' ? 'Творчество' : 'Общие';
              return (
                <motion.button
                  key={tpl.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => onCreateDoc(tpl.id)}
                  className="bg-white border border-slate-200 p-3 sm:p-4 rounded-lg shadow-xs text-left hover:shadow-sm transition cursor-pointer flex flex-col justify-between h-32 sm:h-40 group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full" />
                  <div>
                    <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-bold uppercase tracking-wider">
                      {catLabel}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 mt-2 sm:mt-2.5 group-hover:text-indigo-600 transition truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-slate-400 text-xxs mt-1 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition mt-1 sm:mt-2">
                    Создать
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 2. Custom Templates Repository (if any) */}
        {customTemplates.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-400" />
                Мои сохраненные шаблоны
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Собственные макеты оформления, сохраненные для повторного использования.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {customTemplates.map(tpl => (
                <motion.div
                  key={tpl.id}
                  whileHover={{ y: -2 }}
                  className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-lg shadow-xs flex flex-col justify-between h-36 group relative"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                      {tpl.title}
                    </h3>
                    <p className="text-slate-400 text-xxs mt-1">
                      Создан: {new Date(tpl.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-between items-center mt-4">
                    <button
                      onClick={() => onCreateDoc(null, tpl.content)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-md cursor-pointer"
                    >
                      Использовать
                    </button>
                    <button
                      onClick={() => onDeleteDoc(tpl.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md cursor-pointer"
                      title="Удалить пользовательский шаблон"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Search and Primary Files Dashboard Grid */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                История проектов и документов ({filteredDocs.length})
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {isGuestMode 
                  ? 'Все ваши файлы хранятся в безопасности локально в браузере.'
                  : 'Документы зашифрованы персональным 256-битным мастер-ключом.'
                }
              </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 bg-slate-100 border border-slate-200 p-2 sm:p-1 rounded-lg w-full">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white text-slate-600 text-xs font-semibold px-2 py-1 rounded-md border border-slate-200/50 focus:outline-none focus:ring-0 cursor-pointer shadow-xs w-full sm:w-auto"
              >
                <option value="updated">⏰ По изменению</option>
                <option value="title">🔤 По алфавиту</option>
                <option value="words">📏 По числу слов</option>
              </select>

              <div className="hidden sm:block w-px h-4 bg-slate-200" />

              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full sm:w-auto flex-nowrap sm:flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 text-xxs font-bold rounded-md transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      categoryFilter === cat 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search container */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="dashboard-search-input"
              type="text"
              placeholder="Поиск по названию, тегам категорий или текстовому содержанию документов..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm shadow-xs transition"
            />
          </div>

          {/* Documents Main List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {/* Prominent Create New Document Card inside the history */}
            <motion.div
              whileHover={{ y: -3, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.05)' }}
              onClick={() => onCreateDoc(null)}
              className="bg-indigo-50/50 border border-indigo-200 border-dashed rounded-lg p-5 shadow-xs text-center flex flex-col items-center justify-center h-52 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer group"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-indigo-900 mt-2">
                Создать новый проект
              </h3>
              <p className="text-indigo-600/70 text-xs mt-1 px-4 leading-relaxed">
                Начните с чистого листа
              </p>
            </motion.div>

            {sortedDocs.map(doc => (
              <motion.div
                key={doc.id}
                whileHover={{ y: -3, boxShadow: '0 8px 20px -4px rgba(0,0,0,0.05)' }}
                onClick={() => onSelectDoc(doc)}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs text-left flex flex-col justify-between h-52 hover:border-indigo-200 transition cursor-pointer group"
              >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        doc.category === 'Работа' ? 'bg-blue-50 text-blue-700' :
                        doc.category === 'Личное' ? 'bg-green-50 text-green-700' :
                        doc.category === 'Важное' ? 'bg-amber-50 text-amber-700' :
                        doc.category === 'Творчество' ? 'bg-purple-50 text-purple-700' :
                        doc.category === 'Шаблон' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {doc.category}
                      </span>

                      {/* Display lock status */}
                      {doc.isLocked && (
                        <span className="p-1 bg-red-50 text-red-600 rounded-md" title="Защищено PIN-кодом">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mt-3.5 group-hover:text-indigo-600 transition truncate">
                      {doc.title || 'Безымянный документ'}
                    </h3>

                    {/* Preview first lines */}
                    <p className="text-slate-400 text-xxs mt-2 line-clamp-3 leading-relaxed">
                      {doc.content.replace(/<[^>]+>/g, '').trim() || 'Пустой черновик.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 mt-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500">
                      Слов: {doc.wordCount || 0}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
        </section>

      </main>

      {/* Styled simple footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-400 text-xxs py-6 text-center mt-auto">
        <p>🔒 Криптографическое хранилище AES-GCM 256 бит &bull; Хранение только на стороне клиента. Экспортируйте ваши резервные копии в Настройках.</p>
      </footer>

    </div>
  );
}
