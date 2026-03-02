import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PaymentProvider } from './types';
import { initiatePayment } from './services/paymentService';
import { XIcon, CreditCardIcon, SmartphoneIcon, ShieldIcon, CheckIcon } from './icons';

interface PaymentModalProps {
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStatus = 'IDLE' | 'INITIATING' | 'WAITING_FOR_APPROVAL' | 'SUCCESS' | 'ERROR';

export default function PaymentModal({ amount, onClose, onSuccess }: PaymentModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setStatus('INITIATING');
    setError(null);

    try {
      if (provider === PaymentProvider.BIT) {
        // Simulate Bit Flow: Initiate -> Wait for App Approval -> Success
        await new Promise(r => setTimeout(r, 1500)); // Network request
        setStatus('WAITING_FOR_APPROVAL');
        
        // Simulate user approving in app (Polling mock)
        await new Promise(r => setTimeout(r, 3000)); 
        
        await initiatePayment(amount, provider);
        setStatus('SUCCESS');
        setTimeout(onSuccess, 1000);
      } else {
        // Standard Credit Card Flow
        await initiatePayment(amount, provider);
        setStatus('SUCCESS');
        setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      setStatus('IDLE');
      setError("Payment Failed. Please try again.");
    }
  };

  const isRtl = i18n.dir() === 'rtl';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-charcoal">{t('buy_report')}</h2>
          <button onClick={onClose} disabled={status !== 'IDLE' && status !== 'ERROR'} className="p-2 bg-sage-50 rounded-full text-sage-400 hover:text-charcoal transition-colors disabled:opacity-50">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-sage-50 rounded-xl p-4 mb-6 border border-sage-100 flex justify-between items-center">
           <span className="text-sm text-sage-500 font-medium">{t('amount_label')}</span>
           <span className="text-2xl font-bold text-primary" dir="ltr">{amount.toFixed(2)} ₪</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Payment Options or Status View */}
        <div className="space-y-3 min-h-[160px] flex flex-col justify-center">
          
          {status === 'IDLE' || status === 'ERROR' ? (
            <>
              {/* BIT OPTION */}
              <button 
                onClick={() => handlePayment(PaymentProvider.BIT)}
                className="w-full relative group overflow-hidden bg-[#0083F1] hover:bg-[#006cc9] text-white py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                 <div className="flex items-center justify-center gap-3">
                    <SmartphoneIcon className="w-6 h-6" />
                    <span className="font-bold text-lg">Bit</span>
                 </div>
                 {/* Decorative shine */}
                 <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              </button>

              {/* CREDIT CARD OPTION (Meshulam) */}
              <button 
                onClick={() => handlePayment(PaymentProvider.MESHULAM)}
                className="w-full bg-charcoal hover:bg-black text-white py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                  <CreditCardIcon className="w-6 h-6" />
                  <span className="font-bold text-lg">{isRtl ? 'כרטיס אשראי' : 'Credit Card'}</span>
              </button>
              
              <div className="flex items-center justify-center gap-2 pt-2">
                 <div className="h-px bg-sage-200 w-12"></div>
                 <span className="text-xs text-sage-400">Or Pay With</span>
                 <div className="h-px bg-sage-200 w-12"></div>
              </div>
              
               <button 
                disabled
                className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                  <span>Apple Pay (Coming Soon)</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-4 animate-in fade-in">
               
               {status === 'SUCCESS' ? (
                 <>
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
                      <CheckIcon className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-bold text-charcoal">Payment Successful!</h3>
                   <p className="text-sm text-sage-400 mt-1">Generating your report...</p>
                 </>
               ) : (
                 <>
                   {/* Loading Spinner */}
                   <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-sage-100 border-t-primary rounded-full animate-spin"></div>
                      {selectedProvider === PaymentProvider.BIT && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <SmartphoneIcon className="w-6 h-6 text-primary" />
                        </div>
                      )}
                   </div>

                   {/* Status Text */}
                   <h3 className="text-lg font-bold text-charcoal">
                     {status === 'WAITING_FOR_APPROVAL' ? (isRtl ? 'ממתין לאישור באפליקציית ביט...' : 'Waiting for approval in Bit...') : 'Processing Secure Payment...'}
                   </h3>
                   
                   {status === 'WAITING_FOR_APPROVAL' && (
                     <p className="text-sm text-sage-400 mt-2 max-w-[200px]">
                       Please check your phone and approve the transaction.
                     </p>
                   )}
                 </>
               )}
            </div>
          )}

        </div>

        {/* Footer / Trust Badge */}
        {(status === 'IDLE' || status === 'ERROR') && (
          <div className="mt-6 flex flex-col items-center gap-1 opacity-60">
             <div className="flex items-center gap-1 text-[10px] text-sage-400">
               <ShieldIcon className="w-3 h-3" />
               <span>Secured by Meshulam</span>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}