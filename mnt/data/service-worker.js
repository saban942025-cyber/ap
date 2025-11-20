/**
 * Cloud Function Stub for sending Push Notifications via OneSignal
 * * Instructions:
 * 1. Create a Firebase Cloud Function project.
 * 2. Install dependencies: npm install onesignal-node axios firebase-admin
 * 3. Deploy this function.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OneSignal = require('onesignal-node');

admin.initializeApp();

const client = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID, // Set via: firebase functions:config:set onesignal.app_id="..."
  process.env.ONESIGNAL_API_KEY // Set via: firebase functions:config:set onesignal.api_key="..."
);

exports.sendPushOnMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    // Avoid sending push for own messages if needed, logic here handles target
    const isFromWorker = message.senderId === 'WORKER_ID' || message.readByWorker === true; // Adjust logic
    
    // If message is from Customer -> Notify Workers
    if (!isFromWorker) {
       const notification = {
         contents: { 'en': message.text || 'New Attachment' },
         headings: { 'en': `New Message from ${message.senderName}` },
         filters: [{ field: 'tag', key: 'role', relation: '=', value: 'worker' }]
       };
       try {
         await client.createNotification(notification);
       } catch (e) {
         console.error("Error sending push to worker", e);
       }
    } 
    // If message is from Worker -> Notify Customer
    else {
       const notification = {
         contents: { 'en': message.text },
         include_external_user_ids: [message.senderId] // Assuming uid matches OneSignal external_id
       };
       try {
         await client.createNotification(notification);
       } catch (e) {
         console.error("Error sending push to customer", e);
       }
    }
});
