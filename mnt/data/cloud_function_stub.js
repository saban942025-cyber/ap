/**
 * Cloud Function Stub for sending Push Notifications via OneSignal
 * * Instructions:
 * 1. Create a Firebase Cloud Function project.
 * 2. Install dependencies: npm install onesignal-node axios firebase-admin
 * 3. Deploy this function.
 */
// Firebase Cloud Function Stub for Push Notifications
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendPush = functions.firestore.document('messages/{msgId}').onCreate(async (snap) => {
    const msg = snap.data();
    if (msg.senderName === 'נציג') return; // Don't notify on own messages

    // Logic to send to OneSignal REST API would go here
    console.log("Sending push for message:", msg.text);
});
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OneSignal = require('onesignal-node');

admin.initializeApp();

const client = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID || "de3834d3-1e11-40af-96d2-b25eda821c8f", 
  process.env.ONESIGNAL_API_KEY || "YOUR_REST_API_KEY" 
);

exports.sendPushOnMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    // Check if message is from worker (readByWorker is usually false initially, check sender ID or specific flag)
    // Simplification: If senderName is 'נציג', notify customer. Else notify worker.
    const isFromWorker = message.senderName === 'נציג'; 
    
    if (!isFromWorker) {
       // Notify Workers
       const notification = {
         contents: { 'en': message.text || 'הודעה חדשה' },
         headings: { 'en': `הודעה מ-${message.senderName}` },
         filters: [{ field: 'tag', key: 'role', relation: '=', value: 'worker' }]
       };
       try { await client.createNotification(notification); } catch (e) { console.error("Push Error Worker", e); }
    } else {
       // Notify Customer (Assuming senderId matches external_user_id in OneSignal)
       // You need to get the target customer UID. In a chat room, the room ID is usually the project ID, 
       // but you need the customer UID. The message doc has senderId (worker), so you need the 'other' participant.
       // Better approach: Store 'recipientId' in message doc.
       
       // Fallback logic for demo:
       const notification = {
         contents: { 'en': message.text },
         headings: { 'en': 'הודעה חדשה מ-Sidor' },
         // include_external_user_ids: [RECIPIENT_UID] 
       };
       // await client.createNotification(notification);
    }
});
