import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Family, EventType, EventStatus, CalendarEvent, Expense, ExpenseCategory, Message, SentimentResult 
} from './types';
import { analyzeSentiment } from './services/geminiService';
import { uploadReceiptImage } from './services/storageService';
import { 
  CalendarIcon, DollarSignIcon, MessageCircleIcon, ShieldIcon, 
  SendIcon, PlusIcon, CheckIcon, XIcon, BotIcon, SettingsIcon,
  CameraIcon, ImageIcon, TrashIcon, StethoscopeIcon, GraduationCapIcon,
  UtensilsIcon, ShirtIcon
} from './icons';
import LanguageSelector from './LanguageSelector';
import UnifiedCalendarScreen from './UnifiedCalendarScreen'; // New Import
import PaymentModal from './PaymentModal'; // New Import
import ExpenseDetailsModal from './ExpenseDetailsModal'; // New Import
import { format, addHours } from 'date-fns';

// --- MOCK DATA (Localized) ---
const CURRENT_USER_ID = "user_a_123";
const CO_PARENT_ID = "user_b_456";

// Initial Empty State for Onboarding
const initialUser = {
  id: CURRENT_USER_ID,
  full_name: "דני כהן",
  email: "danny@example.com",
  report_credits: 0,
  is_premium: false,
  family_id: undefined // Starts undefined
};

const mockFamilyData: Family = {
  id: "fam_1",
  name: "משפחת כהן",
  invite_code: "SHALOM-24",
  children: [{ id: "c1", name: "נועה", age: 7 }, { id: "c2", name: "איתי", age: 5 }]
};

const initialEvents: CalendarEvent[] = [
  { 
      id: "e1", 
      family_id: "fam_1", 
      created_by: CURRENT_USER_ID, 
      title: "סוף שבוע אבא", 
      start_time: new Date().toISOString(), 
      end_time: new Date().toISOString(), 
      type: EventType.CUSTODY, 
      status: EventStatus.APPROVED, 
      is_immutable: true, 
      source: 'APP', 
      color: 'blue' 
  },
  {
      id: "e2",
      family_id: "fam_1", 
      created_by: CO_PARENT_ID, 
      title: "חוג ג׳ודו", 
      start_time: new Date(new Date().setHours(17, 0)).toISOString(), 
      end_time: new Date(new Date().setHours(18, 0)).toISOString(), 
      type: EventType.EVENT, 
      status: EventStatus.APPROVED, 
      is_immutable: false, 
      source: 'APP', 
      color: 'teal' 
  }
];

const initialExpenses: Expense[] = [
  { 
    id: "ex1", 
    family_id: "fam_1", 
    paid_by: CURRENT_USER_ID, 
    amount: 150.00, 
    description: "ציוד לבית ספר", 
    category: ExpenseCategory.EDUCATION, 
    date_incurred: new Date().toISOString(), 
    split_details: [
      { user_id: CURRENT_USER_ID, percentage: 0.5, amount_owed: 75.00 },
      { user_id: CO_PARENT_ID, percentage: 0.5, amount_owed: 75.00 }
    ],
    is_settled: false 
  }
];

const initialMessages: Message[] = [];

// --- APP COMPONENT ---

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(initialUser);
  const [family, setFamily] = useState<Family | null>(null); // Null if not in family
  
  // Onboarding UI State
  const [onboardingStep, setOnboardingStep] = useState<'login' | 'select_action' | 'create_family' | 'join_family' | 'completed'>('login');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState(''); // Soft Onboarding
  
  // Main App State
  const [activeTab, setActiveTab] = useState<'calendar' | 'expenses' | 'chat' | 'legal'>('calendar');
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // New Entry States
  const [newMessage, setNewMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentAlert, setSentimentAlert] = useState<SentimentResult | null>(null);

  // Expense Modal State
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: ExpenseCategory.OTHER,
    paidBy: CURRENT_USER_ID,
    mySplitPercentage: 50,
    receiptImage: null as string | null
  });
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Event Modal State
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    type: EventType.EVENT
  });
  
  // Settings Modal
  const [isLanguageSelectorOpen, setLanguageSelectorOpen] = useState(false);
  
  // Payment Modal
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  // Settle Up States
  const [isSettling, setIsSettling] = useState(false);
  const [settleSuccess, setSettleSuccess] = useState(false);

  // Helper for RTL safe checks
  const isRtl = () => i18n.dir ? i18n.dir() === 'rtl' : false;

  // --- ONBOARDING HANDLERS ---

  const handleLogin = () => {
    // Simulating Phone Auth Success
    setOnboardingStep('select_action');
  };

  const handleCreateFamily = () => {
    // Simulating API Call to Create Family
    const newFamily: Family = {
      id: "new_fam_" + Date.now(),
      name: newFamilyName || t('create_family'),
      invite_code: "NEW-99", // Generated by backend normally
      invited_parent_phone: partnerPhone, // Storing for soft onboarding
      children: []
    };
    setFamily(newFamily);
    setUser({ ...user, family_id: newFamily.id });
    setOnboardingStep('completed');
  };

  const handleJoinFamily = () => {
    // Simulating Edge Function Call: joinFamilyByCode(inviteCodeInput)
    if (inviteCodeInput === "SHALOM-24") {
      setFamily(mockFamilyData);
      setUser({ ...user, family_id: mockFamilyData.id });
      setOnboardingStep('completed');
    } else {
      alert("קוד שגוי. נסה: SHALOM-24");
    }
  };


  // --- FEATURES ---

  // 1. CHAT & AI SENTIMENT
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsAnalyzing(true);
    const sentiment = await analyzeSentiment(newMessage);
    setIsAnalyzing(false);

    if (sentiment.isAggressive) {
      setSentimentAlert(sentiment);
    } else {
      finalizeMessage(newMessage, false);
    }
  };

  const finalizeMessage = (content: string, isRewritten: boolean) => {
    const msg: Message = {
      id: Date.now().toString(),
      family_id: family?.id || '',
      sender_id: CURRENT_USER_ID,
      content: content,
      created_at: new Date().toISOString(),
      is_flagged_by_ai: false, // In a real DB, we might store a flag if original was aggressive
      is_rewritten: isRewritten
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setSentimentAlert(null);
  };

  // 2. EXPENSE TRACKING - BALANCE LOGIC
  const balance = expenses.reduce((acc, exp) => {
    if (exp.is_settled) return acc;

    const mySplit = exp.split_details.find(d => d.user_id === CURRENT_USER_ID);
    const myResponsibility = mySplit ? mySplit.amount_owed : 0;
    const amountIPaid = exp.paid_by === CURRENT_USER_ID ? exp.amount : 0;
    
    return acc + (amountIPaid - myResponsibility);
  }, 0);

  const handleAddExpenseClick = () => {
    setExpenseForm({
      description: '',
      amount: '',
      category: ExpenseCategory.OTHER,
      paidBy: CURRENT_USER_ID,
      mySplitPercentage: 50,
      receiptImage: null
    });
    setExpenseModalOpen(true);
  };

  const handleSettleUp = async () => {
    if (Math.abs(balance) < 0.01) return;

    if (window.confirm(t('settle_up_confirm'))) {
        setIsSettling(true);
        // Simulate network/processing delay for visual effect
        await new Promise(r => setTimeout(r, 800)); 
        
        setExpenses(prev => prev.map(exp => ({ ...exp, is_settled: true })));
        setIsSettling(false);
        setSettleSuccess(true);
        
        // Reset success state after a few seconds
        setTimeout(() => setSettleSuccess(false), 2000);
    }
  };

  const handlePickImage = async (useCamera: boolean) => {
    // Web-specific implementation to ensure preview works in browser without native modules
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
        input.capture = 'environment'; // Attempt to trigger camera on mobile
    }
    
    input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === 'string') {
                     setExpenseForm(prev => ({ ...prev, receiptImage: event.target?.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
  };

  const saveExpense = async () => {
    const amountVal = parseFloat(expenseForm.amount);
    if (!expenseForm.description || isNaN(amountVal) || amountVal <= 0) return;

    setIsUploading(true);

    let uploadedPath = undefined;
    if (expenseForm.receiptImage && family?.id) {
       try {
         // Upload to Supabase Storage
         uploadedPath = await uploadReceiptImage(expenseForm.receiptImage, family.id);
       } catch (err) {
         alert("Failed to upload image. Saving without receipt.");
       }
    }

    const myPct = expenseForm.mySplitPercentage / 100;
    const theirPct = 1 - myPct;
    
    const myAmount = amountVal * myPct;
    const theirAmount = amountVal * theirPct;

    const newExpense: Expense = {
      id: Date.now().toString(),
      family_id: family?.id || '',
      paid_by: expenseForm.paidBy,
      amount: amountVal,
      description: expenseForm.description,
      category: expenseForm.category,
      date_incurred: new Date().toISOString(),
      is_settled: false,
      receipt_image_path: uploadedPath,
      // Hack for Prototype: Store the Data URI in receipt_url so it shows immediately without resolving the Storage Path
      receipt_url: expenseForm.receiptImage || undefined,
      split_details: [
        { user_id: CURRENT_USER_ID, percentage: myPct, amount_owed: myAmount },
        { user_id: CO_PARENT_ID, percentage: theirPct, amount_owed: theirAmount }
      ]
    };

    setExpenses(prev => [newExpense, ...prev]);
    setIsUploading(false);
    setExpenseModalOpen(false);
  };

  // 3. CALENDAR SWAPS & EVENTS
  const handleApproveEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: EventStatus.APPROVED } : e));
  };
  
  // Opens the "New Event" Modal
  const handleRequestChange = () => {
      setNewEventForm({
        title: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        type: EventType.EVENT
      });
      setEventModalOpen(true);
  };

  const saveNewEvent = () => {
    if (!newEventForm.title || !newEventForm.startTime || !newEventForm.endTime) return;

    const newEvent: CalendarEvent = {
      id: `new_${Date.now()}`,
      family_id: family?.id,
      created_by: CURRENT_USER_ID,
      title: newEventForm.title,
      start_time: new Date(newEventForm.startTime).toISOString(),
      end_time: new Date(newEventForm.endTime).toISOString(),
      type: newEventForm.type,
      status: EventStatus.PROPOSED, // Defaults to a Request
      is_immutable: false,
      source: 'APP',
      color: 'orange' // Highlight new requests
    };

    setEvents(prev => [...prev, newEvent]);
    setEventModalOpen(false);
  };

  // 4. LEGAL / MONETIZATION
  const handlePurchaseReportClick = () => {
    setPaymentModalOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setUser(prev => ({ ...prev, report_credits: prev.report_credits + 1 }));
    // Optional: Add a small toast or success indication here
  };

  const handleGenerateReport = () => {
    if (user.report_credits > 0) {
      alert("הדוח נשלח למייל שלך! (יתרת דוחות: " + (user.report_credits - 1) + ")");
      setUser(prev => ({ ...prev, report_credits: prev.report_credits - 1 }));
    }
  };

  // --- RENDER HELPERS ---
  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case ExpenseCategory.MEDICAL: return <StethoscopeIcon className="w-5 h-5" />;
      case ExpenseCategory.EDUCATION: return <GraduationCapIcon className="w-5 h-5" />;
      case ExpenseCategory.FOOD: return <UtensilsIcon className="w-5 h-5" />;
      case ExpenseCategory.CLOTHING: return <ShirtIcon className="w-5 h-5" />;
      default: return <DollarSignIcon className="w-5 h-5" />;
    }
  };

  const getCategoryStyles = (category: ExpenseCategory) => {
    switch (category) {
      case ExpenseCategory.MEDICAL: return 'bg-red-50 text-red-600';
      case ExpenseCategory.EDUCATION: return 'bg-blue-50 text-blue-600';
      case ExpenseCategory.FOOD: return 'bg-orange-50 text-orange-600';
      case ExpenseCategory.CLOTHING: return 'bg-purple-50 text-purple-600';
      default: return 'bg-sage-100 text-primary';
    }
  };

  const renderNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sage-100 px-6 py-3 flex justify-between items-center z-50 shadow-lg pb-safe">
      <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center ${activeTab === 'calendar' ? 'text-primary' : 'text-sage-400'}`}>
        <CalendarIcon className="w-6 h-6" />
        <span className="text-xs font-medium mt-1">{t('tab_calendar')}</span>
      </button>
      <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center ${activeTab === 'expenses' ? 'text-primary' : 'text-sage-400'}`}>
        <DollarSignIcon className="w-6 h-6" />
        <span className="text-xs font-medium mt-1">{t('tab_expenses')}</span>
      </button>
      <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center ${activeTab === 'chat' ? 'text-primary' : 'text-sage-400'}`}>
        <MessageCircleIcon className="w-6 h-6" />
        <span className="text-xs font-medium mt-1">{t('tab_chat')}</span>
      </button>
      <button onClick={() => setActiveTab('legal')} className={`flex flex-col items-center ${activeTab === 'legal' ? 'text-primary' : 'text-sage-400'}`}>
        <ShieldIcon className="w-6 h-6" />
        <span className="text-xs font-medium mt-1">{t('tab_legal')}</span>
      </button>
    </div>
  );

  // --- MAIN RENDER ---

  if (onboardingStep !== 'completed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-charcoal">
        <div className="w-full max-w-sm">
          {onboardingStep === 'login' && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-sage-100 text-center animate-in fade-in flex flex-col items-center">
              <img 
                src="https://i.postimg.cc/m2PRBz5x/A-sophisticated-modern-2k-202512171532-removebg-preview.png"
                alt="Evenly Logo"
                className="w-[150px] h-[150px] object-contain mb-5 mx-auto" 
              />
              <h2 className="text-lg font-medium text-sage-400 mb-6">{t('welcome')}</h2>
              
              <input type="tel" placeholder={t('phone_placeholder')} className="w-full p-3 bg-sage-50 border border-sage-200 rounded-xl mb-4 text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" dir="ltr" />
              <button onClick={handleLogin} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-colors">{t('send_code')}</button>
            </div>
          )}

          {/* ... (Other onboarding steps omitted for brevity but logic exists) ... */}
          {onboardingStep === 'select_action' && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-sage-100 text-center animate-in slide-in-from-right">
              <h2 className="text-xl font-bold mb-6 text-charcoal">{t('status_title')}</h2>
              <button onClick={() => setOnboardingStep('create_family')} className="w-full py-4 bg-sage-50 border border-primary text-primary rounded-xl font-semibold mb-4 flex items-center justify-center gap-2 hover:bg-sage-100 transition-colors">
                <PlusIcon className="w-5 h-5" />
                {t('parent_first')}
              </button>
              <button onClick={() => setOnboardingStep('join_family')} className="w-full py-4 bg-white border border-sage-200 text-charcoal rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-sage-50 transition-colors">
                 {t('have_code')}
              </button>
            </div>
          )}

          {onboardingStep === 'create_family' && (
             <div className="bg-white p-6 rounded-2xl shadow-xl border border-sage-100 text-center animate-in slide-in-from-right">
              <h2 className="text-xl font-bold mb-4 text-charcoal">{t('create_family')}</h2>
              <div className="text-start mb-4">
                <label className="text-xs font-bold text-sage-400 mb-1 block">{t('family_name_label')}</label>
                <input value={newFamilyName} onChange={e => setNewFamilyName(e.target.value)} type="text" className="w-full p-3 bg-sage-50 border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="text-start mb-6">
                <label className="text-xs font-bold text-sage-400 mb-1 block">{t('partner_phone_label')}</label>
                <input value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)} type="tel" placeholder="050-0000000" className="w-full p-3 bg-sage-50 border border-sage-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              </div>
              <button onClick={handleCreateFamily} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-opacity-90">{t('create_start')}</button>
              <button onClick={() => setOnboardingStep('select_action')} className="mt-4 text-sm text-sage-400 block w-full hover:text-primary">{t('back')}</button>
             </div>
          )}

           {onboardingStep === 'join_family' && (
             <div className="bg-white p-6 rounded-2xl shadow-xl border border-sage-100 text-center animate-in slide-in-from-right">
              <h2 className="text-xl font-bold mb-2 text-charcoal">{t('join_family')}</h2>
              <input value={inviteCodeInput} onChange={e => setInviteCodeInput(e.target.value.toUpperCase())} type="text" placeholder="XXXX-XX" className="w-full p-4 bg-sage-50 border border-sage-200 rounded-xl mb-6 text-center text-2xl font-mono tracking-widest uppercase text-primary focus:outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              <button onClick={handleJoinFamily} className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-opacity-90">{t('join_btn')}</button>
              <button onClick={() => setOnboardingStep('select_action')} className="mt-4 text-sm text-sage-400 block w-full hover:text-primary">{t('back')}</button>
             </div>
          )}

          <div className="mt-8 flex justify-center">
            <button onClick={() => setLanguageSelectorOpen(true)} className="flex items-center gap-1 text-sage-400 text-xs hover:text-primary transition-colors">
              <SettingsIcon className="w-3 h-3" />
              {t('settings_language')}
            </button>
          </div>
        </div>

        {isLanguageSelectorOpen && <LanguageSelector onClose={() => setLanguageSelectorOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-charcoal pb-20 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-sage-100">
      
      {/* HEADER */}
      <header className="bg-white px-6 py-5 border-b border-sage-100 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start">
            <img 
              src="https://i.postimg.cc/m2PRBz5x/A-sophisticated-modern-2k-202512171532-removebg-preview.png" 
              alt="Evenly" 
              className="w-[100px] h-10 object-contain"
            />
            <p className="text-[10px] text-sage-400 font-medium mt-1">{family?.name}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-xs bg-sage-50 px-2 py-1 rounded text-sage-400 font-mono" dir="ltr">
               Code: {family?.invite_code}
             </div>
             <div className="h-8 w-8 bg-sage-100 rounded-full flex items-center justify-center text-primary font-bold text-xs">
              {t('me')}
             </div>
             <button onClick={() => setLanguageSelectorOpen(true)} className="text-sage-400 hover:text-primary transition-colors">
                <SettingsIcon className="w-6 h-6" />
             </button>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="h-[calc(100vh-80px)] bg-white">
        
        {activeTab === 'calendar' && (
          <UnifiedCalendarScreen 
             internalEvents={events} 
             onRequestChange={handleRequestChange} 
          />
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6 p-4">
             <div className="bg-primary text-white p-6 rounded-2xl shadow-lg transition-all">
                <p className="text-white/70 text-sm font-medium mb-1">{t('balance_title')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" dir="ltr">{balance >= 0 ? '+' : '-'}{Math.abs(balance).toFixed(2)} ₪</span>
                </div>
                <p className="text-sm text-white/80 mt-2">{balance >= 0 ? t('owed_to_you') : t('you_owe')}</p>
                
                <button 
                  onClick={handleSettleUp}
                  disabled={Math.abs(balance) < 0.01 || isSettling}
                  className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 
                    ${Math.abs(balance) < 0.01 ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 text-white'}
                    ${settleSuccess ? 'bg-green-500/20 text-green-100' : ''}
                  `}
                >
                  {isSettling && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  {settleSuccess ? t('settled_success') : t('settle_up')}
                </button>
             </div>

             <div className="space-y-3">
               <h3 className="text-sm font-semibold text-sage-400 uppercase tracking-wider">{t('recent_expenses')}</h3>
               {expenses.map(exp => {
                 const mySplit = exp.split_details.find(d => d.user_id === CURRENT_USER_ID);
                 const sharePct = mySplit ? (mySplit.percentage * 100).toFixed(0) : '0';
                 // Check if image exists (legacy url or new storage path)
                 const hasImage = !!(exp.receipt_image_path || exp.receipt_url);

                 return (
                   <div 
                      key={exp.id} 
                      onClick={() => setSelectedExpense(exp)}
                      className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center hover:border-accent/50 transition-colors cursor-pointer ${exp.is_settled ? 'border-sage-50 opacity-60' : 'border-sage-100'}`}
                   >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryStyles(exp.category)} relative`}>
                          {exp.is_settled && <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center"><CheckIcon className="w-5 h-5 text-primary" /></div>}
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${exp.is_settled ? 'text-sage-400 line-through' : 'text-charcoal'}`}>{exp.description}</h4>
                          <p className="text-xs text-sage-400">
                            {exp.paid_by === CURRENT_USER_ID ? t('you_paid') : t('they_paid')} • {t('your_share')}: {sharePct}%
                          </p>
                          {hasImage && (
                             <span className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                               <ImageIcon className="w-3 h-3" /> Receipt Attached
                             </span>
                          )}
                        </div>
                      </div>
                      <span className={`font-bold ${exp.is_settled ? 'text-sage-300' : 'text-charcoal'}`}>{exp.amount.toFixed(2)} ₪</span>
                   </div>
                 );
               })}
             </div>
             
             <button onClick={handleAddExpenseClick} className="w-full py-3 bg-white border border-sage-200 text-charcoal rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 hover:bg-sage-50 transition-colors">
               <PlusIcon className="w-5 h-5"/> {t('add_receipt')}
            </button>
          </div>
        )}

        {/* EXPENSE DETAILS MODAL */}
        {selectedExpense && (
            <ExpenseDetailsModal 
              expense={selectedExpense} 
              onClose={() => setSelectedExpense(null)} 
              currentUserId={CURRENT_USER_ID}
            />
        )}

        {/* ADD EXPENSE MODAL */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-charcoal mb-4">{t('add_expense_title')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-sage-400 mb-1">{t('description_label')}</label>
                  <input 
                    type="text" 
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    placeholder="..."
                    className="w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-sage-400 mb-1">{t('amount_label')}</label>
                    <div className="relative">
                      <span className={`absolute top-2 text-sage-400 ${isRtl() ? 'right-3' : 'left-3'}`}>₪</span>
                      <input 
                        type="number" 
                        value={expenseForm.amount}
                        onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                        placeholder="0.00"
                        className={`w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none ${isRtl() ? 'pr-8' : 'pl-8'}`}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-semibold text-sage-400 mb-1">{t('category_label')}</label>
                     <select 
                       value={expenseForm.category}
                       onChange={e => setExpenseForm({...expenseForm, category: e.target.value as ExpenseCategory})}
                       className="w-full border border-sage-200 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                     >
                        {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                </div>

                {/* IMAGE UPLOAD SECTION */}
                <div>
                   <label className="block text-xs font-semibold text-sage-400 mb-2">Receipt Image (Optional)</label>
                   
                   {expenseForm.receiptImage ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-sage-200 group">
                        <img src={expenseForm.receiptImage} alt="Receipt Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setExpenseForm(prev => ({ ...prev, receiptImage: null }))}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                   ) : (
                     <div className="flex gap-3">
                        <button 
                          onClick={() => handlePickImage(true)}
                          className="flex-1 py-3 border border-dashed border-sage-300 text-sage-400 rounded-xl hover:bg-sage-50 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <CameraIcon className="w-5 h-5" />
                          <span className="text-xs font-medium">Camera</span>
                        </button>
                        <button 
                          onClick={() => handlePickImage(false)}
                          className="flex-1 py-3 border border-dashed border-sage-300 text-sage-400 rounded-xl hover:bg-sage-50 flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-xs font-medium">Gallery</span>
                        </button>
                     </div>
                   )}
                </div>

                <div>
                   <label className="block text-xs font-semibold text-sage-400 mb-2">{t('paid_by_label')}</label>
                   <div className="flex bg-sage-50 rounded-lg p-1">
                      <button 
                        onClick={() => setExpenseForm({...expenseForm, paidBy: CURRENT_USER_ID})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${expenseForm.paidBy === CURRENT_USER_ID ? 'bg-white text-charcoal shadow-sm' : 'text-sage-400'}`}
                      >
                        {t('me')}
                      </button>
                      <button 
                        onClick={() => setExpenseForm({...expenseForm, paidBy: CO_PARENT_ID})}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${expenseForm.paidBy === CO_PARENT_ID ? 'bg-white text-charcoal shadow-sm' : 'text-sage-400'}`}
                      >
                        {t('other_parent')}
                      </button>
                   </div>
                </div>

                <div className="pt-2 border-t border-sage-50">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-sage-400">{t('split_label')}</label>
                    <span className="text-sm font-bold text-primary">{expenseForm.mySplitPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={expenseForm.mySplitPercentage}
                    onChange={e => setExpenseForm({...expenseForm, mySplitPercentage: parseInt(e.target.value)})}
                    className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{ direction: 'ltr' }} 
                  />
                  <div className="flex justify-between mt-2 text-xs text-sage-400">
                    <span>{t('you_pay')}: {((parseFloat(expenseForm.amount) || 0) * (expenseForm.mySplitPercentage / 100)).toFixed(2)} ₪</span>
                    <span>{t('they_pay')}: {((parseFloat(expenseForm.amount) || 0) * ((100 - expenseForm.mySplitPercentage) / 100)).toFixed(2)} ₪</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setExpenseModalOpen(false)}
                    disabled={isUploading}
                    className="flex-1 py-3 text-sage-400 font-semibold bg-sage-50 rounded-xl hover:bg-sage-100 disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={saveExpense}
                    disabled={isUploading}
                    className="flex-1 py-3 text-white font-semibold bg-primary rounded-xl hover:bg-opacity-90 shadow-md disabled:bg-opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         Uploading...
                       </>
                    ) : (
                       t('save')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW EVENT MODAL */}
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
              <h2 className="text-xl font-bold text-charcoal mb-4">{t('new_event_title')}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-sage-400 mb-1">{t('event_title_label')}</label>
                  <input 
                    type="text" 
                    value={newEventForm.title}
                    onChange={e => setNewEventForm({...newEventForm, title: e.target.value})}
                    placeholder="..."
                    className="w-full border border-sage-200 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-sage-400 mb-1">{t('start_time_label')}</label>
                    <input 
                      type="datetime-local" 
                      value={newEventForm.startTime}
                      onChange={e => setNewEventForm({...newEventForm, startTime: e.target.value})}
                      className="w-full border border-sage-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none ltr-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sage-400 mb-1">{t('end_time_label')}</label>
                    <input 
                      type="datetime-local" 
                      value={newEventForm.endTime}
                      onChange={e => setNewEventForm({...newEventForm, endTime: e.target.value})}
                      className="w-full border border-sage-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none ltr-input"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-sage-400 mb-1">{t('event_type_label')}</label>
                   <select 
                     value={newEventForm.type}
                     onChange={e => setNewEventForm({...newEventForm, type: e.target.value as EventType})}
                     className="w-full border border-sage-200 rounded-lg p-3 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                   >
                     <option value={EventType.EVENT}>{t('event_type_label')} - Event</option>
                     <option value={EventType.CUSTODY}>Custody</option>
                     <option value={EventType.APPOINTMENT}>Appointment</option>
                   </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setEventModalOpen(false)}
                    className="flex-1 py-3 text-sage-400 font-semibold bg-sage-50 rounded-xl hover:bg-sage-100"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={saveNewEvent}
                    className="flex-1 py-3 text-white font-semibold bg-primary rounded-xl hover:bg-opacity-90 shadow-md"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {isPaymentModalOpen && (
           <PaymentModal 
             amount={150}
             onClose={() => setPaymentModalOpen(false)}
             onSuccess={handlePaymentSuccess}
           />
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-180px)] p-4">
            <div className="flex-1 overflow-y-auto space-y-4 pl-2 pb-4">
              <div className="flex justify-center">
                 <span className="text-xs bg-sage-50 text-sage-400 px-3 py-1 rounded-full border border-sage-100">{t('chat_disclaimer')}</span>
              </div>
              {messages.map(msg => {
                const isMe = msg.sender_id === CURRENT_USER_ID;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? `bg-primary text-white ${isRtl() ? 'rounded-tl-none' : 'rounded-tr-none'}` : `bg-white border border-sage-200 text-charcoal ${isRtl() ? 'rounded-tr-none' : 'rounded-tl-none'}`}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI INTERVENTION MODAL */}
            {sentimentAlert && (
              <div className="absolute bottom-4 left-4 right-4 bg-white border border-red-100 rounded-2xl shadow-2xl z-50 p-4 animate-in slide-in-from-bottom-5">
                <div className="flex items-start gap-3">
                  <div className="bg-red-50 p-2 rounded-full text-red-600 shrink-0">
                    <BotIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal">{t('ai_hold_on')}</h3>
                    <p className="text-sm text-charcoal mt-1 mb-2">{sentimentAlert.reason}</p>
                    <div className="bg-sage-50 p-3 rounded-lg border border-sage-100 mb-3">
                      <p className="text-xs font-semibold text-sage-400 mb-1">{t('ai_suggested')}</p>
                      <p className="text-sm text-charcoal italic">"{sentimentAlert.suggestedRewrite}"</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => finalizeMessage(sentimentAlert.suggestedRewrite, true)}
                        className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90"
                      >
                        {t('send_correction')}
                      </button>
                      <button 
                        onClick={() => finalizeMessage(newMessage, false)}
                        className="px-4 py-2 text-sage-400 text-sm font-medium hover:text-charcoal"
                      >
                        {t('send_anyway')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mt-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('type_message')}
                disabled={isAnalyzing}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className={`w-full bg-white border border-sage-200 rounded-full py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow disabled:bg-sage-50 disabled:text-sage-300 ${isRtl() ? 'pr-4 pl-12' : 'pl-4 pr-12'}`}
              />
              <button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim() || isAnalyzing}
                className={`absolute top-2 h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isRtl() ? 'left-2' : 'right-2'}`}
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div style={{ transform: isRtl() ? 'scaleX(-1)' : 'none' }}>
                    <SendIcon className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-4 p-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-100 text-center">
                <ShieldIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-lg font-bold text-charcoal">{t('legal_report')}</h2>
                <p className="text-sm text-sage-400 mb-6">{t('legal_desc')}</p>
                
                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg mb-6 text-start">
                  <strong>{t('legal_note')}</strong>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm text-sage-500">{t('report_balance')}</span>
                  <span className="font-bold text-charcoal bg-sage-50 px-2 py-1 rounded">{user.report_credits}</span>
                </div>

                {user.report_credits > 0 ? (
                  <button 
                    onClick={handleGenerateReport}
                    className="w-full py-3 bg-charcoal text-white rounded-xl font-semibold shadow-md hover:bg-opacity-90"
                  >
                     {t('download_report')}
                  </button>
                ) : (
                  <button 
                    onClick={handlePurchaseReportClick}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold shadow-md hover:bg-opacity-90 flex flex-col items-center justify-center"
                  >
                     <span>{t('buy_report')}</span>
                     <span className="text-xs opacity-90 font-normal">150 ₪</span>
                  </button>
                )}
             </div>
             
             <div className="bg-sage-50 p-4 rounded-xl border border-sage-200 flex justify-between items-center">
               <div>
                 <h4 className="font-bold text-primary">{t('premium_package')}</h4>
                 <p className="text-xs text-sage-400">{t('premium_desc')}</p>
               </div>
               <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">{t('upgraded')}</span>
             </div>
          </div>
        )}

        {isLanguageSelectorOpen && <LanguageSelector onClose={() => setLanguageSelectorOpen(false)} />}
      </main>

      {/* NAVIGATION BAR */}
      {renderNav()}
    </div>
  );
}