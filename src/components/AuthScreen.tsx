import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, KeyRound, RefreshCw, AlertTriangle } from 'lucide-react';
import { sha256 } from '../utils/crypto';

interface AuthScreenProps {
  onUnlock: (password: string) => void;
}

export default function AuthScreen({ onUnlock }: AuthScreenProps) {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if password hash already exists in localStorage
    const savedHash = localStorage.getItem('doc_master_hash');
    setHasPassword(!!savedHash);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!hasPassword) {
        // Sign-up: Setting up password for the first time
        if (password.length < 4) {
          setError('Пароль должен состоять минимум из 4 символов');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }

        const hash = await sha256(password);
        localStorage.setItem('doc_master_hash', hash);
        // Create an empty array for encrypted documents
        localStorage.setItem('doc_encrypted_payload', '');
        
        onUnlock(password);
      } else {
        // Sign-in: Verify password against the stored SHA-256 hash
        const inputHash = await sha256(password);
        const storedHash = localStorage.getItem('doc_master_hash');

        if (inputHash === storedHash) {
          onUnlock(password);
        } else {
          setError('Неверный мастер-пароль. Пожалуйста, попробуйте еще раз.');
        }
      }
    } catch (err) {
      setError('Произошла ошибка авторизации. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleWipeData = () => {
    if (window.confirm('ВНИМАНИЕ: Это действие безвозвратно удалит ВСЕ документы и сбросит ваш мастер-пароль. Это действие нельзя отменить! Вы уверены?')) {
      if (window.confirm('Введите "DELETE" для подтверждения удаления.')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  if (hasPassword === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="animate-spin text-slate-400 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-3 shadow-xs">
          <KeyRound className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-sans">
          Docu<span className="text-indigo-600 font-bold">Vault</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">
          Безопасное приватное пространство для ваших творческих и рабочих черновиков.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-md"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
          {hasPassword ? 'Хранилище заблокировано' : 'Защитите свое хранилище'}
        </h2>
        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
          {hasPassword
            ? 'Введите мастер-пароль, чтобы расшифровать и открыть документы.'
            : 'Создайте мастер-пароль. Ваши документы шифруются прямо в браузере и не могут быть расшифрованы без этого пароля.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Мастер-пароль
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="master-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={hasPassword ? '••••••••' : 'Создайте надежный пароль'}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 rounded-lg placeholder-slate-400 text-sm focus:outline-none transition"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!hasPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                Подтверждение пароля
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Unlock className="w-4 h-4" />
                </span>
                <input
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Введите пароль еще раз"
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 rounded-lg placeholder-slate-400 text-sm focus:outline-none transition"
                  required
                  disabled={loading}
                />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            id="auth-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="animate-spin w-4 h-4" />
            ) : hasPassword ? (
              <>
                <Unlock className="w-4 h-4" />
                Открыть панель управления
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Инициализировать хранилище
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Button */}
        <button
          type="button"
          onClick={() => onUnlock('guest_key')}
          className="w-full mt-3 py-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-xxs"
        >
          Продолжить без пароля (Вход гостем)
        </button>

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-400">Локальное шифрование AES-GCM</span>
          {hasPassword && (
            <button
              onClick={handleWipeData}
              className="text-slate-400 hover:text-red-500 transition underline cursor-pointer font-medium"
            >
              Сбросить хранилище
            </button>
          )}
        </div>
      </motion.div>

      <div className="text-slate-400 text-[11px] mt-8 text-center max-w-sm leading-relaxed">
        🔒 Все документы шифруются и хранятся исключительно в кеше вашего браузера. Очистка файлов cookies или истории сайтов может удалить ваши файлы. Регулярно делайте экспорт данных в JSON на панели Настроек.
      </div>
    </div>
  );
}
