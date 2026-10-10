/**
 * ====================================================================
 * NOTES PWA - WEB PUSH & APPLE APNS ALARM SERVER
 * ====================================================================
 * Đẩy thông báo báo thức trực tiếp đến iPhone (qua Apple APNs)
 * và Android/PC (qua Google FCM) ngay cả khi ứng dụng bị tắt hoàn toàn.
 */

const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. Phục vụ toàn bộ giao diện PWA tĩnh
const publicPath = path.join(__dirname, '..');
app.use(express.static(publicPath));

// 2. Khởi tạo / Nạp cặp khóa VAPID (Voluntary Application Server Identification)
const VAPID_FILE = path.join(__dirname, 'vapid-keys.json');
let vapidKeys = {};

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
  };
} else if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
  } catch (e) {
    console.warn('[VAPID] Lỗi đọc vapid-keys.json, đang tạo mới...');
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

console.log('========================================================');
console.log('🔑 VAPID PUBLIC KEY (Khóa công khai cho PWA):');
console.log(vapidKeys.publicKey);
console.log('========================================================');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@notes.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 3. Cơ sở dữ liệu lưu trữ đăng ký thiết bị & danh sách lịch hẹn
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const ALARMS_FILE = path.join(DATA_DIR, 'scheduled-alarms.json');

function loadJson(file, def = []) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Lỗi đọc file:', file, e);
  }
  return def;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Lỗi ghi file:', file, e);
  }
}

let subscriptions = loadJson(SUBS_FILE, []);
let scheduledAlarms = loadJson(ALARMS_FILE, []);

// 4. API Endpoints

// Lấy public key
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: vapidKeys.publicKey
  });
});

// Trạng thái server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    totalDevices: subscriptions.length,
    totalScheduledAlarms: scheduledAlarms.length,
    vapidPublicKey: vapidKeys.publicKey
  });
});

// Đăng ký nhận thông báo đẩy từ thiết bị (iPhone / Android / PC)
app.post('/api/subscribe', (req, res) => {
  const { subscription, deviceName, userAgent } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Subscription không hợp lệ' });
  }

  // Cập nhật hoặc thêm mới
  const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
  const subData = {
    ...subscription,
    deviceName: deviceName || 'Thiết bị người dùng',
    userAgent: userAgent || '',
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subData;
  } else {
    subscriptions.push(subData);
  }

  saveJson(SUBS_FILE, subscriptions);
  console.log(`[Push Server] Đã đăng ký thiết bị (${subscriptions.length} thiết bị active). Endpoint: ${subscription.endpoint.slice(0, 45)}...`);

  res.json({
    success: true,
    message: 'Đăng ký nhận thông báo đẩy Apple APNs / Web Push thành công!',
    totalDevices: subscriptions.length
  });
});

// Hủy đăng ký thiết bị
app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
    saveJson(SUBS_FILE, subscriptions);
  }
  res.json({ success: true, message: 'Đã hủy đăng ký thiết bị' });
});

// Đồng bộ danh sách lịch hẹn từ PWA lên Server
app.post('/api/sync-alarms', (req, res) => {
  const { alarms } = req.body;
  if (!Array.isArray(alarms)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu lịch hẹn không hợp lệ' });
  }

  // Cập nhật danh sách lịch hẹn
  scheduledAlarms = alarms.map(a => ({
    id: a.id,
    date: a.date,
    time: a.time,
    content: a.content || 'Lịch hẹn cần xử lý',
    category: a.category || 'work',
    hasAlarm: !!a.hasAlarm,
    ringtone: a.ringtone || 'digital_alarm',
    vibrate: a.vibrate !== false,
    triggeredAt: a.triggeredAt || null
  }));

  saveJson(ALARMS_FILE, scheduledAlarms);
  console.log(`[Push Server] Đã đồng bộ ${scheduledAlarms.length} lịch hẹn vào hàng đợi máy chủ`);

  res.json({
    success: true,
    message: `Đã đồng bộ ${scheduledAlarms.length} lịch hẹn lên Server Web Push!`,
    totalAlarms: scheduledAlarms.length
  });
});

// Gửi thông báo thử nghiệm ngay lập tức để kiểm tra khóa màn hình
app.post('/api/test-push', async (req, res) => {
  const { subscription, title, body } = req.body;
  const targets = subscription ? [subscription] : subscriptions;

  if (targets.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Chưa có thiết bị nào đăng ký nhận thông báo đẩy trên server!'
    });
  }

  const payload = JSON.stringify({
    title: title || '⏰ THỬ NGHIỆM BÁO THỨC - NOTES',
    body: body || 'Kiểm tra thành công! Thông báo đẩy Apple APNs đã hoạt động kể cả khi khóa màn hình.',
    noteId: 'test_' + Date.now(),
    timestamp: Date.now()
  });

  let successCount = 0;
  let failCount = 0;

  for (const sub of targets) {
    try {
      await webpush.sendNotification(sub, payload);
      successCount++;
    } catch (err) {
      console.error('[Test Push Error]:', err.statusCode || err.message);
      failCount++;
      // Nếu endpoint không còn tồn tại (410 hoặc 404), tự động dọn dẹp
      if (err.statusCode === 410 || err.statusCode === 404) {
        subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
      }
    }
  }

  saveJson(SUBS_FILE, subscriptions);

  res.json({
    success: true,
    message: `Đã gửi thông báo đẩy đến ${successCount} thiết bị (${failCount} lỗi)`,
    successCount,
    failCount
  });
});

// 5. Tiến trình tự động kiểm tra giờ hẹn và đẩy thông báo (Background Dispatcher Loop)
function getVietnamTimeNow() {
  const d = new Date();
  // Lấy giờ Việt Nam (UTC+7)
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnDate = new Date(utc + (3600000 * 7));

  const y = vnDate.getFullYear();
  const m = String(vnDate.getMonth() + 1).padStart(2, '0');
  const day = String(vnDate.getDate()).padStart(2, '0');
  const hh = String(vnDate.getHours()).padStart(2, '0');
  const mm = String(vnDate.getMinutes()).padStart(2, '0');

  return {
    dateStr: `${y}-${m}-${day}`,
    timeStr: `${hh}:${mm}`,
    fullStamp: `${y}-${m}-${day} ${hh}:${mm}`
  };
}

let lastDispatchedMinute = '';

async function checkAndDispatchAlarms() {
  if (subscriptions.length === 0 || scheduledAlarms.length === 0) return;

  const { dateStr, timeStr, fullStamp } = getVietnamTimeNow();
  if (lastDispatchedMinute === fullStamp) return; // Đã quét trong phút này

  const dueAlarms = scheduledAlarms.filter(a => {
    return a.hasAlarm && a.date === dateStr && a.time === timeStr && !a.pushSent;
  });

  if (dueAlarms.length === 0) return;

  lastDispatchedMinute = fullStamp;
  console.log(`[Push Dispatcher] Phát hiện ${dueAlarms.length} lịch hẹn đến giờ (${fullStamp})!`);

  for (const alarm of dueAlarms) {
    alarm.pushSent = true;
    alarm.triggeredAt = new Date().toISOString();

    const payload = JSON.stringify({
      title: `⏰ BÁO THỨC: ${alarm.time} - NOTES`,
      body: alarm.content ? alarm.content : 'Bạn có một lịch hẹn cần xử lý ngay bây giờ!',
      noteId: alarm.id,
      category: alarm.category,
      ringtone: alarm.ringtone,
      timestamp: Date.now()
    });

    console.log(`[Push Dispatcher] Đang gửi thông báo báo thức cho lịch ${alarm.id} (${alarm.time})...`);

    // Gửi đến tất cả các thiết bị đã đăng ký
    const activeSubs = [...subscriptions];
    for (const sub of activeSubs) {
      try {
        await webpush.sendNotification(sub, payload);
        console.log(`[Push Dispatcher] ✔ Đã gửi thành công tới thiết bị: ${sub.deviceName || sub.endpoint.slice(0, 30)}`);
      } catch (err) {
        console.error(`[Push Dispatcher] ❌ Lỗi gửi tới ${sub.endpoint.slice(0, 30)}:`, err.statusCode || err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
      }
    }
  }

  saveJson(SUBS_FILE, subscriptions);
  saveJson(ALARMS_FILE, scheduledAlarms);
}

// Chạy vòng lặp quét mỗi 15 giây để không bỏ lỡ giây phút nào
setInterval(checkAndDispatchAlarms, 15000);

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 NOTES Web Push Server đang chạy trên cổng ${PORT}`);
  console.log(`👉 Truy cập máy chủ tại: http://localhost:${PORT}`);
});
