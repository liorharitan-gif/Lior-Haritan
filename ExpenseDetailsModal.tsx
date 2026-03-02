import React from 'react';
import { useTranslation } from 'react-i18next';
import { Expense, ExpenseCategory } from './types';
import { format } from 'date-fns';
import { XIcon, ImageIcon, StethoscopeIcon, GraduationCapIcon, UtensilsIcon, ShirtIcon, DollarSignIcon, CheckIcon } from './icons';

interface ExpenseDetailsModalProps {
  expense: Expense;
  onClose: () => void;
  currentUserId: string;
}

export default function ExpenseDetailsModal({ expense, onClose, currentUserId }: ExpenseDetailsModalProps) {
  const { t, i18n } = useTranslation();

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case ExpenseCategory.MEDICAL: return <StethoscopeIcon className="w-8 h-8" />;
      case ExpenseCategory.EDUCATION: return <GraduationCapIcon className="w-8 h-8" />;
      case ExpenseCategory.FOOD: return <UtensilsIcon className="w-8 h-8" />;
      case ExpenseCategory.CLOTHING: return <ShirtIcon className="w-8 h-8" />;
      default: return <DollarSignIcon className="w-8 h-8" />;
    }
  };

  const getCategoryColor = (category: ExpenseCategory) => {
     switch (category) {
      case ExpenseCategory.MEDICAL: return 'bg-red-50 text-red-600';
      case ExpenseCategory.EDUCATION: return 'bg-blue-50 text-blue-600';
      case ExpenseCategory.FOOD: return 'bg-orange-50 text-orange-600';
      case ExpenseCategory.CLOTHING: return 'bg-purple-50 text-purple-600';
      default: return 'bg-sage-100 text-primary';
    }
  };

  // Logic to determine image source: Prefer direct URL (Base64/External), fallback to Storage Path construction
  const receiptSource = expense.receipt_url 
    ? expense.receipt_url 
    : expense.receipt_image_path 
      ? `https://xyzcompany.supabase.co/storage/v1/object/public/receipts/${expense.receipt_image_path}` 
      : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header with Icon */}
        <div className="relative p-6 text-center border-b border-sage-50 bg-sage-50/50">
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full text-sage-400 hover:text-charcoal shadow-sm transition-colors z-10">
              <XIcon className="w-5 h-5" />
           </button>
           
           <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${getCategoryColor(expense.category)} ring-4 ring-white shadow-lg`}>
              {getCategoryIcon(expense.category)}
           </div>
           
           <h2 className="text-xl font-bold text-charcoal">{expense.description}</h2>
           <p className="text-sm text-sage-400">{expense.category}</p>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
           {/* Amount Section */}
           <div className="text-center">
              <span className="text-4xl font-bold text-primary" dir="ltr">{expense.amount.toFixed(2)} ₪</span>
              <div className="mt-2 flex justify-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.paid_by === currentUserId ? 'bg-primary/10 text-primary' : 'bg-sage-100 text-sage-500'}`}>
                    {expense.paid_by === currentUserId ? t('you_paid') : t('they_paid')}
                 </span>
                 {expense.is_settled && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                       <CheckIcon className="w-3 h-3" /> Settled
                    </span>
                 )}
              </div>
           </div>

           {/* Date */}
           <div className="flex justify-between items-center py-3 border-t border-sage-100">
              <span className="text-sm font-semibold text-sage-400">{t('date_label')}</span>
              <span className="text-sm font-bold text-charcoal">
                {format(new Date(expense.date_incurred), 'dd/MM/yyyy')}
              </span>
           </div>

           {/* Receipt Section */}
           <div className="space-y-2">
              <h3 className="text-sm font-semibold text-sage-400 flex items-center gap-2">
                 <ImageIcon className="w-4 h-4" />
                 {t('receipt_view')}
              </h3>
              
              <div className="rounded-xl border border-sage-200 overflow-hidden bg-sage-50 min-h-[150px] flex items-center justify-center relative group">
                 {receiptSource ? (
                    <img src={receiptSource} alt="Receipt" className="w-full h-auto max-h-[400px] object-contain" />
                 ) : (
                    <div className="flex flex-col items-center text-sage-300 py-10">
                       <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                       <span className="text-xs">{t('no_receipt')}</span>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}