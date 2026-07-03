import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, AlertTriangle, Lock } from 'lucide-react';
import { sha256 } from '../utils/crypto';

interface AuthScreenProps {
  onUnlock: (password: string) => void;
}

export default function AuthScreen({ onUnlock }: AuthScreenProps) {
  const [hasPassword, setHasPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasAgreedPreviously, setHasAgreedPreviously] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedHash = localStorage.getItem('doc_master_hash');
    setHasPassword(!!savedHash);
    
    if (localStorage.getItem('has_agreed_policy') === 'true') {
      setAgreed(true);
      setHasAgreedPreviously(true);
      if (!savedHash) {
        onUnlock('guest_key');
      }
    }
  }, [onUnlock]);

  const handleWelcome = async () => {
    if (hasPassword) {
      if (!password) {
        setError('Введите мастер-пароль');
        return;
      }
      const inputHash = await sha256(password);
      const storedHash = localStorage.getItem('doc_master_hash');
      if (inputHash === storedHash) {
        onUnlock(password);
      } else {
        setError('Неверный пароль.');
      }
      return;
    }

    if (!agreed) {
      setError('Необходимо согласиться с Условиями использования и Политикой конфиденциальности');
      return;
    }
    
    localStorage.setItem('has_agreed_policy', 'true');
    // Proceed to app as guest
    onUnlock('guest_key');
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col justify-between items-center p-6 select-none font-sans w-full relative overflow-hidden">
      
      <AnimatePresence>
        <div className="flex flex-col h-full w-full justify-between items-center overflow-y-auto no-scrollbar">
          {/* Top spacing */}
          <div className="flex-1"></div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Title */}
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              PSWord
            </h1>

            {/* Subtitle */}
            <p className="text-slate-500 text-base max-w-[240px] leading-relaxed mx-auto">
              {hasPassword ? 'Хранилище заблокировано' : 'Ваше пространство для идей и слов'}
            </p>
          </motion.div>

          {/* Bottom spacing */}
          <div 
            className="flex-1 flex flex-col justify-end items-center w-full px-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
          >
            
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {hasPassword ? (
              <div className="w-full mb-6 relative">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                 <input
                  type="password"
                  placeholder="Мастер-пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleWelcome(); }}
                />
              </div>
            ) : !hasAgreedPreviously ? (
              <div className="flex items-start gap-3 w-full mb-6 px-2">
                <input
                  type="checkbox"
                  id="agreement-checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="mt-1 flex-shrink-0 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="agreement-checkbox" className="text-xs text-slate-500 leading-relaxed cursor-pointer text-left">
                  Я принимаю{' '}
                  <a href="https://files.manuscdn.com/user_upload_by_module/session_file/310519663706234669/AGnaMHeKkVobgxQg.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                    Условия использования
                  </a>
                  {' '}и{' '}
                  <a href="https://files.manuscdn.com/user_upload_by_module/session_file/310519663706234669/RDbCvevzPWsgdcwe.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">
                    Политику конфиденциальности
                  </a>.
                </label>
              </div>
            ) : null}

            {/* Welcome Button */}
            <button
              onClick={handleWelcome}
              className="w-full py-4 bg-[#3B82F6] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-lg rounded-2xl transition shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {hasPassword ? 'Войти' : 'Добро пожаловать'}
            </button>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
}

