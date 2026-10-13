/**
 * ====================================================================
 * NOTES APP - SERVICE WORKER (PWA & BACKGROUND WAKE-UP ALARM ENGINE)
 * ====================================================================
 */

const CACHE_NAME = 'notes-pwa-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Active background alarms stored in SW state
let scheduledAlarms = [];

// 1. Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Non-critical cache error:', err);
      });
    })
  );
});

// 2. Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Network First with Cache Fallback for maximum freshness
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 4. Background Message Listener from App (Sync Alarm Queue)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_ALARMS') {
    scheduledAlarms = event.data.alarms || [];
    console.log('[Service Worker] Synced', scheduledAlarms.length, 'alarms in background worker');
  } else if (event.data && event.data.type === 'TRIGGER_NOW') {
    triggerAlarmNotification(event.data.note);
  }
});

// 5. Background Alarm Checker Loop
setInterval(() => {
  checkScheduledAlarms();
}, 2000);

function checkScheduledAlarms() {
  if (!scheduledAlarms || scheduledAlarms.length === 0) return;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;
  const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  scheduledAlarms.forEach((alarm) => {
    if (alarm.hasAlarm && !alarm.completed && alarm.date === todayIso && alarm.time === currentHHmm) {
      if (!alarm.swTriggered) {
        alarm.swTriggered = true;
        triggerAlarmNotification(alarm);
      }
    }
  });
}

function triggerAlarmNotification(note) {
  const title = `⏰ BÁO THỨC: ${note.time || ''} - NOTES`;
  const options = {
    body: `${note.content || 'Đến giờ làm việc / cuộc hẹn của bạn!'}\n(Chạm để mở ứng dụng)`,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: `notes_alarm_${note.id}`,
    renotify: true,
    requireInteraction: true, // GIỮ THÔNG BÁO SÁNG TRÊN MÀN HÌNH KHÓA CHO ĐẾN KHI NGƯỜI DÙNG TƯƠNG TÁC
    silent: false,
    sound: 'default',
    vibrate: [500, 200, 500, 200, 500, 200, 800, 400, 800],
    data: {
      noteId: note.id,
      note: note,
      url: './index.html?trigger_alarm=' + encodeURIComponent(note.id)
    },
    actions: [
      { action: 'dismiss', title: '🔕 Tắt Báo Thức' },
      { action: 'snooze', title: '⏱️ Báo lại 5p' }
    ]
  };

  self.registration.showNotification(title, options);

  // Notify all open client tabs to play loud audio loop and wake screen
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'ALARM_TRIGGERED_BACKGROUND',
        note: note
      });
    });
  });
}

// 6. Push Event Handler (Web Push from Server / Firebase Cloud Messaging)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Báo Thức NOTES', body: event.data.text() };
    }
  }

  const title = data.title || '⏰ BÁO THỨC ĐẾN GIỜ - NOTES';
  const options = {
    body: data.body || 'Bạn có một lịch hẹn cần xử lý ngay bây giờ!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.tag || 'notes_push_alarm',
    requireInteraction: true,
    renotify: true,
    silent: false,
    sound: 'default',
    vibrate: [600, 200, 600, 200, 600, 200, 1000],
    data: {
      noteId: data.noteId,
      note: data,
      url: './index.html?trigger_alarm=' + encodeURIComponent(data.noteId || '')
    },
    actions: [
      { action: 'dismiss', title: '🔕 Tắt' },
      { action: 'open', title: '📱 Mở ứng dụng' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 7. Notification Click & Action Click Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const noteData = event.notification.data?.note;

  if (action === 'dismiss') {
    // Dismiss alarm
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: 'DISMISS_ALARM' });
      });
    });
    return;
  }

  if (action === 'snooze') {
    // Snooze alarm by 5 minutes
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: 'SNOOZE_ALARM', noteId: event.notification.data?.noteId });
      });
    });
    return;
  }

  // Open / Focus the Window
  const urlToOpen = new URL(event.notification.data?.url || './index.html', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          if (noteData) {
            client.postMessage({ type: 'ALARM_TRIGGERED_BACKGROUND', note: noteData });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
