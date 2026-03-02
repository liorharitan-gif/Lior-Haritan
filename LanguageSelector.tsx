import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from './locales';
import { XIcon, CheckIcon } from './icons';

interface LanguageSelectorProps {
  onClose: () => void;
}

export default function LanguageSelector({ onClose }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-sage-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-charcoal">{t('settings_language')}</h2>
          <button onClick={onClose} className="p-2 text-sage-400 hover:bg-sage-50 rounded-full transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between p-4 rounded-xl mb-1 transition-all ${
                i18n.language === lang.code 
                  ? 'bg-sage-50 text-primary border border-sage-100' 
                  : 'text-charcoal hover:bg-sage-50 border border-transparent'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-base">{lang.name}</span>
                <span className="text-xs text-sage-400 uppercase tracking-wider">{lang.code}</span>
              </div>
              {i18n.language === lang.code && <CheckIcon className="w-5 h-5" />}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-sage-100 bg-white">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white border border-sage-200 text-charcoal rounded-xl font-semibold shadow-sm hover:bg-sage-50 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}