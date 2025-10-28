    -->

    <!-- PWA Settings -->
    <link rel="manifest" href="./manifest.json"> <!-- Ensure correct path -->
    <meta name="theme-color" content="#1F2937"> <!-- Dark Nav Color -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes"> <!-- Added missing tag -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://i.postimg.cc/ryPT3r29/image.png">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <!-- Font Awesome for WhatsApp icon -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary-color: #3b82f6; --primary-dark: #2563eb; --bg-light: #f3f4f6;
            --bg-white: #ffffff; --border-color: #e5e7eb; --text-dark: #1f2937;
            --text-light: #6b7280; --bg-dark-nav: #1f2937; --text-nav: #9ca3af;
            --text-nav-active: #ffffff; --bottom-nav-height: 60px;
        }
        html, body { height: 100dvh; /* Use dynamic viewport height */ width: 100vw; overflow: hidden; }
        body { font-family: 'Inter', 'Arial', sans-serif; background-color: var(--bg-light); color: var(--text-dark); display: flex; flex-direction: column; }

        /* Main App View Container */
        .app-container { flex-grow: 1; overflow: hidden; position: relative; padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom)); /* Adjust padding */ }
        .app-view { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; background-color: var(--bg-light); opacity: 0; transition: opacity 0.2s ease-in-out; /* Added transition */ pointer-events: none; z-index: 1; display: flex; flex-direction: column; /* Ensure views fill height */ }
        .app-view.active { opacity: 1; pointer-events: auto; z-index: 10; }

        /* Bottom Navigation */
        #bottom-navbar { position: fixed; bottom: 0; left: 0; right: 0; height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom)); background-color: var(--bg-dark-nav); color: var(--text-nav); display: flex; justify-content: space-around; align-items: flex-start; /* Align items top */ box-shadow: 0 -2px 10px rgba(0,0,0,0.1); z-index: 1000; padding: 0 5px; padding-bottom: env(safe-area-inset-bottom); }
        .nav-button { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 8px; /* Adjust padding */ border-top: 3px solid transparent; flex-grow: 1; transition: color 0.2s, border-color 0.2s; height: 100%; }
        .nav-button svg { width: 22px; height: 22px; margin-bottom: 3px; }
        .nav-button span { font-size: 0.65rem; font-weight: 500; }
        .nav-button.active { color: var(--text-nav-active); border-top-color: var(--primary-color); }
        .nav-button:not(.active):hover { color: var(--text-nav-active); }

        /* Dashboard View */
        #view-dashboard { display: flex; flex-direction: column; }
        #dashboard-map-container { height: 45%; /* Adjusted */ position: relative; background-color: #e0e0e0; flex-shrink: 0; border-bottom: 1px solid var(--border-color); }
        #map { height: 100%; width: 100%; border-radius: 0; }
        #dashboard-content { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-white); }
        #dashboard-tabs { display: flex; border-bottom: 1px solid var(--border-color); flex-shrink: 0; background-color: var(--bg-white); }
        .dash-tab-button { flex: 1; padding: 0.8rem 0.5rem; font-weight: 500; text-align: center; border-bottom: 3px solid transparent; color: var(--text-light); cursor: pointer; font-size: 0.9rem; }
        .dash-tab-button.active { border-bottom-color: var(--primary-color); color: var(--primary-color); }
        #dashboard-search { padding: 0.75rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; background-color: var(--bg-white); }
        #dashboard-search input { border-radius: 99px; } /* Pill shape search */
        #dashboard-lists { flex-grow: 1; position: relative; overflow: hidden; }
        .panel-list { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow-y: auto; background-color: var(--bg-white); opacity: 1; /* Keep visible for structure, hide via active class parent */ }
        .panel-list:not(.active) { display: none; } /* Hide inactive lists */
        .order-card, .driver-card { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); }
        .order-card.active, .driver-card.active { background-color: #eff6ff; /* blue-50 */ border-right: 3px solid var(--primary-color); }

        /* Details Panel Modal (Bottom Sheet) */
        #details-modal { max-width: 100%; width: 100%; margin: 0 auto 0 auto; border: none; border-radius: 12px 12px 0 0; background-color: var(--bg-white); box-shadow: 0 -5px 20px rgba(0,0,0,0.1); padding: 0; max-height: 70vh; overflow: hidden; }
        #details-modal::backdrop { background-color: rgba(0,0,0,0.4); backdrop-filter: blur(1px); }
        /* Add a handle for visual cue */
        .details-modal-handle { width: 40px; height: 4px; background-color: #d1d5db; border-radius: 2px; margin: 8px auto 0 auto; }
        .details-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem 0.5rem 1rem; border-bottom: 1px solid var(--border-color); }
        .details-modal-header h4 { font-weight: 600; font-size: 1.1rem; }
        .details-modal-header button { background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0.25rem; }
        .details-modal-content { padding: 1rem; max-height: calc(70vh - 70px); /* Adjust height considering handle/header */ overflow-y: auto; }
        /* Rest of details styles remain similar */
        .details-modal-content ul { list-style: none; padding: 0; margin: 0; }
        .details-modal-content li { margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-light); }
        .details-modal-content strong { color: var(--text-dark); font-weight: 500; }
        .details-modal-content .sub-header { font-weight: 600; color: var(--text-dark); margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.95rem;}
        .details-modal-content .dist { font-weight: 500; color: var(--text-dark); display: inline-block; min-width: 50px; text-align: right; margin-left: 0.5rem; }
        .status-change-btn { margin-right: 5px; font-size: 0.75rem; color: var(--primary-color); background: none; border: none; cursor: pointer; font-weight: 500;}
        .status-change-btn:hover { text-decoration: underline;}
        .whatsapp-button { background-color: #25D366; color: white; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 3px;}
        .whatsapp-button:hover { background-color: #1DAE50; }

        /* History/Customers View */
        #view-history { background-color: var(--bg-white); /* White background for this view */ }
        #history-tabs { display: flex; border-bottom: 1px solid var(--border-color); flex-shrink: 0; background-color: var(--bg-white); position: sticky; top: 0; z-index: 20; }
        .history-tab-button { flex: 1; padding: 0.9rem 0.5rem; font-weight: 500; text-align: center; border-bottom: 3px solid transparent; color: var(--text-light); cursor: pointer; font-size: 0.9rem;}
        .history-tab-button.active { border-bottom-color: var(--primary-color); color: var(--primary-color); }
        .history-content { flex-grow: 1; overflow-y: auto; padding: 0.75rem; }
        .history-content h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-dark); padding: 0 0.25rem;}
        .table-tools { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; background-color: var(--bg-white); padding: 0.75rem; border-radius: 8px; /* Removed shadow */ border: 1px solid var(--border-color); }
        .table-tools input, .table-tools button { padding: 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.9rem; }
        .table-tools button { background-color: var(--primary-color); color: white; border: none; cursor: pointer; }
        .table-wrapper { overflow-x: auto; background-color: var(--bg-white); border-radius: 8px; border: 1px solid var(--border-color); /* Added border */ }
        /* Table styling refinements */
        .data-table th, .data-table td { padding: 0.6rem 0.75rem; font-size: 0.8rem; }
        .data-table th { background-color: #f9fafb; }
        .data-table .action-button { padding: 4px 7px; font-size: 0.7rem; }
        .data-table .action-button i { width: 14px; height: 14px; }


        /* Full Screen Modals (Refined) */
        .full-modal { max-width: 100%; width: 100%; height: 100dvh; /* Dynamic viewport height */ margin: 0; border-radius: 0; box-shadow: none; padding: 0; display: flex; flex-direction: column; background-color: var(--bg-light); }
        .modal-header { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-white); flex-shrink: 0; position: sticky; top: 0; z-index: 10; }
        .modal-header h3 { font-size: 1.1rem; font-weight: 600; }
        .modal-content { flex-grow: 1; overflow-y: auto; padding: 1rem; }
        .modal-footer { padding: 0.75rem 1rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem; background-color: var(--bg-white); flex-shrink: 0; position: sticky; bottom: 0; z-index: 10; }
        /* Input styling */
        .modal-content label { display: block; text-sm font-medium mb-1 text-gray-700; }
        .modal-content input[type="text"], .modal-content input[type="tel"], .modal-content input[type="date"], .modal-content select, .modal-content textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem; background-color: var(--bg-white); }
        .modal-content select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); background-position: left 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-left: 2.5rem; /* Adjust padding for icon */ }
        /* Customer Search Suggestions */
        #customer-suggestions { max-height: 150px; overflow-y: auto; border: 1px solid var(--border-color); border-top: none; background-color: white; border-radius: 0 0 6px 6px; position: absolute; width: calc(100% - 2rem); /* Match input width based on padding */ z-index: 100; }
        .suggestion-item { padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.9rem; }
        .suggestion-item:hover { background-color: #eff6ff; }
        .suggestion-item small { color: var(--text-light); font-size: 0.75rem; }


        /* Loader (remain the same) */
        .loader-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Toast (remain the same) */
        #toast-container { position: fixed; bottom: calc(var(--bottom-nav-height) + 15px + env(safe-area-inset-bottom)); /* Above bottom nav */ left: 50%; transform: translateX(-50%); z-index: 5000; display: flex; flex-direction: column; gap: 8px; width: calc(100% - 2rem); max-width: 400px;}
        .toast { padding: 10px 15px; background-color: var(--text-dark); color: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); opacity: 0; transform: translateY(20px); transition: all 0.3s ease; font-size: 0.9rem; width: 100%; }
        .toast.show { opacity: 1; transform: translateY(0); } .toast.success { background-color: #16a34a; } .toast.error { background-color: #dc2626; } .toast.info { background-color: #2563eb;} .toast.warn { background-color: #d97706;}

        /* Ping Selection Modal */
        #ping-modal { max-width: 90%; width: 350px; border-radius: 12px; border: none; box-shadow: 0 5px 20px rgba(0,0,0,0.1); padding: 0; }
        #ping-modal::backdrop { background-color: rgba(0,0,0,0.4); }
        .ping-option { display: block; width: 100%; text-align: right; padding: 1rem; border-bottom: 1px solid var(--border-color); cursor: pointer; font-size: 0.95rem; }
        .ping-option:hover { background-color: #f3f4f6; }
        .ping-option:last-child { border-bottom: none; }
        #ping-modal-footer { padding: 0.75rem 1rem; text-align: left; border-top: 1px solid var(--border-color); background-color: #f9fafb;}

    </style>
</head>
<body class="antialiased">

    <div class="app-container">
        <!-- Dashboard View -->
        <main id="view-dashboard" class="app-view active">
            <div id="dashboard-map-container">
                <div id="map"></div>
                <div id="map-loader" class="loader-container"><div class="loader"></div></div>
            </div>
            <div id="dashboard-content">
                <div id="dashboard-tabs">
                    <button id="tab-orders" class="dash-tab-button active" onclick="showPanelTab('orders')">הזמנות חדשות</button>
                    <button id="tab-drivers" class="dash-tab-button" onclick="showPanelTab('drivers')">נהגים פעילים</button>
                </div>
                <div id="dashboard-search">
                    <input type="text" id="search-input" placeholder="חיפוש..." class="w-full px-4 py-1.5 border rounded-full focus:outline-none focus:ring-1 focus:ring-blue-300 text-sm" onkeyup="filterLists()">
                </div>
                <div id="dashboard-lists">
                    <div id="orders-list" class="panel-list active"><div class="loader-container hidden"><div class="loader"></div></div></div>
                    <div id="drivers-list" class="panel-list"><div class="loader-container hidden"><div class="loader"></div></div></div>
                </div>
            </div>
        </main>

        <!-- History & Customers View -->
        <div id="view-history" class="app-view">
             <div id="history-tabs">
                <button class="history-tab-button active" onclick="showHistoryTab('orders')">היסטוריה</button>
                <button class="history-tab-button" onclick="showHistoryTab('customers')">לקוחות</button>
            </div>
            <div class="history-content" id="history-orders-content">
                <h3>היסטוריית הזמנות</h3>
                <div class="table-tools">
                    <input type="text" id="history-search" placeholder="חיפוש...">
                    <div class="flex gap-2"><input type="date" id="history-date-from" title="מתאריך" class="flex-1"><input type="date" id="history-date-to" title="עד תאריך" class="flex-1"></div>
                    <button id="history-filter-btn" onclick="renderHistoryTable()">סנן</button>
                </div>
                <div class="table-wrapper"><table class="data-table"><thead><tr><th>מס'</th><th>לקוח</th><th>נהג</th><th>כתובת</th><th>סטטוס</th><th>תאריך</th><th>פעולות</th></tr></thead><tbody id="history-table-body"><tr><td colspan="7" class="text-center p-4 text-gray-400">טוען...</td></tr></tbody></table></div>
            </div>
            <div class="history-content" id="history-customers-content" style="display: none;">
                <h3>ניהול לקוחות</h3>
                <div class="table-tools"><input type="text" id="customer-search-input" placeholder="חיפוש..." onkeyup="renderCustomerTable()"></div>
                <div class="table-wrapper"><table class="data-table customer-table"><thead><tr><th>שם</th><th>מס'</th><th>טלפון</th><th>כתובת</th></tr></thead><tbody id="customer-table-body"><tr><td colspan="4" class="text-center p-4 text-gray-400">טוען...</td></tr></tbody></table></div>
            </div>
        </div>
         <!-- Add other main views here if needed -->
    </div>

    <!-- Bottom Navigation Bar -->
    <nav id="bottom-navbar">
        <button class="nav-button active" onclick="showView('dashboard')"><i data-feather="map"></i><span>דשבורד</span></button>
        <button class="nav-button" onclick="showView('history')"><i data-feather="archive"></i><span>ארכיון</span></button>
        <button class="nav-button" onclick="openNewOrderForm()"><i data-feather="plus-circle"></i><span>הזמנה</span></button>
        <button class="nav-button" onclick="openPingOptionsModal()"><i data-feather="bell"></i><span>התראה</span></button>
         <a href="log.html" target="_blank" class="nav-button"><i data-feather="file-text"></i><span>לוגים</span></a>
    </nav>

    <!-- Details Modal (Bottom Sheet) -->
    <dialog id="details-modal">
         <div class="details-modal-handle"></div>
        <div class="details-modal-header">
            <h4 id="details-modal-title">פרטים</h4>
            <div>
                 <button id="details-whatsapp-btn" class="whatsapp-button mr-2 hidden" onclick="handleWhatsAppAction()" title="פעולות וואטסאפ"><i class="fab fa-whatsapp"></i></button>
                <button id="details-copy-link-btn" class="hidden mr-1" onclick="copyCustomerLinkFromDetails()" title="העתק לינק ללקוח"><i data-feather="share-2"></i></button>
                <button onclick="closeDetailsModal()"><i data-feather="x"></i></button>
            </div>
        </div>
        <div class="details-modal-content" id="details-modal-body">טוען...</div>
    </dialog>

    <!-- New Order Modal (Full Screen) -->
    <dialog id="new-order-modal" class="full-modal">
        <form onsubmit="submitNewOrder(event)">
            <div class="modal-header">
                <h3>יצירת הזמנה חדשה</h3>
                <button type="button" onclick="closeNewOrderForm()"><i data-feather="x"></i></button>
            </div>
            <div class="modal-content space-y-4">
                <div class="relative">
                    <label for="customer-search" class="block text-sm font-medium mb-1">לקוח (חיפוש או חדש)</label>
                    <input type="text" id="customer-search" class="w-full p-2 border rounded-md" oninput="handleCustomerSearch(this.value)" autocomplete="off" placeholder="התחל להקליד שם...">
                    <div id="customer-suggestions" class="absolute left-0 right-0 mt-1 hidden"></div>
                </div>
                <div id="new-customer-fields" class="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3" style="display: none;">
                     <p class="font-semibold text-blue-700 text-sm">פרטי לקוח חדש</p><input type="hidden" id="customer-id-new"><input type="text" id="customer-name-new" placeholder="שם מלא *" class="w-full p-2 border rounded-md text-sm"><input type="tel" id="customer-phone-new" placeholder="טלפון *" class="w-full p-2 border rounded-md text-sm"><div class="grid grid-cols-3 gap-2"><input type="text" id="customer-street-new" placeholder="רחוב *" class="w-full p-2 border rounded-md text-sm col-span-2"><input type="text" id="customer-streetnum-new" placeholder="מס' *" class="w-full p-2 border rounded-md text-sm"></div><input type="text" id="customer-city-new" placeholder="עיר *" class="w-full p-2 border rounded-md text-sm"><input type="text" id="customer-contact-new" placeholder="איש קשר" class="w-full p-2 border rounded-md text-sm"><input type="text" id="customer-number-new" placeholder="מס' לקוח" class="w-full p-2 border rounded-md text-sm">
                 </div>
                 <div id="existing-customer-display" class="p-3 bg-gray-100 border rounded-lg text-sm space-y-1" style="display: none;">
                    <input type="hidden" id="customer-id-existing">
                    <div class="flex justify-between items-center">
                        <span><strong>לקוח:</strong> <span id="customer-name-display"></span> <span id="customer-number-display" class="text-xs text-gray-500"></span></span>
                        <button type="button" onclick="clearCustomerSelection()" class="text-xs text-red-600 font-medium">נקה בחירה</button>
                    </div>
                    <p><strong>כתובת:</strong> <span id="customer-address-display"></span></p>
                    <p><strong>טלפון:</strong> <span id="customer-phone-display"></span></p>
                </div>
                <hr>
                <h4 class="font-medium text-gray-700">פרטי הזמנה</h4>
                <div><label for="order-number" class="block text-sm font-medium mb-1">מס' הזמנה (אופציונלי)</label><input type="text" id="order-number" placeholder="ריק = מזהה אוטומטי" class="w-full p-2 border rounded-md text-sm"></div>
                <div class="grid grid-cols-2 gap-4"><div><label for="order-date" class="block text-sm font-medium mb-1">תאריך</label><input type="date" id="order-date" class="w-full p-2 border rounded-md text-sm" required></div><div><label for="order-delivery-type" class="block text-sm font-medium mb-1">סוג הובלה</label><select id="order-delivery-type" class="w-full p-2 border rounded-md text-sm bg-white" required><option value="">בחר...</option><option value="הובלת מנוף">מנוף</option><option value="הובלת משאית">משאית</option><option value="איסוף עצמי">איסוף</option></select></div></div>
                <div><label for="order-warehouse" class="block text-sm font-medium mb-1">מחסן</label><select id="order-warehouse" class="w-full p-2 border rounded-md text-sm bg-white" required><option value="">בחר...</option><option value="החרש">החרש</option><option value="התלמיד">התלמיד</option></select></div>
                <div><label for="order-notes" class="block text-sm font-medium mb-1">הערות</label><textarea id="order-notes" rows="3" placeholder="הערות להזמנה..." class="w-full p-2 border rounded-md text-sm"></textarea></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeNewOrderForm()">ביטול</button>
                <button type="submit" id="submit-order-btn" class="btn-primary">צור הזמנה</button>
            </div>
        </form>
    </dialog>

    <!-- Edit Customer Modal (Full Screen - Refined) -->
    <dialog id="customer-edit-modal" class="full-modal">
        <form onsubmit="handleSaveCustomer(event)">
            <input type="hidden" id="customer-edit-id">
            <div class="modal-header">
                <h3 id="customer-edit-title">עריכת לקוח</h3>
                <button type="button" onclick="closeCustomerEditModal()"><i data-feather="x"></i></button>
            </div>
            <div class="modal-content space-y-4">
                 <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">שם*</label><input type="text" id="customer-edit-name" class="w-full p-2 border rounded-md text-sm" required></div><div><label class="block text-sm font-medium mb-1">מס' לקוח</label><input type="text" id="customer-edit-number" class="w-full p-2 border rounded-md text-sm"></div></div>
                 <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">טלפון*</label><input type="tel" id="customer-edit-phone" class="w-full p-2 border rounded-md text-sm" required></div><div><label class="block text-sm font-medium mb-1">איש קשר</label><input type="text" id="customer-edit-contact" class="w-full p-2 border rounded-md text-sm"></div></div>
                 <hr><h4 class="font-medium text-gray-700">כתובת ברירת מחדל*</h4>
                 <div class="grid grid-cols-3 gap-2">
                     <input type="text" id="customer-edit-street" placeholder="רחוב" class="w-full p-2 border rounded-md text-sm col-span-2" required>
                     <input type="text" id="customer-edit-streetnum" placeholder="מס'" class="w-full p-2 border rounded-md text-sm" required>
                 </div>
                 <input type="text" id="customer-edit-city" placeholder="עיר" class="w-full p-2 border rounded-md text-sm" required>
                 <div><label class="block text-sm font-medium mb-1">קואורדינטות (lat, lon)</label><input type="text" id="customer-edit-coords" placeholder="הדבק מ-Google Maps (אופציונלי)" class="w-full p-2 border rounded-md text-sm"><p class="text-xs text-gray-500 mt-1">למיקום מדויק בהזמנות</p></div>
                 <div class="mt-4 border-t pt-3"><h4 class="text-sm font-medium text-gray-600 mb-1">היסטוריית שינויים</h4><ul id="customer-audit-log" class="text-xs text-gray-500 space-y-1 max-h-20 overflow-y-auto bg-gray-50 p-2 rounded border"></ul></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeCustomerEditModal()">ביטול</button>
                <button type="submit" id="customer-save-btn" class="btn-primary">שמור שינויים</button>
            </div>
        </form>
    </dialog>

     <!-- Ping Options Modal -->
    <dialog id="ping-modal">
        <div class="details-modal-handle" style="background-color: #9ca3af;"></div> <!-- Slightly darker handle -->
        <h3 class="text-lg font-semibold p-4 pb-2 text-center">בחר הודעת התראה</h3>
        <div id="ping-options-list">
            <!-- Options added dynamically -->
        </div>
        <div class="ping-option font-medium" onclick="selectPingOption('custom')">
            <i data-feather="edit-3" class="inline-block w-4 h-4 ml-2"></i>הודעה מותאמת אישית...
        </div>
         <div id="ping-modal-footer">
             <button type="button" class="text-sm text-gray-600 hover:text-gray-800" onclick="closePingOptionsModal()">ביטול</button>
         </div>
    </dialog>


    <div id="toast-container"></div>

    <script type="module">
        // --- Import from Shared Module ---
        import {
            db, auth, authReadyPromise, functions, SmartLog, showToast, // Use shared showToast
            collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
            serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
            Timestamp
        } from '/ap/shared/firebase-init.js'; // *** FIXED PATH AGAIN *** Use absolute path including /ap/

        // --- State, Config, Icons ---
        // ... (Remain the same as previous version v33.0) ...
        const ISRAEL_CENTER = [32.0853, 34.7818];
        const WAREHOUSE_LOCATIONS = { "החרש": [32.13266165049073, 34.898196599998755], "התלמיד": [32.16303427408473, 34.894926705310006] };
        const ALLOWED_STATUSES = ["חדש", "שויך", "בדרך", "הושלם", "בוטל"];
        let state = { orders: [], drivers: [], liveLocations: {}, customers: [] };
        let map; let driverMarkers = {}; let orderMarkers = {};
        let currentDetailsItem = null; // Store { id, type } of item in details modal
        let customerSearchTimeout = null; // For debouncing customer search

        const driverIconActive = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] });
        const driverIconStuck = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] });
        const orderIconNew = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] });

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            try { feather.replace(); } catch(e) {}
            initializeApplication();
            const orderDateInput = document.getElementById('order-date');
            if(orderDateInput) orderDateInput.value = new Date().toISOString().split('T')[0];
        });

        async function initializeApplication() {
            SmartLog.info("v33.1-FB (Mobile Refined): Initializing...", "Init");
            showLoader('map-loader', true);
            showLoader('orders-list', true);
            showLoader('drivers-list', true);
            try {
                initMap();
                await authReadyPromise;
                SmartLog.info(`Auth successful.`, "Init.Auth");
                // Start listeners
                listenToDrivers(); listenToOrders(); listenToLocations(); listenToCustomers();
                // Attach event listeners after elements exist
                document.getElementById('history-filter-btn')?.addEventListener('click', renderHistoryTable);
                // Placeholder for driver history button
                // document.getElementById('driver-history-filter-btn')?.addEventListener('click', fetchAndDrawDriverRoute);
                 showView('dashboard'); // Ensure correct initial view and nav state
            } catch (error) {
                SmartLog.error(error, "Init.Critical"); showToast(`שגיאת אתחול: ${error.message}`, 'error');
            } finally {
                 showLoader('map-loader', false); showLoader('orders-list', false); showLoader('drivers-list', false);
            }
        }

        // --- initMap, Firestore Listeners (remain the same) ---
        function initMap() { /* ... */ }
        function listenToDrivers() { /* ... */ }
        function listenToOrders() { /* ... */ }
        function listenToLocations() { /* ... */ }
        function listenToCustomers() { /* ... */ }

        // --- RENDER FUNCTIONS (Refined styling, otherwise same logic) ---
        function renderDrivers() {
            const list = document.getElementById('drivers-list'); if (!list) return;
            const hasData = state.drivers.length > 0;
            showLoader('drivers-list', !hasData); // Show loader only if list is truly empty
            if (!hasData) { list.innerHTML = `<div class="p-4 text-center text-gray-500 text-sm">אין נהגים פעילים כעת.</div>`; return; }
            const fragment = document.createDocumentFragment();
            state.drivers.forEach(driver => {
                const location = state.liveLocations[driver.id];
                const assigned = state.orders.filter(o => o.driver?.id === driver.id && !['הושלם', 'בוטל'].includes(o.status)).length;
                fragment.appendChild(createDriverCard(driver, location, assigned));
            });
            list.innerHTML = ''; list.appendChild(fragment); filterLists();
        }
        function createDriverCard(driver, location, assignedCount) { /* ...minor style tweaks if needed... */ }
        function renderOrders() {
            const list = document.getElementById('orders-list'); if (!list) return;
            const unassignedOrders = state.orders.filter(o => o.status === 'חדש');
            const hasData = unassignedOrders.length > 0;
            showLoader('orders-list', !hasData);
            if (!hasData) { list.innerHTML = `<div class="p-4 text-center text-gray-500 text-sm">אין הזמנות חדשות לשיבוץ.</div>`; return; }
            const fragment = document.createDocumentFragment();
            unassignedOrders.sort((a,b)=>(a.createdAt?.toMillis()||0)-(b.createdAt?.toMillis()||0))
                           .forEach(order => fragment.appendChild(createOrderCard(order)));
            list.innerHTML = ''; list.appendChild(fragment); filterLists();
        }
        function createOrderCard(order) { /* ...minor style tweaks if needed... */ }
        function renderMapMarkers() { /* ...logic remains the same... */ }
        function renderHistoryTable() { /* ...logic remains the same, ensure feather.replace called... */ }
        function renderCustomerTable() { /* ...logic remains the same... */ }

        // --- UI INTERACTIONS ---
        function showView(viewName) {
            document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
            const viewEl = document.getElementById(`view-${viewName}`);
            if (viewEl) viewEl.classList.add('active'); // Use class for transition
            document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
            const btnEl = document.querySelector(`.nav-button[onclick*="'${viewName}'"]`);
            if (btnEl) btnEl.classList.add('active');
            if (viewName === 'history') showHistoryTab('orders');
            if (viewName === 'dashboard' && map) setTimeout(() => map.invalidateSize(), 50); // Delay invalidate
            SmartLog.info(`View switched: ${viewName}`, "UI.Nav");
        }
        window.showView = showView; // Make global

        function showHistoryTab(tabName) { /* ...logic remains same... */ }
        window.showHistoryTab = showHistoryTab;

        function showPanelTab(tabName) { // Dashboard tabs
            document.querySelectorAll('#dashboard-lists .panel-list').forEach(p => p.classList.remove('active'));
            const listEl = document.getElementById(tabName + '-list');
            if (listEl) listEl.classList.add('active');
            document.querySelectorAll('.dash-tab-button').forEach(b => b.classList.remove('active'));
            const btnEl = document.getElementById('tab-' + tabName);
            if (btnEl) btnEl.classList.add('active');
            filterLists();
        }
        window.showPanelTab = showPanelTab;

        function filterLists() { /* ...logic remains same... */ }
        window.filterLists = filterLists;

        // --- DETAILS MODAL ---
        function openDetailsModal(id, type) { /* ...logic mostly same, ensure feather.replace called... */ }
        function closeDetailsModal() { /* ...logic remains same... */ }
        window.closeDetailsModal = closeDetailsModal;
        function copyCustomerLinkFromDetails() { /* ...logic remains same... */ }
        window.copyCustomerLinkFromDetails = copyCustomerLinkFromDetails;

        // --- Assign Driver Prompt (simplified for mobile) ---
        function openAssignDriverPrompt(orderId) { /* ...logic remains same... */ }
        window.openAssignDriverPrompt = openAssignDriverPrompt; // For map popup button
        async function assignOrderToDriver(orderId, driverId) { /* ...logic remains same... */ }

        // --- Geocoding (remains the same) ---
        async function geocodeAddress(address) { /* ... */ }

        // --- STATUS UPDATE (remains the same) ---
        function promptForStatusChange(orderId, currentStatus) { /* ... */ }
        window.promptForStatusChange = promptForStatusChange; // For details modal & history table
        async function updateOrderStatus(orderId, newStatus) { /* ... */ }

        // --- NEW ORDER FORM (Improved Search) ---
        function populateCustomerDatalist() { /* ...logic remains same, populates hidden datalist... */ }
        function openNewOrderForm() { /* ...logic remains same... */ }
        window.openNewOrderForm = openNewOrderForm;
        function closeNewOrderForm() {
             document.getElementById('new-order-modal')?.close();
             const form = document.getElementById('new-order-modal')?.querySelector('form');
             if (form) form.reset();
             const dateInput = document.getElementById('order-date');
             if(dateInput) dateInput.value = new Date().toISOString().split('T')[0];
             clearCustomerSelection(); // Also clear selection state
             document.getElementById('customer-suggestions').innerHTML = ''; // Clear suggestions
             document.getElementById('customer-suggestions').classList.add('hidden');
        }
        window.closeNewOrderForm = closeNewOrderForm;

        // Improved Customer Search with Debounce and Dynamic List
        function handleCustomerSearch(value) {
            clearTimeout(customerSearchTimeout);
            const suggestionsEl = document.getElementById('customer-suggestions');
            const newFields = document.getElementById('new-customer-fields');
            const existDisp = document.getElementById('existing-customer-display');
            if (!suggestionsEl || !newFields || !existDisp) return;

            const searchTerm = value.trim().toLowerCase();
            suggestionsEl.innerHTML = ''; // Clear previous suggestions

            if (searchTerm.length < 1) {
                suggestionsEl.classList.add('hidden');
                newFields.style.display = 'none';
                existDisp.style.display = 'none'; // Hide existing display too
                document.getElementById('customer-id-existing').value = ''; // Clear ID
                return;
            }

            customerSearchTimeout = setTimeout(() => {
                const matches = state.customers.filter(cust =>
                    (cust.name && cust.name.toLowerCase().includes(searchTerm)) ||
                    (cust.customerNumber && cust.customerNumber.includes(searchTerm)) ||
                    (cust.phone && cust.phone.includes(searchTerm))
                ).slice(0, 5); // Limit suggestions

                if (matches.length > 0) {
                    matches.forEach(cust => {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        item.innerHTML = `${cust.name} ${cust.customerNumber ? `(${cust.customerNumber})` : ''} <small>${cust.phone || ''}</small>`;
                        item.onclick = () => selectExistingCustomer(cust.id);
                        suggestionsEl.appendChild(item);
                    });
                    suggestionsEl.classList.remove('hidden');
                    newFields.style.display = 'none'; // Hide new fields when suggestions exist
                    existDisp.style.display = 'none'; // Hide existing display until selection
                } else {
                    suggestionsEl.classList.add('hidden');
                    existDisp.style.display = 'none';
                    newFields.style.display = 'block'; // Show new fields if no matches
                    // Pre-fill name, clear others
                    document.getElementById('customer-name-new').value = value; // Use original value
                    ['customer-phone-new', 'customer-street-new', 'customer-streetnum-new', 'customer-city-new', 'customer-contact-new', 'customer-number-new'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
                }
            }, 300); // Debounce time
        }
        window.handleCustomerSearch = handleCustomerSearch;

        function selectExistingCustomer(customerId) {
            const customer = state.customers.find(c => c.id === customerId);
            const suggestionsEl = document.getElementById('customer-suggestions');
            const searchInput = document.getElementById('customer-search');
            const existDisp = document.getElementById('existing-customer-display');
            const newFields = document.getElementById('new-customer-fields');
            if (!customer || !suggestionsEl || !searchInput || !existDisp || !newFields) return;

            // Display selected customer info
            searchInput.value = customer.customerNumber ? `${customer.name} (${customer.customerNumber})` : customer.name; // Update input field
            existDisp.style.display = 'block';
            newFields.style.display = 'none';
            document.getElementById('customer-id-existing').value = customer.id;
            document.getElementById('customer-name-display').innerText = customer.name;
            document.getElementById('customer-number-display').innerText = customer.customerNumber ? `(${customer.customerNumber})` : '';
            document.getElementById('customer-address-display').innerText = customer.defaultAddress || 'N/A';
            document.getElementById('customer-phone-display').innerText = customer.phone || 'N/A';

            suggestionsEl.innerHTML = ''; // Clear suggestions
            suggestionsEl.classList.add('hidden');
        }

        function clearCustomerSelection() {
            document.getElementById('customer-search').value = '';
            document.getElementById('existing-customer-display').style.display = 'none';
            document.getElementById('new-customer-fields').style.display = 'none';
            document.getElementById('customer-id-existing').value = '';
            document.getElementById('customer-suggestions').innerHTML = '';
            document.getElementById('customer-suggestions').classList.add('hidden');
        }
        window.clearCustomerSelection = clearCustomerSelection; // Make global for button

        async function submitNewOrder(event) { /* ...logic remains the same... */ }
        // submitNewOrder doesn't need to be global

        // --- CUSTOMER EDIT MODAL (remain the same) ---
        function openCustomerEditModal(customerId) { /* ...logic remains same... */ }
         window.openCustomerEditModal = openCustomerEditModal; // Global for table click
         function closeCustomerEditModal() { /* ...logic remains same... */ }
         window.closeCustomerEditModal = closeCustomerEditModal; // Global
         async function handleSaveCustomer(event) { /* ...logic remains same... */ }
         // handleSaveCustomer doesn't need to be global

        // --- DRIVER HISTORY (placeholder remains the same) ---
        function populateDriverSelector() { /* ... */ }
        async function fetchAndDrawDriverRoute() { /* ... */ }
        function drawRouteOnHistoryMap(latLngPoints) { /* ... */ }
        function calculateRouteDistance(points) { /* ... */ }

        // --- HELPERS ---
        function showLoader(elementId, show) { /* ...logic remains same... */ }
        // showToast is now imported from shared module
        function copyToClipboard(text) { /* ...logic remains same... */ }
        function copyCustomerLink(orderId) { /* ...logic remains same... */ }
        window.copyCustomerLink = copyCustomerLink;

        // --- Global Ping (Enhanced with Options) ---
        const PING_OPTIONS = [ "סידור העבודה למחר מוכן", "עדכון חשוב - נא לבדוק הודעות", "צפויים עיכובים היום", "בדיקת מערכת התראות" ];

        function openPingOptionsModal() {
            const modal = document.getElementById('ping-modal');
            const listEl = document.getElementById('ping-options-list');
            if (!modal || !listEl) return;
            listEl.innerHTML = ''; // Clear previous options
            PING_OPTIONS.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'ping-option';
                btn.textContent = option;
                btn.onclick = () => selectPingOption(option);
                listEl.appendChild(btn);
            });
            try{ feather.replace({ width: '16px', height: '16px'}); } catch(e){} // Redraw icons
            modal.showModal();
        }
        window.openPingOptionsModal = openPingOptionsModal; // For nav button click

        function closePingOptionsModal() { document.getElementById('ping-modal')?.close(); }
        window.closePingOptionsModal = closePingOptionsModal; // For cancel button

        function selectPingOption(option) {
            closePingOptionsModal();
            if (option === 'custom') {
                const message = prompt("הזן הודעה מותאמת אישית:");
                if (message && message.trim() !== '') {
                    sendGlobalPing(message.trim());
                } else {
                    showToast('שליחת התראה בוטלה', 'info');
                }
            } else {
                sendGlobalPing(option); // Send predefined message
            }
        }
        window.selectPingOption = selectPingOption; // For button clicks

        async function sendGlobalPing(message) { // Accepts message directly now
             if (!message) return; // Should not happen with new flow, but good check
             SmartLog.info("Sending global ping...", "CRUD.Ping", { message });
             try {
                 await addDoc(collection(db, "globalPings"), { type: "MANAGER_BROADCAST", message: message, sender: "Admin", createdAt: serverTimestamp() });
                 showToast('התראה גלובלית נשלחה', 'success'); SmartLog.info("Global ping sent", "CRUD.Ping");
             } catch (error) { SmartLog.error(error, "CRUD.Ping", { message }); showToast('שגיאה בשליחת התראה', 'error'); }
        }
        // No need to expose sendGlobalPing globally anymore

         // --- WhatsApp Placeholder ---
        function handleWhatsAppAction() { /* ...logic remains same... */ }
        window.handleWhatsAppAction = handleWhatsAppAction; // Global for button

    </script>
     <script>
        // Service Worker Registration (Remains the same)
        if ('serviceWorker' in navigator) {
             window.addEventListener('load', () => {
                 navigator.serviceWorker.register('./sw.js') // Ensure correct path
                     .then(reg => console.log('Admin SW registered:', reg.scope))
                     .catch(err => {
                          console.error('Admin SW registration failed:', err);
                          // Show a toast message if registration fails due to 404 or other issues
                          // Ensure showToast is available globally or handle error differently
                          if (typeof showToast === 'function') {
                              showToast('שגיאה ברישום Service Worker', 'error');
                          } else {
                              console.error('showToast function not available for SW error');
                          }
                     });
             });
         }
    </script>
</body>
</html>

