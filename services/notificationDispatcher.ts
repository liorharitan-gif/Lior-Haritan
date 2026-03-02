// Pseudo-code for Notification Logic (Backend Service)

interface NotificationPayload {
  familyId: string;
  triggerUserId: string;
  eventType: 'EVENT_CREATED' | 'EXPENSE_ADDED' | 'MESSAGE_SENT';
  details: string; // "Added Dentist Appointment"
}

export async function dispatchNotification(payload: NotificationPayload) {
  const { familyId, triggerUserId, eventType, details } = payload;

  // 1. Fetch Family Members
  // (Assuming access to DB)
  const members = await db.profiles.find({ family_id: familyId });
  const family = await db.families.findById(familyId);

  // 2. Filter out the person who triggered the action
  const recipients = members.filter(m => m.id !== triggerUserId);

  // 3. LOGIC: Decide SMS vs PUSH
  
  if (recipients.length > 0) {
    // SCENARIO A: The other parent IS in the app.
    // Send Push Notification
    for (const recipient of recipients) {
      if (recipient.pushToken) {
        await sendPush(recipient.pushToken, {
          title: "עדכון חדש ב-Evenly",
          body: details
        });
      }
    }
  } else {
    // SCENARIO B: The "Soft Onboarding" Case. 
    // The other parent hasn't joined yet, but we have their number.
    if (family.invited_parent_phone) {
      
      const deepLink = `https://evenly.app/invite/${family.invite_code}`;
      const messageBody = `היי, השותף להורות הוסיף עדכון ב-Evenly: "${details}". לצפייה והצטרפות: ${deepLink}`;

      // Send SMS (Twilio / Aws SNS)
      await sendSMS(family.invited_parent_phone, messageBody);
      
      console.log(`[Growth] Soft onboarding SMS sent to ${family.invited_parent_phone}`);
    }
  }
}

// Mock implementation functions
async function sendPush(token: string, data: any) { console.log("Push sent", data); }
async function sendSMS(phone: string, body: string) { console.log("SMS sent", body); }
const db = { profiles: { find: async (q: any) => [] }, families: { findById: async (id: string) => ({}) } } as any;