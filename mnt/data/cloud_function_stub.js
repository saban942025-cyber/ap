/**
 * Cloud Function Stub for sending Push Notifications via OneSignal
 * * *** הוראות אבטחה ***
 * את ה-API KEY (המספר הסודי) שמים אך ורק כאן (בשרת), לא בקבצי ה-HTML!
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OneSignal = require('onesignal-node');

admin.initializeApp();

const client = new OneSignal.Client(
  // *** עדכן כאן את המפתחות או הגדר משתני סביבה ***
  // APP ID: de3834d3-1e11-40af-96d2-b25eda821c8f
  process.env.ONESIGNAL_APP_ID || "de3834d3-1e11-40af-96d2-b25eda821c8f", 
  
  // API KEY: זה הסוד! אל תחשוף אותו בלקוח.
  process.env.ONESIGNAL_API_KEY || "YOUR_REST_API_KEY_HERE" 
);

exports.sendPushOnMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    // לוגיקה לשליחת התראה...
    // ... (שאר הקוד נשאר זהה לקוד המקורי)
});
