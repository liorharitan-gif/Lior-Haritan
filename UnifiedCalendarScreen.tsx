import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths } from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { CalendarEvent, EventType } from './types';
import { CalendarIcon, PlusIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useNativeEvents } from './services/calendarService';

interface Props {
  internalEvents: CalendarEvent[];
  onRequestChange: () => void;
}

export default function UnifiedCalendarScreen({ internalEvents, onRequestChange }: Props) {
  const { t, i18n } = useTranslation();
  const { fetchNativeEvents } = useNativeEvents();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Tracks the Month being viewed
  const [isExpanded, setIsExpanded] = useState(false); // Week vs Month view
  const [nativeEvents, setNativeEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingNative, setIsLoadingNative] = useState(false);

  // Determine Locale for date-fns
  const getDateLocale = () => {
    // Note: 'he' locale import was missing in date-fns, falling back to enUS for Hebrew for now or until fixed
    if (i18n.language === 'he') return enUS; 
    if (i18n.language === 'ar') return ar;
    return enUS;
  };

  // Fetch Native Events when the Month Changes
  useEffect(() => {
    const load = async () => {
      setIsLoadingNative(true);
      const start = startOfMonth(currentViewDate);
      const end = endOfMonth(currentViewDate);
      
      try {
        const events = await fetchNativeEvents(start, end);
        setNativeEvents(events);
      } catch (e) {
        console.error("Failed to fetch native events", e);
      } finally {
        setIsLoadingNative(false);
      }
    };
    load();
  }, [currentViewDate]); // Re-run when view date changes (User navigates)

  // Merge Events
  const allEvents = [...internalEvents, ...nativeEvents];

  // Filter events for selected date
  const selectedDayEvents = allEvents.filter(e => 
    isSameDay(new Date(e.start_time), selectedDate)
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Generate days for the view
  const renderCalendarDays = () => {
    if (isExpanded) {
      // Month View
      const monthStart = startOfMonth(currentViewDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
      const endDate = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      // Week View - Always show the week containing the selected date OR the current view date?
      // For smooth UX, week view should probably track the selectedDate, 
      // but to support "scrolling", we base it on currentViewDate if navigating.
      // Let's base the Week View on `currentViewDate` which acts as the "focused" time.
      const start = startOfWeek(currentViewDate, { weekStartsOn: 0 });
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
      }
      return days;
    }
  };

  const daysToRender = renderCalendarDays();

  // Navigation Handlers
  const handlePrev = () => {
    if (isExpanded) {
      setCurrentViewDate(prev => addMonths(prev, -1));
    } else {
      setCurrentViewDate(prev => addWeeks(prev, -1));
    }
  };
  
  const handleNext = () => {
    if (isExpanded) {
      setCurrentViewDate(prev => addMonths(prev, 1));
    } else {
      setCurrentViewDate(prev => addWeeks(prev, 1));
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentViewDate(today);
  };

  const getEventDotColor = (date: Date) => {
    const dayEvents = allEvents.filter(e => isSameDay(new Date(e.start_time), date));
    if (dayEvents.length === 0) return null;
    
    // Priority: Custody (Sage/Primary) > Native (Gray)
    const hasCustody = dayEvents.some(e => e.type === EventType.CUSTODY);
    if (hasCustody) return 'bg-primary';
    return 'bg-sage-400';
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* 1. CALENDAR STRIP / GRID */}
      <div className="bg-white shadow-sm border-b border-sage-100 z-10 transition-all duration-300 ease-in-out relative">
        
        {/* Loading Overlay for Calendar Grid */}
        {isLoadingNative && isExpanded && (
           <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center pointer-events-none">
             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
        )}

        {/* Header (Month Name + Nav) */}
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
             <h2 className="text-lg font-bold text-charcoal w-32">
              {format(currentViewDate, 'MMMM yyyy', { locale: getDateLocale() })}
             </h2>
             {!isSameMonth(currentViewDate, new Date()) && (
                <button 
                  onClick={handleJumpToToday}
                  className="text-[10px] bg-sage-50 text-primary px-2 py-0.5 rounded-md font-bold hover:bg-sage-100"
                >
                  {t('Today', { defaultValue: 'Today' })}
                </button>
             )}
          </div>

          <div className="flex items-center gap-1">
             <button onClick={handlePrev} className="p-1.5 hover:bg-sage-50 rounded-full text-sage-400 hover:text-primary">
                <div style={{ transform: i18n.dir() === 'rtl' ? 'scaleX(-1)' : 'none' }}>
                  <ChevronLeftIcon className="w-5 h-5" />
                </div>
             </button>
             <button onClick={handleNext} className="p-1.5 hover:bg-sage-50 rounded-full text-sage-400 hover:text-primary">
                <div style={{ transform: i18n.dir() === 'rtl' ? 'scaleX(-1)' : 'none' }}>
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
             </button>
          </div>
        </div>

        {/* Days Grid */}
        <div className={`grid grid-cols-7 gap-y-2 pb-4 px-2 transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-20'}`}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
             <div key={i} className="text-center text-[10px] text-sage-400 font-bold uppercase">{d}</div>
          ))}
          
          {daysToRender.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentViewDate);
            const dotColor = getEventDotColor(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div key={idx} className="flex flex-col items-center justify-center cursor-pointer relative" onClick={() => setSelectedDate(day)}>
                <div className={`
                  w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                  ${isSelected ? 'bg-accent text-charcoal shadow-md scale-105 font-bold' : ''}
                  ${!isSelected && isToday ? 'text-primary font-bold bg-sage-50 border border-sage-200' : ''}
                  ${!isSelected && !isToday && !isCurrentMonth ? 'text-sage-200 opacity-50' : !isSelected && !isToday ? 'text-charcoal' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                {/* Event Dot */}
                <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors ${dotColor || 'bg-transparent'}`}></div>
              </div>
            );
          })}
        </div>
        
        {/* Knob / Drag Handle Visual */}
        <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex justify-center pb-2 cursor-pointer hover:bg-sage-50 group"
        >
            <div className="w-10 h-1 bg-sage-200 rounded-full group-hover:bg-sage-300 transition-colors"></div>
        </div>
      </div>

      {/* 2. AGENDA LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        <div className="flex justify-between items-end mb-2">
            <h3 className="text-sm font-bold text-sage-400 uppercase tracking-wider">
                {format(selectedDate, 'EEEE, d MMMM', { locale: getDateLocale() })}
            </h3>
            {isLoadingNative && <span className="text-xs text-sage-400 flex items-center gap-1">
               <div className="w-2 h-2 bg-sage-400 rounded-full animate-ping"></div> Syncing...
            </span>}
        </div>

        {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sage-300">
                <CalendarIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No events for this day</p>
            </div>
        ) : (
            selectedDayEvents.map(evt => (
                <div key={evt.id} className="flex gap-3 bg-white p-3 rounded-xl border border-sage-100 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 hover:border-accent/50 transition-colors">
                   {/* Color Strip */}
                   <div className={`absolute top-0 bottom-0 w-1 ${i18n.dir() === 'rtl' ? 'right-0' : 'left-0'} ${evt.source === 'GOOGLE' || evt.source === 'APPLE' ? 'bg-sage-300' : 'bg-primary'}`}></div>
                   
                   <div className="flex flex-col items-center justify-center px-2 border-r border-sage-50 min-w-[3rem]">
                       <span className="text-xs font-bold text-charcoal">{format(new Date(evt.start_time), 'HH:mm')}</span>
                       <span className="text-[10px] text-sage-400">{format(new Date(evt.end_time), 'HH:mm')}</span>
                   </div>
                   
                   <div className="flex-1">
                       <h4 className="text-sm font-bold text-charcoal line-clamp-1">{evt.title}</h4>
                       <div className="flex items-center gap-2 mt-1">
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                               evt.source === 'GOOGLE' ? 'bg-orange-50 text-orange-700' :
                               evt.source === 'APPLE' ? 'bg-gray-100 text-gray-700' :
                               'bg-sage-50 text-primary'
                           }`}>
                               {evt.source || 'APP'}
                           </span>
                           {evt.is_immutable && (
                               <span className="text-[10px] text-sage-400 flex items-center gap-1">
                                   <CheckIcon className="w-3 h-3" /> Immutable
                               </span>
                           )}
                       </div>
                   </div>
                </div>
            ))
        )}

        <button 
            onClick={onRequestChange}
            className="w-full mt-4 py-3 bg-white border border-dashed border-primary text-primary rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-sage-50 transition-colors"
        >
            <PlusIcon className="w-5 h-5"/> {t('request_change')}
        </button>
      </div>

    </div>
  );
}