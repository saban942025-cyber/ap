/**
 * קוד זה רץ בצד השרת של Google Apps Script
 * ומשמש כ-Backend להעלאת קבצים ל-Google Drive
 * ושליחת התראות WhatsApp.
 * * גלגול (Deployment) נדרש לאחר כל שינוי.
 */

// --- קבועים גלובליים ---
const FOLDER_ID = "1u7p6xeSZzHyGn-SNOIZFDL5sKvv3vZTV"; // מזהה תיקיית "doc"
const WHATSAPP_PHONE_NUMBER = "972508860896"; // מספר טלפון של מחלקת הזמנות

/**
 * פונקציית הכניסה הראשית של ה-Web App.
 * מטפלת בבקשות POST המכילות קבצים להעלאה.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // 1. Decode Base64
    const decodedData = Utilities.base64Decode(payload.fileData);
    const fileBlob = Utilities.newBlob(decodedData, payload.mimeType, payload.fileName);
    
    // 2. Save file to Drive
    const fileResult = saveFileToDrive(fileBlob, payload.fileName, payload.customerId);
    
    if (!fileResult.success) {
      throw new Error(fileResult.error);
    }

    // 3. Generate WhatsApp notification
    const waUrl = sendWhatsAppNotification(fileResult.url, payload.customerId, fileResult.name);

    // 4. Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        url: fileResult.url,
        name: fileResult.name,
        waUrl: waUrl // [NEW v36] Return the WA URL to the client
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost Error: " + error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * פונקציית שמירת הקובץ ב-Google Drive.
 * (זו הפונקציה שביקשת).
 */
function saveFileToDrive(fileBlob, fileName, customerId) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const cleanName = `${customerId || 'unknown'}_${timestamp}_${fileName}`;
    
    const file = folder.createFile(fileBlob);
    file.setName(cleanName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // [FIX] Make public
    
    const fileUrl = file.getUrl();
    Logger.log("File saved successfully: " + fileUrl);
    
    return {
      success: true,
      url: fileUrl,
      name: cleanName
    };
  } catch (e) {
    Logger.log("Error saving file: " + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * פונקציה ליצירת לינק מקוצר (כפי שביקשת).
 */
function shortenUrl(longUrl) {
  // שירות shrtco.de אינו יציב. אם הוא נכשל, פשוט נחזיר את הלינק הארוך.
  try {
    const response = UrlFetchApp.fetch(
      "https://api.shrtco.de/v2/shorten?url=" + encodeURIComponent(longUrl),
      { "muteHttpExceptions": true } // Don't crash on failure
    );
    const data = JSON.parse(response.getContentText());
    return data.ok ? data.result.full_short_link : longUrl;
  } catch (e) {
    Logger.log("Error shortening URL: " + e);
    return longUrl;
  }
}

/**
 * פונקציית הכנת הודעת WhatsApp (כפי שביקשת).
 * [FIX v36] - תוקנה התחביר של ה-waUrl.
 */
function sendWhatsAppNotification(fileUrl, customerId) {
  const shortUrl = shortenUrl(fileUrl);
  
  const message = `
📄 *מסמך חדש מהמערכת!*

*מזהה לקוח:* ${customerId || 'לא ידוע'}
*קובץ מצורף:* ${shortUrl}

המסמך נשמר בהצלחה ב-Drive.
`;
      
  const encoded = encodeURIComponent(message.trim());
  const waUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encoded}`;

  Logger.log("WhatsApp Share URL Created: " + waUrl);

  return waUrl; // Return the URL
}

