import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, Search, Home, FileText, User, Plus, 
  MoreHorizontal, Star, Trash2, Folder, ShieldCheck, 
  Settings, KeyRound, Download, Upload, LogOut, File,
  ListTodo, X
} from 'lucide-react';
import { Document, UserSettings } from '../types';

interface DashboardProps {
  documents: Document[];
  userSettings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onSelectDoc: (doc: Document) => void;
  onCreateDoc: (templateId?: string | null, customTemplateContent?: string | null, customTitle?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onChangeMasterPassword: (oldPw: string, newPw: string) => Promise<boolean>;
  onLock: () => void;
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
  isGuestMode = false
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'profile'>('home');
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  
  // Custom list builder states
  const [showListBuilderModal, setShowListBuilderModal] = useState(false);
  const [listBuilderTitle, setListBuilderTitle] = useState('');
  const [listBuilderItems, setListBuilderItems] = useState<string[]>(['']);
  
  // Settings / Profile states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const regularDocs = documents.filter(d => !d.isTemplate).sort((a, b) => b.updatedAt - a.updatedAt);
  const recentDocs = regularDocs.slice(0, 4);

  const filteredDocs = regularDocs.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase()) || 
    doc.content.toLowerCase().includes(search.toLowerCase())
  );

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
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setPwError('Неверный текущий пароль. Не удалось обновить ключ.');
    }
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return `Изменено ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `Изменено ${date.getDate()} ${['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][date.getMonth()]}`;
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

  const handleCreateChecklistFromModal = () => {
    const title = listBuilderTitle.trim() || (userSettings.language === 'en' ? 'My Checklist' : 'Новый список');
    const itemsHtml = listBuilderItems
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => `
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px; margin-bottom: 6px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          &nbsp;<span style="font-size: 1.05rem;">${item}</span>
        </div>
      `).join('');

    const fullContent = `
      <div style="font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1e293b;">
        <h2>${title}</h2>
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">
          ${userSettings.language === 'en' ? 'Click checkboxes to complete tasks.' : 'Нажмите на квадрат, чтобы отметить задачу как выполненную.'}
        </p>
        ${itemsHtml || `
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px; margin-bottom: 6px;">
            <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
            &nbsp;<span style="font-size: 1.05rem;">${userSettings.language === 'en' ? 'First task' : 'Первая задача'}</span>
          </div>
        `}
        <div><br></div>
      </div>
    `;

    onCreateDoc(null, fullContent, title);
    setShowListBuilderModal(false);
  };

  // Helper for generating consistent colors for document icons
  const getDocColor = (index: number) => {
    const colors = ['text-blue-500 bg-blue-50', 'text-purple-500 bg-purple-50', 'text-green-500 bg-green-50', 'text-yellow-500 bg-yellow-50', 'text-orange-500 bg-orange-50'];
    return colors[index % colors.length];
  };

  return (
    <div className="h-[100dvh] bg-[#F8FAFC] dark:bg-slate-900 flex flex-col font-sans select-none w-full relative overflow-hidden transition-colors duration-300">
      
      {/* App Header */}
      <header className="px-6 py-5 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-300">
        <button onClick={() => setIsDrawerOpen(true)} className="text-slate-700 dark:text-slate-200 p-1 -ml-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">PSWord</h1>
        <button 
          onClick={() => setActiveTab('docs')}
          className="text-slate-700 dark:text-slate-200 p-1 -mr-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <Search className="w-6 h-6" />
        </button>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-900 dark:text-white">PSWord</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <button 
                  onClick={() => { setActiveTab('home'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition cursor-pointer ${activeTab === 'home' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Home className="w-5 h-5" /> {userSettings.language === 'en' ? 'Home' : 'Главная'}
                </button>
                <button 
                  onClick={() => { setActiveTab('docs'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition cursor-pointer ${activeTab === 'docs' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <FileText className="w-5 h-5" /> {userSettings.language === 'en' ? 'All documents' : 'Все документы'}
                </button>
                <button 
                  onClick={() => { setActiveTab('profile'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition cursor-pointer ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Settings className="w-5 h-5" /> {userSettings.language === 'en' ? 'Settings' : 'Настройки'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
        
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            
            {/* Recent Section */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {userSettings.language === 'en' ? 'Recent' : 'Недавние'}
                </h2>
                <button 
                  onClick={() => setActiveTab('docs')}
                  className="text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                >
                  {userSettings.language === 'en' ? 'All' : 'Все'} <span className="text-lg leading-none mb-0.5">›</span>
                </button>
              </div>

              <div className="space-y-3">
                {recentDocs.length === 0 ? (
                  <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-slate-400 dark:text-slate-500 text-sm transition-colors duration-300">
                    {userSettings.language === 'en' ? 'List is empty' : 'Список пуст'}
                  </div>
                ) : (
                  recentDocs.map((doc, idx) => {
                    const colorClass = getDocColor(idx);
                    const [textColor, bgColor] = colorClass.split(' ');
                    // Replace light bg colors with dark variants for dark mode compatibility if needed
                    const darkBgColor = bgColor.replace('50', '900/30');
                    return (
                      <motion.div
                        key={doc.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => onSelectDoc(doc)}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-slate-700 cursor-pointer transition-colors duration-300"
                      >
                        <div className="flex items-center gap-4 truncate">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor} dark:${darkBgColor} ${textColor} dark:text-${textColor.split('-')[1]}-400`}>
                            <File className="w-5 h-5 fill-current opacity-20 absolute" />
                            <File className="w-5 h-5 relative z-10" />
                          </div>
                          <div className="truncate">
                            <h3 className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{doc.title || (userSettings.language === 'en' ? 'Untitled' : 'Безымянный')}</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{formatTime(doc.updatedAt)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                          className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 cursor-pointer transition-colors"
                          title={userSettings.language === 'en' ? 'Delete' : 'Удалить'}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Categories Section */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                {userSettings.language === 'en' ? 'Categories' : 'Категории'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                
                <div onClick={() => setActiveTab('docs')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all duration-300">
                  <FileText className="w-6 h-6 text-blue-500 mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{userSettings.language === 'en' ? 'All docs' : 'Все документы'}</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{regularDocs.length}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all duration-300">
                  <Trash2 className="w-6 h-6 text-green-500 mb-3" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{userSettings.language === 'en' ? 'Trash' : 'Корзина'}</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">0</p>
                </div>

              </div>
            </section>
          </motion.div>
        )}

        {activeTab === 'docs' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {userSettings.language === 'en' ? 'All documents' : 'Все документы'}
            </h2>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder={userSettings.language === 'en' ? 'Search documents...' : 'Поиск документов...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition shadow-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  {userSettings.language === 'en' ? 'Nothing found' : 'Ничего не найдено'}
                </div>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const colorClass = getDocColor(idx);
                  const [textColor, bgColor] = colorClass.split(' ');
                  const darkBgColor = bgColor.replace('50', '900/30');
                  return (
                    <motion.div
                      key={doc.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => onSelectDoc(doc)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-50 dark:border-slate-700 cursor-pointer transition-colors duration-300"
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor} dark:${darkBgColor} ${textColor} dark:text-${textColor.split('-')[1]}-400`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{doc.title || (userSettings.language === 'en' ? 'Untitled' : 'Безымянный')}</h3>
                          <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{formatTime(doc.updatedAt)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition cursor-pointer"
                        title={userSettings.language === 'en' ? 'Delete' : 'Удалить'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {userSettings.language === 'en' ? 'Profile & Settings' : 'Профиль и Настройки'}
            </h2>
            
            {isGuestMode && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 p-4 rounded-2xl text-blue-800 dark:text-blue-300 text-xs flex gap-3 shadow-sm mb-6">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p>{userSettings.language === 'en' ? 'You are using guest mode. Your data is stored locally without a password.' : 'Вы используете гостевой режим. Ваши данные хранятся локально без пароля.'}</p>
              </div>
            )}

            {!isGuestMode && (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  {userSettings.language === 'en' ? 'Set new master password' : 'Установить новый мастер-пароль'}
                </h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                  <input
                    type="password"
                    placeholder={userSettings.language === 'en' ? 'Current password' : 'Текущий пароль'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                    required
                  />
                  <input
                    type="password"
                    placeholder={userSettings.language === 'en' ? 'New password' : 'Новый пароль'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                    required
                  />
                  {pwError && <p className="text-red-500 dark:text-red-400 text-xs">{pwError}</p>}
                  {pwSuccess && <p className="text-green-600 dark:text-green-400 text-xs">{userSettings.language === 'en' ? 'Password updated successfully!' : 'Пароль успешно обновлен!'}</p>}
                  <button type="submit" className="w-full py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition cursor-pointer">
                    {userSettings.language === 'en' ? 'Update encryption key' : 'Обновить ключ шифрования'}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                {userSettings.language === 'en' ? 'Appearance and language' : 'Внешний вид и язык'}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {userSettings.language === 'en' ? 'Dark theme' : 'Тёмная тема'}
                </span>
                <button
                  onClick={() => onUpdateSettings({ ...userSettings, theme: userSettings.theme === 'dark' ? 'light' : 'dark' })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer flex items-center ${userSettings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <motion.div
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                    initial={false}
                    animate={{
                      x: userSettings.theme === 'dark' ? 20 : 0
                    }}
                  />
                </button>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700 w-full my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {userSettings.language === 'en' ? 'Interface language' : 'Язык интерфейса'}
                </span>
                <button
                  onClick={() => onUpdateSettings({ ...userSettings, language: userSettings.language === 'en' ? 'ru' : 'en' })}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg transition"
                >
                  {userSettings.language === 'en' ? 'English' : 'Русский'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {userSettings.language === 'en' ? 'App version' : 'Версия приложения'}
                </span>
                <span className="text-sm font-medium text-slate-500">1.0.1</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700 w-full my-2"></div>
              <a href="https://files.manuscdn.com/user_upload_by_module/session_file/310519663706234669/AGnaMHeKkVobgxQg.pdf" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline block">
                {userSettings.language === 'en' ? 'Terms of Use' : 'Условия использования'}
              </a>
              <a href="https://files.manuscdn.com/user_upload_by_module/session_file/310519663706234669/RDbCvevzPWsgdcwe.pdf" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline block">
                {userSettings.language === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности'}
              </a>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 mt-8">
              <h3 className="font-bold text-red-600 dark:text-red-400 text-sm">
                {userSettings.language === 'en' ? 'Danger Zone' : 'Опасная зона'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {userSettings.language === 'en' ? 'Permanently delete all stored files and start fresh.' : 'Навсегда удалите все сохраненные файлы и начните с чистого листа.'}
              </p>
              <button
                onClick={() => {
                  if (confirm(userSettings.language === 'en' ? 'Are you sure you want to delete ALL documents? This cannot be undone.' : 'Вы уверены, что хотите удалить ВСЕ документы? Это действие необратимо.')) {
                    documents.forEach(doc => onDeleteDoc(doc.id));
                  }
                }}
                className="w-full py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition cursor-pointer"
              >
                {userSettings.language === 'en' ? 'Delete all documents' : 'Удалить все документы'}
              </button>
            </div>

            {!isGuestMode && (
              <button
                onClick={onLock}
                className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition flex justify-center items-center gap-2 mt-8 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {userSettings.language === 'en' ? 'Logout and lock' : 'Выйти и заблокировать'}
              </button>
            )}

          </motion.div>
        )}

      </main>

      {/* Floating Action Menu & Button (only on Home/Docs) */}
      {(activeTab === 'home' || activeTab === 'docs') && (
        <div className="absolute bottom-20 right-6 z-40 flex flex-col items-end gap-3">
          <AnimatePresence>
            {showCreateMenu && (
              <>
                {/* Backdrop to close the menu */}
                <div 
                  onClick={() => setShowCreateMenu(false)}
                  className="fixed inset-0 bg-transparent z-10"
                />
                
                {/* Menu items */}
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="flex flex-col gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/60 z-20 min-w-[180px]"
                >
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      onCreateDoc(null);
                    }}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition cursor-pointer"
                  >
                    <span className="font-semibold">{userSettings.language === 'en' ? 'New document' : 'Новый документ'}</span>
                    <FileText className="w-5 h-5 text-blue-500" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setListBuilderTitle('');
                      setListBuilderItems(['']);
                      setShowListBuilderModal(true);
                    }}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                        {userSettings.language === 'en' ? 'NEW' : 'НОВОЕ'}
                      </span>
                      <span className="font-semibold">{userSettings.language === 'en' ? 'New list' : 'Новый список'}</span>
                    </div>
                    <ListTodo className="w-5 h-5 text-emerald-500" />
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className={`w-14 h-14 bg-[#3B82F6] text-white rounded-full flex items-center justify-center shadow-[0_8px_16px_rgb(59,130,246,0.3)] transition-transform cursor-pointer z-30 ${showCreateMenu ? 'rotate-45 scale-105' : 'hover:scale-105 active:scale-95'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav 
        className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pt-2 flex justify-around items-center z-30 shadow-[0_-4px_20px_rgb(0,0,0,0.02)] shrink-0 w-full relative transition-colors duration-300"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 p-2 transition cursor-pointer ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-blue-600/20 dark:fill-blue-400/20' : ''}`} />
          <span className="text-[10px] font-semibold">{userSettings.language === 'en' ? 'Home' : 'Главная'}</span>
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex flex-col items-center gap-1 flex-1 p-2 transition cursor-pointer ${activeTab === 'docs' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <FileText className={`w-6 h-6 ${activeTab === 'docs' ? 'fill-blue-600/20 dark:fill-blue-400/20' : ''}`} />
          <span className="text-[10px] font-semibold">{userSettings.language === 'en' ? 'Docs' : 'Документы'}</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 flex-1 p-2 transition cursor-pointer ${activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-blue-600/20 dark:fill-blue-400/20' : ''}`} />
          <span className="text-[10px] font-semibold">{userSettings.language === 'en' ? 'Profile' : 'Профиль'}</span>
        </button>
      </nav>

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
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    {userSettings.language === 'en' ? 'Create Custom List' : 'Создание нового списка'}
                  </h3>
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
                  {userSettings.language === 'en' ? 'List Name' : 'Название списка'}
                </label>
                <input
                  type="text"
                  value={listBuilderTitle}
                  onChange={(e) => setListBuilderTitle(e.target.value)}
                  placeholder={userSettings.language === 'en' ? 'e.g. Weekly Groceries' : 'например, Список покупок'}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-semibold"
                />
              </div>

              {/* Items Container with scroll */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {userSettings.language === 'en' ? 'List Items' : 'Элементы списка'}
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
                        placeholder={userSettings.language === 'en' ? `Item ${index + 1}` : `Пункт ${index + 1}`}
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
                  {userSettings.language === 'en' ? 'Add Item' : 'Добавить пункт'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  onClick={() => setShowListBuilderModal(false)}
                  className="flex-1 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
                >
                  {userSettings.language === 'en' ? 'Cancel' : 'Отмена'}
                </button>
                <button
                  onClick={handleCreateChecklistFromModal}
                  className="flex-1 py-3 text-white font-bold text-sm bg-blue-500 hover:bg-blue-600 rounded-xl transition shadow-md shadow-blue-500/15 cursor-pointer"
                >
                  {userSettings.language === 'en' ? 'Create List' : 'Создать список'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
