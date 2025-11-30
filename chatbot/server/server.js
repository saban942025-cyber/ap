const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stringSimilarity = require('string-similarity'); // For fuzzy matching
// const admin = require('firebase-admin'); // Uncomment to connect to real DB

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- 1. Mock Database (In real life, fetch from Firestore) ---
const CANNED_MESSAGES = require('./canned_messages.json');
const PRODUCTS_DB = {
    "thermocure 603": { url: "https://thermokir.co.il/product/603", desc: "דבק אקרילי להדבקת אריחים, זמן ייבוש 4 שעות." },
    "sika top": { url: "https://isr.sika.com/", desc: "חומר איטום צמנטי גמיש דו רכיבי." }
};

// --- 2. Intent Classifier (The Logic) ---
function detectIntent(text) {
    const t = text.toLowerCase();
    if (t.includes('מכולה') || t.includes('פסולת') || t.includes('פינוי')) return 'container';
    if (t.includes('מנוף') || t.includes('הובלה') || t.includes('משאית')) return 'transport';
    if (t.includes('בטון') || t.includes('מיקסר')) return 'concrete';
    if (t.includes('הזמנה') || t.includes('סטטוס')) return 'order_status';
    if (t.includes('תרמוקיר') || t.includes('סיקה') || t.includes('דבק')) return 'product_info';
    return 'general';
}

function fillPlaceholders(text, context) {
    let processed = text;
    // Replace dynamic placeholders
    processed = processed.replace('{{customer_name}}', context.name || 'חבר');
    processed = processed.replace('{{order_id}}', context.orderId || 'האחרונה');
    processed = processed.replace('{{branch}}', context.branch || 'הראשי');
    
    // Product Link Injection
    if (processed.includes('{{product_link}}') && context.product) {
        const prod = PRODUCTS_DB[context.product];
        processed = processed.replace('{{product_link}}', prod ? `${prod.desc} (לינק: ${prod.url})` : 'חיפשתי ולא מצאתי דף מוצר מדויק.');
    }
    return processed;
}

// --- 3. API Endpoints ---

// Main Chat Endpoint
app.post('/api/message', async (req, res) => {
    const { text, userContext } = req.body;
    console.log(`User (${userContext.name}): ${text}`);

    // A. Detect Intent
    const intent = detectIntent(text);
    
    // B. Find best canned message
    // Simple logic: Find first message matching the intent with highest match score (omitted for brevity, using filter)
    let match = CANNED_MESSAGES.find(m => m.category === intent);
    
    // Fallback
    if (!match) match = CANNED_MESSAGES.find(m => m.id === 'msg_000'); // General Fallback

    // C. Product Logic Special Case
    if (intent === 'product_info') {
        // Try to extract product name from text
        if(text.includes('603')) userContext.product = "thermocure 603";
        // In real app: use scraping logic here
    }

    // D. Prepare Response
    const responseText = fillPlaceholders(match.body, userContext);

    // E. Simulation Delay (Human typing effect)
    const typingDelay = Math.min(responseText.length * 30, 2000); 

    setTimeout(() => {
        res.json({
            reply_text: responseText,
            intent: intent,
            suggestions: match.suggestions || []
        });
    }, typingDelay);
});

// Handoff Trigger
app.post('/api/handoff', (req, res) => {
    const { history, userContext } = req.body;
    
    const summary = {
        conversation_id: `conv_${Date.now()}`,
        user_id: userContext.uid,
        summary: `לקוח: ${userContext.name}. נושא אחרון: ${history[history.length-1].intent}. ביקש עזרה אנושית.`,
        collected_fields: userContext,
        messages_last_5: history.slice(-5)
    };

    console.log(">>> HANDOFF TO AGENT <<<", summary);
    // Here you would push to Firestore 'messages' collection with type: 'system'
    
    res.json({ status: 'ok', message: 'נציג עודכן' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Saban Bot Brain running on port ${PORT}`));
