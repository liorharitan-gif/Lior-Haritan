import { CalendarEvent, EventType, EventStatus } from '../types';
import { addDays, setHours, startOfToday, isWithinInterval } from 'date-fns';

/**
 * Mock Hook to simulate fetching events from Expo Calendar (Native Device).
 * In a real React Native app, this would use `expo-calendar`.
 */
export const useNativeEvents = () => {
  // In a real implementation: const [permission, requestPermission] = Calendar.useCalendarPermissions();
  
  const fetchNativeEvents = async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    // Simulate async network/device delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Generate deterministic mock events based on the requested range
    // This makes the calendar feel "Endless" as it always finds data
    const mockEvents: CalendarEvent[] = [];
    
    // 1. Add a recurring "Work Meeting" every Tuesday in the window
    let iterator = new Date(startDate);
    while (iterator <= endDate) {
      if (iterator.getDay() === 2) { // Tuesday
        mockEvents.push({
          id: `native_work_${iterator.getTime()}`,
          title: 'Work Sync (Recurring)',
          start_time: setHours(iterator, 10).toISOString(),
          end_time: setHours(iterator, 11).toISOString(),
          type: EventType.NATIVE,
          status: EventStatus.APPROVED,
          is_immutable: false,
          source: 'GOOGLE',
          color: '#94a3b8'
        });
      }
      // 2. Add a "Family Dinner" every Friday
      if (iterator.getDay() === 5) { // Friday
        mockEvents.push({
          id: `native_fam_${iterator.getTime()}`,
          title: 'Family Dinner',
          start_time: setHours(iterator, 19).toISOString(),
          end_time: setHours(iterator, 21).toISOString(),
          type: EventType.NATIVE,
          status: EventStatus.APPROVED,
          is_immutable: false,
          source: 'APPLE',
          color: '#64748b'
        });
      }
      
      iterator = addDays(iterator, 1);
    }

    return mockEvents;
  };

  return { fetchNativeEvents };
};