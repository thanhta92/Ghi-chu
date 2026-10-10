/**
 * ====================================================================
 * NOTES APPLICATION - JAVASCRIPT ENGINE
 * Lịch Làm Việc, Ghi Chú, Âm Lịch Việt Nam & Báo Thức Đa Thiết Bị
 * ====================================================================
 */

/* ====================================================================
   1. VIETNAMESE LUNAR CALENDAR ALGORITHM (Thuật toán Hồ Ngọc Đức)
   ==================================================================== */
const LunarCalendar = (() => {
  // Astronomical constants & base calculation for UTC+7 (Vietnam Timezone)
  function jdFromDate(dd, mm, yy) {
    let a = Math.floor((14 - mm) / 12);
    let y = yy + 4800 - a;
    let m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) {
      jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }
    return jd;
  }

  function jdToDate(jd) {
    let a, b, c, d, e, m, day, month, year;
    if (jd > 2299160) {
      let alpha = Math.floor((jd - 1867216.25) / 36524.25);
      a = jd + 1 + alpha - Math.floor(alpha / 4);
    } else {
      a = jd;
    }
    b = a + 1524;
    c = Math.floor((b - 122.1) / 365.25);
    d = Math.floor(365.25 * c);
    e = Math.floor((b - d) / 30.6001);
    day = Math.floor(b - d - Math.floor(30.6001 * e));
    month = e < 14 ? Math.floor(e - 1) : Math.floor(e - 13);
    year = month > 2 ? Math.floor(c - 4716) : Math.floor(c - 4715);
    return [day, month, year];
  }

  function getNewMoonDay(k, timeZone = 7) {
    let T = k / 1236.85;
    let T2 = T * T;
    let T3 = T2 * T;
    let dr = Math.PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
    C1 = C1 - 0.0004 * Math.sin(3 * dr * Mpr);
    C1 = C1 + 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
    C1 = C1 - 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
    C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
    C1 = C1 + 0.0010 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
    let deltat;
    if (T < -11) {
      deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.00000061 * T * T3;
    } else {
      deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    let JdNew = Jd1 + C1 - deltat;
    return Math.floor(JdNew + 0.5 + timeZone / 24);
  }

  function getSunLongitude(dayNumber, timeZone = 7) {
    let T = (dayNumber - 2451545.5 - timeZone / 24) / 36525;
    let T2 = T * T;
    let dr = Math.PI / 180;
    let M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = L0 + DL;
    L = L * dr;
    L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
    return Math.floor((L / Math.PI) * 6);
  }

  function getLunarMonth11(yy, timeZone = 7) {
    let off = jdFromDate(31, 12, yy) - 2415021;
    let k = Math.floor(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    let sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
      nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
  }

  function getLeapMonthOffset(a11, timeZone = 7) {
    let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
    let dayNumber = jdFromDate(dd, mm, yy);
    let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = getNewMoonDay(k, timeZone);
    }
    let a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    let lunarDay = dayNumber - monthStart + 1;
    let diff = Math.floor((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      let leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = 1;
        }
      }
    }
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }
    return {
      day: lunarDay,
      month: lunarMonth,
      year: lunarYear,
      isLeap: lunarLeap === 1
    };
  }

  return {
    convert: convertSolar2Lunar,
    format: (lunarObj) => {
      if (lunarObj.day === 1) {
        return `1/${lunarObj.month}${lunarObj.isLeap ? 'N' : ''}`;
      }
      return `${lunarObj.day}/${lunarObj.month}`;
    }
  };
})();


/* ====================================================================
   2. OFFLINE CUSTOM AUDIO STORAGE (IndexedDB)
   ==================================================================== */
const CustomAudioStorage = (() => {
  const DB_NAME = 'NotesCustomAudioDB_v1';
  const DB_VERSION = 1;
  const STORE_NAME = 'custom_sounds';
  let dbPromise = null;

  function getDB() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => {
          console.error('Lỗi khởi tạo IndexedDB:', e.target.error);
          reject(e.target.error);
        };
      });
    }
    return dbPromise;
  }

  async function getAll() {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Lỗi đọc danh sách âm thanh:', e);
      return [];
    }
  }

  async function get(id) {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Lỗi đọc âm thanh theo ID:', e);
      return null;
    }
  }

  async function add(file) {
    if (!file) throw new Error('Chưa chọn file âm thanh!');

    // Giới hạn 15MB để tránh tràn bộ nhớ thiết bị di động
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Dung lượng file vượt quá giới hạn 15MB. Vui lòng chọn file nhẹ hơn!');
    }

    // Làm sạch tên file hiển thị
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
    const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const soundItem = {
      id,
      name: cleanName || 'Âm thanh cá nhân',
      fileName: file.name,
      size: file.size,
      mimeType: file.type || 'audio/mpeg',
      data: file, // Lưu trực tiếp File/Blob vào IndexedDB offline
      createdAt: Date.now()
    };

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(soundItem);
      req.onsuccess = () => resolve(soundItem);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteSound(id) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  return {
    getAll,
    get,
    add,
    deleteSound
  };
})();

// Gắn toàn cục
window.CustomAudioStorage = CustomAudioStorage;


/* ====================================================================
   3. AUDIO ENGINE (Synthesizer + Custom Offline Player)
   ==================================================================== */
const AudioEngine = (() => {
  let audioCtx = null;
  let activeLoopTimer = null;
  let isPlaying = false;
  let isPreviewing = false;
  let customAudioEl = null;
  let currentCustomUrl = null;

  function initContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.3, startTime = 0, gainLevel = 0.3) {
    initContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, audioCtx.currentTime + startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration + 0.05);
  }

  function playRingtonePattern(soundId) {
    initContext();
    switch (soundId) {
      case 'gentle_chime': // 🔔 Gentle harp chimes
        playTone(523.25, 'sine', 0.4, 0.0, 0.35); // C5
        playTone(659.25, 'sine', 0.4, 0.2, 0.35); // E5
        playTone(783.99, 'sine', 0.5, 0.4, 0.35); // G5
        playTone(1046.50, 'sine', 0.8, 0.6, 0.4); // C6
        break;

      case 'marimba_happy': // 🎵 Happy upbeat melody
        playTone(440.00, 'triangle', 0.2, 0.0, 0.4); // A4
        playTone(554.37, 'triangle', 0.2, 0.15, 0.4); // C#5
        playTone(659.25, 'triangle', 0.2, 0.30, 0.4); // E5
        playTone(880.00, 'triangle', 0.4, 0.45, 0.45); // A5
        playTone(740.00, 'triangle', 0.3, 0.70, 0.4); // F#5
        playTone(880.00, 'triangle', 0.5, 0.90, 0.45); // A5
        break;

      case 'urgent_siren': // 🚨 High urgency dual beep
        playTone(880, 'square', 0.15, 0.0, 0.25);
        playTone(1174, 'square', 0.15, 0.15, 0.25);
        playTone(880, 'square', 0.15, 0.3, 0.25);
        playTone(1174, 'square', 0.25, 0.45, 0.3);
        break;

      case 'zen_harp': // 🪕 Peaceful relaxation chime
        playTone(392.00, 'sine', 0.6, 0.0, 0.3); // G4
        playTone(493.88, 'sine', 0.6, 0.2, 0.3); // B4
        playTone(587.33, 'sine', 0.7, 0.4, 0.35); // D5
        playTone(783.99, 'sine', 1.0, 0.6, 0.4); // G5
        break;

      case 'crystal_drop': // 💧 Pure drop sound
        playTone(1200, 'sine', 0.15, 0.0, 0.4);
        playTone(1600, 'sine', 0.25, 0.1, 0.4);
        playTone(2400, 'sine', 0.4, 0.25, 0.35);
        break;

      case 'digital_alarm': // ⏰ Standard digital 3-beep alarm
      default:
        playTone(950, 'square', 0.1, 0.0, 0.2);
        playTone(950, 'square', 0.1, 0.15, 0.2);
        playTone(950, 'square', 0.1, 0.30, 0.2);
        playTone(1250, 'square', 0.25, 0.45, 0.25);
        break;
    }
  }

  function getOrCreateAudioEl() {
    if (!customAudioEl) {
      customAudioEl = document.createElement('audio');
      customAudioEl.id = 'customAlarmAudioPlayer';
      customAudioEl.preload = 'auto';
      const container = document.getElementById('alarmAudioContainer') || document.body;
      container.appendChild(customAudioEl);
    }
    return customAudioEl;
  }

  function cleanupCustomAudio() {
    if (customAudioEl) {
      customAudioEl.pause();
      customAudioEl.currentTime = 0;
    }
    if (currentCustomUrl) {
      URL.revokeObjectURL(currentCustomUrl);
      currentCustomUrl = null;
    }
  }

  async function startAlarmLoop(soundId = 'digital_alarm') {
    stopAlarm();
    isPlaying = true;

    // Kiểm tra nếu là chuông cá nhân lưu trong IndexedDB
    if (soundId && soundId.startsWith('custom_')) {
      const sound = await CustomAudioStorage.get(soundId);
      if (sound && sound.data) {
        cleanupCustomAudio();
        currentCustomUrl = URL.createObjectURL(sound.data);
        const player = getOrCreateAudioEl();
        player.src = currentCustomUrl;
        player.loop = true;
        player.volume = 1.0;
        try {
          await player.play();
          return;
        } catch (err) {
          console.warn('Không thể tự phát audio HTML5, chuyển sang chuông dự phòng:', err);
        }
      }
    }

    // Chuông mặc định tổng hợp từ Web Audio API
    playRingtonePattern(soundId);
    activeLoopTimer = setInterval(() => {
      if (isPlaying) {
        playRingtonePattern(soundId);
      }
    }, 1800);
  }

  function stopAlarm() {
    isPlaying = false;
    isPreviewing = false;
    if (activeLoopTimer) {
      clearInterval(activeLoopTimer);
      activeLoopTimer = null;
    }
    cleanupCustomAudio();
  }

  async function previewSound(soundId, onEndCallback) {
    stopAlarm();
    isPreviewing = true;

    // Nếu là chuông cá nhân
    if (soundId && soundId.startsWith('custom_')) {
      const sound = await CustomAudioStorage.get(soundId);
      if (sound && sound.data) {
        cleanupCustomAudio();
        currentCustomUrl = URL.createObjectURL(sound.data);
        const player = getOrCreateAudioEl();
        player.src = currentCustomUrl;
        player.loop = false;
        player.volume = 1.0;
        player.onended = () => {
          isPreviewing = false;
          if (onEndCallback) onEndCallback();
        };
        try {
          await player.play();
          return;
        } catch (err) {
          console.warn('Lỗi nghe thử custom sound:', err);
        }
      }
    }

    // Chuông hệ thống
    playRingtonePattern(soundId);
    setTimeout(() => {
      isPreviewing = false;
      if (onEndCallback) onEndCallback();
    }, 1600);
  }

  return {
    playTone,
    previewSound,
    startAlarmLoop,
    stopAlarm,
    isPlaying: () => isPlaying || isPreviewing,
    init: initContext
  };
})();


/* ====================================================================
   3. STORAGE & MULTI-USER STATE MANAGEMENT
   ==================================================================== */
const DB_USERS_KEY = 'NOTES_APP_USERS_V2';
const DB_NOTES_PREFIX = 'NOTES_APP_DATA_';
const DB_ACTIVE_USER_KEY = 'NOTES_CURRENT_USER';
const DB_FIREBASE_CONFIG_KEY = 'NOTES_FIREBASE_CONFIG';

// Pre-seeded Admin Account as strictly specified: user: bsta, pass: thanhta92
const INITIAL_USERS = [
  {
    username: 'bsta',
    password: 'thanhta92',
    fullName: 'BS Tá',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

class StateManager {
  constructor() {
    this.currentUser = null;
    this.notes = [];
    this.initUsersDatabase();
    this.loadSession();
  }

  initUsersDatabase() {
    let users = this.getUsers();
    if (!users || users.length === 0) {
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(INITIAL_USERS));
    } else {
      // Đảm bảo tài khoản admin luôn tồn tại và cập nhật tên chuẩn 'BS Tá'
      const adminUser = users.find(u => u.username === 'bsta');
      if (!adminUser) {
        users.push(INITIAL_USERS[0]);
      } else {
        adminUser.fullName = 'BS Tá';
      }
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

      // Cập nhật session hiện tại nếu đang đăng nhập admin bsta
      try {
        const savedUser = JSON.parse(localStorage.getItem(DB_ACTIVE_USER_KEY));
        if (savedUser && savedUser.username === 'bsta') {
          savedUser.fullName = 'BS Tá';
          localStorage.setItem(DB_ACTIVE_USER_KEY, JSON.stringify(savedUser));
        }
      } catch (e) {}
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    this.broadcastSync('users_updated');
  }

  registerUser(fullName, username, password) {
    const users = this.getUsers();
    const cleanUsername = username.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: 'Tên đăng nhập này đã có người sử dụng!' };
    }

    const newUser = {
      username: cleanUsername,
      password: password,
      fullName: fullName.trim(),
      role: 'user',
      status: 'pending', // Requires admin approval!
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    return { 
      success: true, 
      message: 'Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt.' 
    };
  }

  login(username, password) {
    const users = this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername && u.password === password);

    if (!user) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác!' };
    }

    if (user.role !== 'admin' && user.status === 'pending') {
      return { 
        success: false, 
        message: 'Tài khoản chưa được duyệt! Vui lòng liên hệ Admin để được kích hoạt.' 
      };
    }

    if (user.status === 'blocked') {
      return { 
        success: false, 
        message: 'Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.' 
      };
    }

    this.currentUser = user;
    localStorage.setItem(DB_ACTIVE_USER_KEY, JSON.stringify(user));
    this.loadUserNotes();
    return { success: true, user };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(DB_ACTIVE_USER_KEY);
    this.notes = [];
  }

  loadSession() {
    try {
      const savedUser = JSON.parse(localStorage.getItem(DB_ACTIVE_USER_KEY));
      if (savedUser) {
        // Refresh with current database state
        const users = this.getUsers();
        const freshUser = users.find(u => u.username === savedUser.username);
        if (freshUser && (freshUser.status === 'active' || freshUser.role === 'admin')) {
          this.currentUser = freshUser;
          this.loadUserNotes();
        } else {
          this.logout();
        }
      }
    } catch {
      this.currentUser = null;
    }
  }

  loadUserNotes() {
    if (!this.currentUser) {
      this.notes = [];
      return;
    }
    const key = DB_NOTES_PREFIX + this.currentUser.username;
    try {
      this.notes = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      this.notes = [];
    }
  }

  saveNotes() {
    if (!this.currentUser) return;
    const key = DB_NOTES_PREFIX + this.currentUser.username;
    localStorage.setItem(key, JSON.stringify(this.notes));
    this.broadcastSync('notes_updated');
  }

  addOrUpdateNote(noteData) {
    if (!this.currentUser) return null;

    if (noteData.id) {
      // Update existing
      const index = this.notes.findIndex(n => n.id === noteData.id);
      if (index !== -1) {
        this.notes[index] = {
          ...this.notes[index],
          ...noteData,
          updatedAt: new Date().toISOString()
        };
        this.saveNotes();
        return this.notes[index];
      }
    }

    // Create new
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: noteData.date, // 'YYYY-MM-DD'
      time: noteData.time || '', // 'HH:mm' or ''
      content: noteData.content,
      category: noteData.category || 'work',
      hasAlarm: !!noteData.hasAlarm,
      vibrate: !!noteData.vibrate,
      ringtone: noteData.ringtone || 'digital_alarm',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: this.currentUser.username
    };

    this.notes.unshift(newNote);
    this.saveNotes();
    return newNote;
  }

  deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveNotes();
  }

  // Admin User Control Actions
  approveUser(username) {
    if (this.currentUser?.role !== 'admin') return false;
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    if (user) {
      user.status = 'active';
      this.saveUsers(users);
      return true;
    }
    return false;
  }

  toggleBlockUser(username) {
    if (this.currentUser?.role !== 'admin') return false;
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    if (user && user.role !== 'admin') {
      user.status = user.status === 'blocked' ? 'active' : 'blocked';
      this.saveUsers(users);
      return true;
    }
    return false;
  }

  deleteUser(username) {
    if (this.currentUser?.role !== 'admin') return false;
    let users = this.getUsers();
    users = users.filter(u => u.username !== username || u.role === 'admin');
    this.saveUsers(users);
    // Delete user notes
    localStorage.removeItem(DB_NOTES_PREFIX + username);
    return true;
  }

  broadcastSync(message) {
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('notes_sync_channel');
        channel.postMessage({ type: message, timestamp: Date.now() });
      }
    } catch (e) {
      console.warn('Sync broadcast:', e);
    }
  }
}


/* ====================================================================
   4. APPLICATION CONTROLLER & UI
   ==================================================================== */
class NotesApp {
  constructor() {
    this.state = new StateManager();
    this.viewYear = new Date().getFullYear();
    this.viewMonth = new Date().getMonth(); // 0-indexed (0 = Jan)
    this.selectedDate = this.formatDateIso(new Date());

    // Lunar display toggle state (Mặc định là ko tích chọn)
    this.showLunar = false;

    // PWA & Wake Lock State
    this.wakeLock = null;
    this.deferredPwaPrompt = null;
    this.swRegistration = null;

    // Filter states for right panel (Chỉ lọc 1 trong 2 luồng tại 1 thời điểm)
    this.activeFilterMode = 'time'; // 'time' hoặc 'month'
    this.timeFilter = 'all'; // 'all', 'week1', 'week2', 'week3', 'week4'
    this.selectedMonths = []; // mảng các tháng [0..11] khi chọn lọc tháng
    this.searchQuery = '';

    // Alarm active tracking
    this.activeRingingNote = null;
    this.lastTriggeredMinute = '';

    this.cacheElements();
    this.initPwaEngine();
    this.initEventListeners();
    this.initLiveClock();
    this.initAlarmWatcher();
    this.checkUrlParamsOnStartup();
    this.loadCustomRingtones();
    this.initWebPush();
    this.renderAll();
  }

  cacheElements() {
    // Top bar & Header
    this.liveClock = document.getElementById('liveClock');
    this.clockTime = document.getElementById('clockTime');
    this.clockDate = document.getElementById('clockDate');
    this.syncStatus = document.getElementById('syncStatus');
    this.btnEnableNotification = document.getElementById('btnEnableNotification');
    this.btnAdminPanel = document.getElementById('btnAdminPanel');
    this.pendingUsersBadge = document.getElementById('pendingUsersBadge');
    this.btnInstallPwa = document.getElementById('btnInstallPwa');
    this.btnWakeLock = document.getElementById('btnWakeLock');
    this.userMenuWrapper = document.getElementById('userMenuWrapper');
    this.btnUserMenuToggle = document.getElementById('btnUserMenuToggle');
    this.userDropdown = document.getElementById('userDropdown');
    this.userAvatar = document.getElementById('userAvatar');
    this.displayUsername = document.getElementById('displayUsername');
    this.dropdownFullName = document.getElementById('dropdownFullName');
    this.dropdownRole = document.getElementById('dropdownRole');
    this.btnThemeToggle = document.getElementById('btnThemeToggle');
    this.btnLogout = document.getElementById('btnLogout');
    this.btnFirebaseConfig = document.getElementById('btnFirebaseConfig');
    this.btnOpenLoginModal = document.getElementById('btnOpenLoginModal');

    // Modals: PWA Install Modal
    this.pwaInstallModal = document.getElementById('pwaInstallModal');
    this.btnClosePwaModal = document.getElementById('btnClosePwaModal');
    this.btnConfirmPwaInstall = document.getElementById('btnConfirmPwaInstall');

    // Navigation & Tabs
    this.mobileTabs = document.getElementById('mobileTabs');
    this.calendarView = document.getElementById('calendarView');
    this.listView = document.getElementById('listView');
    this.mobileNotesCount = document.getElementById('mobileNotesCount');
    this.fabAddNote = document.getElementById('fabAddNote');

    // Calendar
    this.btnPrevMonth = document.getElementById('btnPrevMonth');
    this.btnNextMonth = document.getElementById('btnNextMonth');
    this.currentMonthYear = document.getElementById('currentMonthYear');
    this.toggleLunarDisplay = document.getElementById('toggleLunarDisplay');
    this.calendarGrid = document.getElementById('calendarGrid');

    // Notes list & Filters
    this.notesTotalCount = document.getElementById('notesTotalCount');
    this.timeFilterPills = document.getElementById('timeFilterPills');
    this.monthFilterPills = document.getElementById('monthFilterPills');
    this.selectedYearDisplay = document.getElementById('selectedYearDisplay');
    this.btnClearMonthFilter = document.getElementById('btnClearMonthFilter');
    this.searchInput = document.getElementById('searchInput');
    this.btnClearSearch = document.getElementById('btnClearSearch');
    this.notesListContainer = document.getElementById('notesListContainer');

    // Modals: Note Form
    this.noteModal = document.getElementById('noteModal');
    this.noteForm = document.getElementById('noteForm');
    this.noteModalTitle = document.getElementById('noteModalTitle');
    this.btnCloseNoteModal = document.getElementById('btnCloseNoteModal');
    this.btnCancelNote = document.getElementById('btnCancelNote');
    this.btnDeleteNote = document.getElementById('btnDeleteNote');
    this.noteId = document.getElementById('noteId');
    this.noteDate = document.getElementById('noteDate');
    this.noteDateLunarPreview = document.getElementById('noteDateLunarPreview');
    this.noteTimeHour = document.getElementById('noteTimeHour');
    this.noteTimeMinute = document.getElementById('noteTimeMinute');
    this.noteTime = document.getElementById('noteTime');
    this.btnClearTime = document.getElementById('btnClearTime');
    this.noteContent = document.getElementById('noteContent');
    this.noteCategory = document.getElementById('noteCategory');
    this.alarmToggle = document.getElementById('alarmToggle');
    this.alarmSubOptions = document.getElementById('alarmSubOptions');
    this.alarmVibrate = document.getElementById('alarmVibrate');
    this.alarmRingtone = document.getElementById('alarmRingtone');
    this.btnPreviewSound = document.getElementById('btnPreviewSound');
    this.btnUploadCustomSound = document.getElementById('btnUploadCustomSound');
    this.inputCustomRingtone = document.getElementById('inputCustomRingtone');
    this.btnManageCustomSounds = document.getElementById('btnManageCustomSounds');
    this.btnHeaderCustomSounds = document.getElementById('btnHeaderCustomSounds');
    this.customRingtoneOptGroup = document.getElementById('customRingtoneOptGroup');

    // Modals: Custom Sound Manager
    this.customSounds = [];
    this.customSoundModal = document.getElementById('customSoundModal');
    this.btnCloseSoundModal = document.getElementById('btnCloseSoundModal');
    this.btnCloseSoundModal2 = document.getElementById('btnCloseSoundModal2');
    this.soundUploadDropzone = document.getElementById('soundUploadDropzone');
    this.btnTriggerSoundPicker = document.getElementById('btnTriggerSoundPicker');
    this.inputModalCustomSound = document.getElementById('inputModalCustomSound');
    this.customSoundsListContainer = document.getElementById('customSoundsListContainer');
    this.soundEmptyState = document.getElementById('soundEmptyState');
    this.customSoundCount = document.getElementById('customSoundCount');

    // Modals: Note Detail View
    this.detailModal = document.getElementById('detailModal');
    this.btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    this.btnDetailClose = document.getElementById('btnDetailClose');
    this.btnDetailEdit = document.getElementById('btnDetailEdit');
    this.btnDetailDelete = document.getElementById('btnDetailDelete');
    this.detailHeaderDate = document.getElementById('detailHeaderDate');
    this.detailCategoryBadge = document.getElementById('detailCategoryBadge');
    this.detailSolarDate = document.getElementById('detailSolarDate');
    this.detailLunarDate = document.getElementById('detailLunarDate');
    this.detailTimeRow = document.getElementById('detailTimeRow');
    this.detailTime = document.getElementById('detailTime');
    this.detailAlarmBox = document.getElementById('detailAlarmBox');
    this.detailContentText = document.getElementById('detailContentText');
    this.detailMetaText = document.getElementById('detailMetaText');

    // Modals: Auth
    this.authModal = document.getElementById('authModal');
    this.tabLoginBtn = document.getElementById('tabLoginBtn');
    this.tabRegisterBtn = document.getElementById('tabRegisterBtn');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.loginUsername = document.getElementById('loginUsername');
    this.loginPassword = document.getElementById('loginPassword');
    this.regFullName = document.getElementById('regFullName');
    this.regUsername = document.getElementById('regUsername');
    this.regPassword = document.getElementById('regPassword');
    this.regConfirmPassword = document.getElementById('regConfirmPassword');
    this.authAlert = document.getElementById('authAlert');
    this.btnCloseAuthModal = document.getElementById('btnCloseAuthModal');

    // Modals: Admin
    this.adminModal = document.getElementById('adminModal');
    this.btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
    this.btnCloseAdminModal2 = document.getElementById('btnCloseAdminModal2');
    this.adminTotalUsers = document.getElementById('adminTotalUsers');
    this.adminPendingUsers = document.getElementById('adminPendingUsers');
    this.adminActiveUsers = document.getElementById('adminActiveUsers');
    this.adminUsersTableBody = document.getElementById('adminUsersTableBody');

    // Modals: Web Push APNs Config
    this.webPushModal = document.getElementById('webPushModal');
    this.btnWebPushConfig = document.getElementById('btnWebPushConfig');
    this.btnCloseWebPushModal = document.getElementById('btnCloseWebPushModal');
    this.btnCloseWebPushModal2 = document.getElementById('btnCloseWebPushModal2');
    this.btnTogglePushSub = document.getElementById('btnTogglePushSub');
    this.btnTestPushNow = document.getElementById('btnTestPushNow');
    this.btnSyncAlarmsNow = document.getElementById('btnSyncAlarmsNow');
    this.pushServerUrlInput = document.getElementById('pushServerUrl');
    this.btnSavePushServer = document.getElementById('btnSavePushServer');
    this.pushStatusCard = document.getElementById('pushStatusCard');
    this.pushStatusTitle = document.getElementById('pushStatusTitle');
    this.pushStatusDesc = document.getElementById('pushStatusDesc');

    // Alarm Ringing Overlay
    this.alarmRingingOverlay = document.getElementById('alarmRingingOverlay');
    this.ringTimeDisplay = document.getElementById('ringTimeDisplay');
    this.ringDateDisplay = document.getElementById('ringDateDisplay');
    this.ringNoteContent = document.getElementById('ringNoteContent');
    this.btnAlarmSnooze = document.getElementById('btnAlarmSnooze');
    this.btnAlarmDismiss = document.getElementById('btnAlarmDismiss');

    this.toastContainer = document.getElementById('toastContainer');
  }

  initEventListeners() {
    // User Menu
    this.btnUserMenuToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      this.userDropdown?.classList.remove('show');
    });

    this.btnLogout?.addEventListener('click', () => {
      this.state.logout();
      this.showToast('Đã đăng xuất tài khoản', 'info');
      this.renderAll();
      this.openAuthModal();
    });

    this.btnOpenLoginModal?.addEventListener('click', () => {
      this.openAuthModal();
    });

    // Theme Toggle
    this.btnThemeToggle?.addEventListener('click', () => {
      document.body.classList.toggle('theme-light');
      const isLight = document.body.classList.contains('theme-light');
      localStorage.setItem('NOTES_THEME', isLight ? 'light' : 'dark');
    });
    if (localStorage.getItem('NOTES_THEME') === 'light') {
      document.body.classList.add('theme-light');
    }

    // Notifications Request
    this.btnEnableNotification?.addEventListener('click', () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showToast('Đã bật thông báo thiết bị thành công!', 'success');
            this.btnEnableNotification.style.display = 'none';
          }
        });
      }
    });
    if ('Notification' in window && Notification.permission !== 'granted') {
      this.btnEnableNotification.style.display = 'inline-flex';
    }

    // Admin Panel Open
    this.btnAdminPanel?.addEventListener('click', () => {
      this.openAdminModal();
    });
    this.btnCloseAdminModal?.addEventListener('click', () => this.adminModal.classList.remove('show'));
    this.btnCloseAdminModal2?.addEventListener('click', () => this.adminModal.classList.remove('show'));

    // Web Push APNs Config Modal
    this.btnWebPushConfig?.addEventListener('click', () => {
      this.openWebPushModal();
    });
    this.btnCloseWebPushModal?.addEventListener('click', () => this.webPushModal?.classList.remove('show'));
    this.btnCloseWebPushModal2?.addEventListener('click', () => this.webPushModal?.classList.remove('show'));
    this.btnTogglePushSub?.addEventListener('click', () => {
      this.toggleWebPushSubscription();
    });
    this.btnTestPushNow?.addEventListener('click', () => {
      this.sendTestPush();
    });
    this.btnSyncAlarmsNow?.addEventListener('click', () => {
      this.syncAlarmsToPushServer(true);
    });
    this.btnSavePushServer?.addEventListener('click', () => {
      const url = this.pushServerUrlInput.value.trim().replace(/\/+$/, '');
      localStorage.setItem('notes_push_server_url', url);
      this.pushServerUrl = url;
      this.showToast('Đã lưu địa chỉ máy chủ Push!', 'success');
      this.checkPushStatus();
    });

    // Mobile Tabs Navigation
    this.mobileTabs?.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mobileTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabTarget = btn.dataset.tab;
        if (tabTarget === 'calendarView') {
          this.calendarView.classList.add('active-tab');
          this.listView.classList.remove('active-tab');
        } else {
          this.listView.classList.add('active-tab');
          this.calendarView.classList.remove('active-tab');
        }
      });
    });

    // Calendar Navigation
    this.btnPrevMonth?.addEventListener('click', () => {
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
      this.renderCalendar();
      this.renderMonthFilterPills();
    });

    this.btnNextMonth?.addEventListener('click', () => {
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
      this.renderCalendar();
      this.renderMonthFilterPills();
    });

    // Checkbox bật / tắt hiển thị Âm lịch
    this.toggleLunarDisplay?.addEventListener('change', (e) => {
      this.showLunar = e.target.checked;
      this.renderCalendar();
      this.renderNotesList();
    });

    this.fabAddNote?.addEventListener('click', () => this.openNoteModal());

    // Note Modal Controls
    this.btnCloseNoteModal?.addEventListener('click', () => this.noteModal.classList.remove('show'));
    this.btnCancelNote?.addEventListener('click', () => this.noteModal.classList.remove('show'));

    // Smart 24-Hour Time Inputs (hh:MM)
    const updateCombinedTime = () => {
      const h = this.noteTimeHour?.value.trim() || '';
      const m = this.noteTimeMinute?.value.trim() || '';
      if (h === '' && m === '') {
        this.noteTime.value = '';
      } else {
        const formattedH = h.padStart(2, '0');
        const formattedM = (m === '' ? '00' : m).padStart(2, '0');
        this.noteTime.value = `${formattedH}:${formattedM}`;
      }
    };

    this.noteTimeHour?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 2) val = val.slice(0, 2);
      if (val !== '' && parseInt(val, 10) > 23) val = '23';
      e.target.value = val;
      updateCombinedTime();
      // Auto jump to minute if 2 digits or number is 3..9
      if (val.length === 2 || (val.length === 1 && parseInt(val, 10) > 2)) {
        this.noteTimeMinute?.focus();
        this.noteTimeMinute?.select();
      }
    });

    this.noteTimeHour?.addEventListener('blur', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val !== '') {
        let num = Math.min(23, Math.max(0, parseInt(val, 10)));
        e.target.value = String(num).padStart(2, '0');
        updateCombinedTime();
      }
    });

    this.noteTimeMinute?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 2) val = val.slice(0, 2);
      if (val !== '' && parseInt(val, 10) > 59) val = '59';
      e.target.value = val;
      updateCombinedTime();
    });

    this.noteTimeMinute?.addEventListener('blur', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val !== '') {
        let num = Math.min(59, Math.max(0, parseInt(val, 10)));
        e.target.value = String(num).padStart(2, '0');
        updateCombinedTime();
      }
    });

    this.noteTimeMinute?.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && this.noteTimeMinute.value === '') {
        this.noteTimeHour?.focus();
      }
    });

    this.btnClearTime?.addEventListener('click', () => {
      if (this.noteTimeHour) this.noteTimeHour.value = '';
      if (this.noteTimeMinute) this.noteTimeMinute.value = '';
      this.noteTime.value = '';
    });

    this.alarmToggle?.addEventListener('change', () => {
      const isChecked = this.alarmToggle.checked;
      this.alarmSubOptions.style.display = isChecked ? 'block' : 'none';
      const statusLbl = document.getElementById('alarmStatusLabel');
      const container = document.getElementById('alarmToggleContainer');
      if (statusLbl) {
        statusLbl.textContent = isChecked ? 'Có' : 'Không';
        statusLbl.classList.toggle('active', isChecked);
      }
      if (container) {
        container.classList.toggle('active', isChecked);
      }
      if (!isChecked) {
        AudioEngine.stopAlarm();
      }
    });

    document.getElementById('alarmToggleContainer')?.addEventListener('click', (e) => {
      if (e.target !== this.alarmToggle && !e.target.closest('.switch-toggle')) {
        this.alarmToggle.checked = !this.alarmToggle.checked;
        this.alarmToggle.dispatchEvent(new Event('change'));
      }
    });

    this.btnPreviewSound?.addEventListener('click', () => {
      if (AudioEngine.isPlaying()) {
        AudioEngine.stopAlarm();
        this.btnPreviewSound.classList.remove('playing');
        this.btnPreviewSound.innerHTML = '<i class="fa-solid fa-play"></i>';
      } else {
        this.btnPreviewSound.classList.add('playing');
        this.btnPreviewSound.innerHTML = '<i class="fa-solid fa-stop"></i>';
        AudioEngine.previewSound(this.alarmRingtone.value, () => {
          this.btnPreviewSound.classList.remove('playing');
          this.btnPreviewSound.innerHTML = '<i class="fa-solid fa-play"></i>';
        });
      }
    });

    // Custom Sounds Pickers & Modal
    this.btnUploadCustomSound?.addEventListener('click', () => {
      this.inputCustomRingtone?.click();
    });

    this.inputCustomRingtone?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleCustomSoundUpload(e.target.files[0]);
      }
    });

    this.btnManageCustomSounds?.addEventListener('click', () => {
      this.openCustomSoundModal();
    });

    this.btnHeaderCustomSounds?.addEventListener('click', () => {
      this.openCustomSoundModal();
    });

    this.btnCloseSoundModal?.addEventListener('click', () => {
      AudioEngine.stopAlarm();
      this.customSoundModal.classList.remove('show');
    });

    this.btnCloseSoundModal2?.addEventListener('click', () => {
      AudioEngine.stopAlarm();
      this.customSoundModal.classList.remove('show');
    });

    this.customSoundModal?.addEventListener('click', (e) => {
      if (e.target === this.customSoundModal) {
        AudioEngine.stopAlarm();
        this.customSoundModal.classList.remove('show');
      }
    });

    this.btnTriggerSoundPicker?.addEventListener('click', () => {
      this.inputModalCustomSound?.click();
    });

    this.soundUploadDropzone?.addEventListener('click', (e) => {
      if (e.target !== this.btnTriggerSoundPicker && !e.target.closest('#btnTriggerSoundPicker')) {
        this.inputModalCustomSound?.click();
      }
    });

    this.inputModalCustomSound?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleCustomSoundUpload(e.target.files[0]);
      }
    });

    // Drag and drop audio file into modal
    ['dragenter', 'dragover'].forEach(eventName => {
      this.soundUploadDropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.soundUploadDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.soundUploadDropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.soundUploadDropzone.classList.remove('dragover');
      });
    });

    this.soundUploadDropzone?.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        this.handleCustomSoundUpload(dt.files[0]);
      }
    });

    this.noteForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveNote();
    });

    this.btnDeleteNote?.addEventListener('click', () => {
      if (this.noteId.value && confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
        this.state.deleteNote(this.noteId.value);
        this.noteModal.classList.remove('show');
        this.showToast('Đã xóa lịch hẹn', 'info');
        this.renderAll();
      }
    });

    // Detail Modal Controls
    this.btnCloseDetailModal?.addEventListener('click', () => this.detailModal.classList.remove('show'));
    this.btnDetailClose?.addEventListener('click', () => this.detailModal.classList.remove('show'));

    this.btnDetailEdit?.addEventListener('click', () => {
      const id = this.detailModal.dataset.noteId;
      this.detailModal.classList.remove('show');
      if (id) this.openNoteModal(id);
    });

    this.btnDetailDelete?.addEventListener('click', () => {
      const id = this.detailModal.dataset.noteId;
      if (id && confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
        this.state.deleteNote(id);
        this.detailModal.classList.remove('show');
        this.showToast('Đã xóa lịch hẹn', 'info');
        this.renderAll();
      }
    });

    // 1. Luồng Lọc theo thời gian (Tất cả, 1 tuần tới, 2 tuần tới...)
    this.timeFilterPills?.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        // Chuyển sang chế độ lọc thời gian
        this.activeFilterMode = 'time';
        this.timeFilter = btn.dataset.filter;
        
        // Hủy bỏ chọn tháng (làm mới luồng tháng)
        this.selectedMonths = [];
        this.renderMonthFilterPills();

        // Đánh dấu nút thời gian được chọn
        this.timeFilterPills.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.renderNotesList();
      });
    });

    // Nút "Chọn tất cả" trong bộ lọc tháng
    this.btnClearMonthFilter?.addEventListener('click', () => {
      this.selectedMonths = [];
      this.activeFilterMode = 'time';
      this.timeFilter = 'all';

      // Kích hoạt lại nút "Tất cả" của luồng thời gian
      this.timeFilterPills?.querySelectorAll('.pill').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === 'all');
      });

      this.renderMonthFilterPills();
      this.renderNotesList();
    });

    // Search
    this.searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.btnClearSearch.style.display = this.searchQuery ? 'block' : 'none';
      this.renderNotesList();
    });

    this.btnClearSearch?.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchQuery = '';
      this.btnClearSearch.style.display = 'none';
      this.renderNotesList();
    });

    // Auth Modal Handlers
    this.btnCloseAuthModal?.addEventListener('click', () => {
      this.authModal.classList.remove('show');
    });

    this.authModal?.addEventListener('click', (e) => {
      if (e.target === this.authModal) {
        this.authModal.classList.remove('show');
      }
    });

    document.getElementById('quickAdminFill')?.addEventListener('click', () => {
      if (this.loginUsername) this.loginUsername.value = 'bsta';
      if (this.loginPassword) this.loginPassword.value = 'thanhta92';
      this.showToast('Đã điền tài khoản Admin!', 'info');
    });

    this.tabLoginBtn?.addEventListener('click', () => {
      this.tabLoginBtn.classList.add('active');
      this.tabRegisterBtn.classList.remove('active');
      this.loginForm.style.display = 'block';
      this.registerForm.style.display = 'none';
      this.authAlert.style.display = 'none';
    });

    this.tabRegisterBtn?.addEventListener('click', () => {
      this.tabRegisterBtn.classList.add('active');
      this.tabLoginBtn.classList.remove('active');
      this.registerForm.style.display = 'block';
      this.loginForm.style.display = 'none';
      this.authAlert.style.display = 'none';
    });

    // Password visibility toggle
    document.querySelectorAll('.btn-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) {
          const isPass = input.type === 'password';
          input.type = isPass ? 'text' : 'password';
          btn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
        }
      });
    });

    this.loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = this.state.login(this.loginUsername.value, this.loginPassword.value);
      if (res.success) {
        this.authModal.classList.remove('show');
        this.showToast(`Chào mừng ${res.user.fullName}!`, 'success');
        this.renderAll();
      } else {
        this.showAuthAlert(res.message, 'error');
      }
    });

    this.registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.regPassword.value !== this.regConfirmPassword.value) {
        this.showAuthAlert('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }
      if (this.regPassword.value.length < 6) {
        this.showAuthAlert('Mật khẩu phải từ 6 ký tự trở lên!', 'error');
        return;
      }

      const res = this.state.registerUser(this.regFullName.value, this.regUsername.value, this.regPassword.value);
      if (res.success) {
        this.showAuthAlert(res.message, 'success');
        this.registerForm.reset();
        setTimeout(() => {
          this.tabLoginBtn.click();
        }, 2500);
      } else {
        this.showAuthAlert(res.message, 'error');
      }
    });

    // Alarm dismiss and snooze
    this.btnAlarmDismiss?.addEventListener('click', () => {
      AudioEngine.stopAlarm();
      this.alarmRingingOverlay.style.display = 'none';
      this.activeRingingNote = null;
    });

    this.btnAlarmSnooze?.addEventListener('click', () => {
      AudioEngine.stopAlarm();
      this.alarmRingingOverlay.style.display = 'none';
      this.showToast('Đã hẹn báo lại sau 5 phút', 'info');
      // Snooze for 5 minutes
      if (this.activeRingingNote) {
        const note = this.activeRingingNote;
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        note.time = snoozeTime;
        this.state.addOrUpdateNote(note);
        this.renderAll();
      }
      this.activeRingingNote = null;
    });

    // Listen for multi-tab sync
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('notes_sync_channel');
      channel.onmessage = () => {
        this.state.loadSession();
        this.renderAll();
      };
    }

    // PWA Install Button & Modal Triggers
    this.btnInstallPwa?.addEventListener('click', () => {
      if (this.deferredPwaPrompt) {
        this.deferredPwaPrompt.prompt();
        this.deferredPwaPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            this.showToast('Cảm ơn bạn đã cài đặt ứng dụng NOTES!', 'success');
            this.btnInstallPwa.style.display = 'none';
          }
          this.deferredPwaPrompt = null;
        });
      } else {
        this.pwaInstallModal?.classList.add('show');
      }
    });

    this.btnClosePwaModal?.addEventListener('click', () => {
      this.pwaInstallModal?.classList.remove('show');
    });

    this.btnConfirmPwaInstall?.addEventListener('click', () => {
      this.pwaInstallModal?.classList.remove('show');
      if ('Notification' in window) {
        Notification.requestPermission();
      }
      this.requestWakeLock();
    });

    // Wake Lock Button Toggle
    this.btnWakeLock?.addEventListener('click', () => {
      this.toggleWakeLock();
    });
  }

  /* ====================================================================
     PWA SERVICE WORKER & WAKE LOCK ENGINE
     ==================================================================== */
  initPwaEngine() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then((reg) => {
          this.swRegistration = reg;
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
          this.syncAlarmsToServiceWorker();
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Listen for messages from background Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'ALARM_TRIGGERED_BACKGROUND') {
          this.triggerAlarm(event.data.note);
        } else if (event.data?.type === 'DISMISS_ALARM') {
          AudioEngine.stopAlarm();
          this.alarmRingingOverlay.style.display = 'none';
          this.activeRingingNote = null;
        } else if (event.data?.type === 'SNOOZE_ALARM') {
          this.btnAlarmSnooze?.click();
        }
      });
    }

    // 2. Capture PWA beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPwaPrompt = e;
      if (this.btnInstallPwa) {
        this.btnInstallPwa.style.display = 'inline-flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] NOTES app installed to Home Screen');
      if (this.btnInstallPwa) this.btnInstallPwa.style.display = 'none';
      this.showToast('NOTES đã được cài đặt thành công!', 'success');
    });
  }

  async toggleWakeLock() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
      this.btnWakeLock.classList.remove('active');
      this.showToast('Đã tắt chế độ giữ màn hình', 'info');
    } else {
      await this.requestWakeLock();
    }
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.btnWakeLock?.classList.add('active');
        this.showToast('Đã kích hoạt chế độ Đánh Thức Màn Hình', 'success');

        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
          this.btnWakeLock?.classList.remove('active');
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }

  syncAlarmsToServiceWorker() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const activeAlarms = this.state.notes.filter(n => n.hasAlarm && !n.completed);
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_ALARMS',
        alarms: activeAlarms
      });
    }
  }

  checkUrlParamsOnStartup() {
    const params = new URLSearchParams(window.location.search);
    const triggerId = params.get('trigger_alarm') || params.get('alarm');
    if (triggerId) {
      setTimeout(() => {
        const note = this.state.notes.find(n => n.id === triggerId);
        if (note) {
          this.triggerAlarm(note);
        }
      }, 500);
    }
  }

  initLiveClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      this.clockTime.textContent = `${hours}:${mins}:${secs}`;

      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      this.clockDate.textContent = `${dayName}, ${day}/${month}/${year}`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ====================================================================
     ALARM BACKGROUND MONITOR & WAKE UP ENGINE
     ==================================================================== */
  initAlarmWatcher() {
    setInterval(() => {
      this.checkAlarmTriggers();
    }, 2000);
  }

  checkAlarmTriggers() {
    if (!this.state.currentUser || !this.state.notes.length) return;

    const now = new Date();
    const todayIso = this.formatDateIso(now);
    const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const minuteStamp = `${todayIso}_${currentHHmm}`;

    if (this.lastTriggeredMinute === minuteStamp) {
      return; // Already triggered in this minute
    }

    // Find notes with alarms for today and matching time
    const matchingNote = this.state.notes.find(n => {
      return n.hasAlarm && !n.completed && n.date === todayIso && n.time === currentHHmm;
    });

    if (matchingNote) {
      this.lastTriggeredMinute = minuteStamp;
      this.triggerAlarm(matchingNote);
    }
  }

  triggerAlarm(note) {
    this.activeRingingNote = note;

    // 1. Wake screen if possible via Wake Lock
    this.requestWakeLock();

    // 2. Play Loud Audio Loop
    AudioEngine.startAlarmLoop(note.ringtone || 'digital_alarm');

    // 3. Vibrate Device vigorously
    if (note.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([600, 200, 600, 200, 600, 200, 1000, 300, 1000]);
    }

    // 4. High Priority Persistent Notification via Service Worker (requireInteraction)
    const [y, m, d] = note.date.split('-').map(Number);
    const lunar = LunarCalendar.convert(d, m, y);
    const notifTitle = `⏰ BÁO THỨC: ${note.time || ''} - NOTES`;
    const notifBody = `${note.content}\n(Âm lịch: ${LunarCalendar.format(lunar)})`;

    if ('serviceWorker' in navigator && this.swRegistration) {
      this.swRegistration.showNotification(notifTitle, {
        body: notifBody,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: `notes_alarm_${note.id}`,
        requireInteraction: true, // Ép thông báo sáng màn hình khóa đến khi bấm tắt
        renotify: true,
        vibrate: [600, 200, 600, 200, 600, 200, 1000],
        actions: [
          { action: 'dismiss', title: '🔕 Tắt Báo Thức' },
          { action: 'snooze', title: '⏱️ Báo lại 5p' }
        ],
        data: {
          noteId: note.id,
          note: note,
          url: './index.html?trigger_alarm=' + encodeURIComponent(note.id)
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notifTitle, {
        body: notifBody,
        icon: './icons/icon-192.png',
        tag: `notes_alarm_${note.id}`,
        requireInteraction: true
      });
    }

    // 5. Show Wake-Up Full Screen Overlay
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dateObj = new Date(y, m - 1, d);
    const dayName = daysOfWeek[dateObj.getDay()];

    this.ringTimeDisplay.textContent = note.time || 'BÁO THỨC';
    this.ringDateDisplay.textContent = `${dayName}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (Âm lịch: ${LunarCalendar.format(lunar)})`;
    this.ringNoteContent.textContent = note.content;
    this.alarmRingingOverlay.style.display = 'flex';
  }

  /* ====================================================================
     RENDER ENGINE
     ==================================================================== */
  renderAll() {
    this.renderUserSessionUI();
    this.renderCalendar();
    this.renderMonthFilterPills();
    this.renderNotesList();
    this.updateAdminBadges();
    this.syncAlarmsToServiceWorker();
    this.syncAlarmsToPushServer(false);
  }

  renderUserSessionUI() {
    const user = this.state.currentUser;
    if (user) {
      this.btnOpenLoginModal.style.display = 'none';
      this.userMenuWrapper.style.display = 'block';
      this.displayUsername.textContent = user.fullName || user.username;
      this.dropdownFullName.textContent = user.fullName || user.username;
      this.dropdownRole.textContent = user.role === 'admin' ? '🛡️ Quản trị viên (Admin)' : '👤 Thành viên';
      this.userAvatar.textContent = (user.fullName || user.username).charAt(0).toUpperCase();

      if (user.role === 'admin') {
        this.btnAdminPanel.style.display = 'inline-flex';
      } else {
        this.btnAdminPanel.style.display = 'none';
      }
    } else {
      this.btnOpenLoginModal.style.display = 'inline-flex';
      this.userMenuWrapper.style.display = 'none';
      this.btnAdminPanel.style.display = 'none';
    }
  }

  renderCalendar() {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    this.currentMonthYear.querySelector('.month-text').textContent = monthNames[this.viewMonth];
    this.currentMonthYear.querySelector('.year-text').textContent = this.viewYear;

    this.calendarGrid.innerHTML = '';

    // First day of this month
    const firstDay = new Date(this.viewYear, this.viewMonth, 1);
    const lastDay = new Date(this.viewYear, this.viewMonth + 1, 0);

    // Vietnamese calendar week starts on Monday (T2): 0 -> Mon, 6 -> Sun
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const totalDaysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(this.viewYear, this.viewMonth, 0).getDate();

    const todayStr = this.formatDateIso(new Date());

    // 1. Prev month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthLastDay - i;
      const prevDate = new Date(this.viewYear, this.viewMonth - 1, prevDay);
      const prevDateStr = this.formatDateIso(prevDate);
      const lunar = LunarCalendar.convert(prevDay, prevDate.getMonth() + 1, prevDate.getFullYear());
      this.calendarGrid.appendChild(this.createCalendarCell(prevDay, prevDateStr, lunar, true));
    }

    // 2. Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(this.viewYear, this.viewMonth, day);
      const dateStr = this.formatDateIso(date);
      const lunar = LunarCalendar.convert(day, this.viewMonth + 1, this.viewYear);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;
      const isSunday = date.getDay() === 0;
      const isSaturday = date.getDay() === 6;

      const cell = this.createCalendarCell(day, dateStr, lunar, false, isToday, isSelected, isSaturday, isSunday);
      this.calendarGrid.appendChild(cell);
    }

    // 3. Next month leading days (to complete 35 or 42 grid cells)
    const currentCellsCount = startDayOfWeek + totalDaysInMonth;
    const remainingCells = (currentCellsCount <= 35 ? 35 : 42) - currentCellsCount;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(this.viewYear, this.viewMonth + 1, day);
      const nextDateStr = this.formatDateIso(nextDate);
      const lunar = LunarCalendar.convert(day, nextDate.getMonth() + 1, nextDate.getFullYear());
      this.calendarGrid.appendChild(this.createCalendarCell(day, nextDateStr, lunar, true));
    }
  }

  createCalendarCell(dayNumber, dateIso, lunar, isOtherMonth = false, isToday = false, isSelected = false, isSaturday = false, isSunday = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday) cell.classList.add('today');
    if (isSelected) cell.classList.add('selected');
    if (isSaturday) cell.classList.add('weekend');
    if (isSunday) cell.classList.add('sunday');

    // Header: Solar Day (Large) + Optional Lunar Day (Small corner)
    const header = document.createElement('div');
    header.className = 'cell-header';

    const solarSpan = document.createElement('span');
    solarSpan.className = 'solar-day';
    solarSpan.textContent = dayNumber;
    header.appendChild(solarSpan);

    if (this.showLunar) {
      const lunarSpan = document.createElement('span');
      lunarSpan.className = 'lunar-day';
      if (lunar.day === 1) lunarSpan.classList.add('first-day');
      lunarSpan.textContent = LunarCalendar.format(lunar);
      header.appendChild(lunarSpan);
    }

    cell.appendChild(header);

    // Events in this cell
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'cell-events';

    const dayNotes = this.state.notes.filter(n => n.date === dateIso);

    // Sort by time
    dayNotes.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    const displayNotes = dayNotes.slice(0, 3); // Max 3 previewed
    displayNotes.forEach(note => {
      const item = document.createElement('div');
      item.className = 'cell-note-item';
      if (note.hasAlarm) item.classList.add('has-alarm');
      if (note.category) item.classList.add(`category-${note.category}`);

      let innerHtml = '';
      if (note.hasAlarm) {
        // Ô nào đã hẹn lịch mà có thông báo thì hiện icon cái loa
        innerHtml += `<i class="fa-solid fa-volume-high note-speaker-icon" title="Có báo thức"></i>`;
      }
      if (note.time) {
        innerHtml += `<span class="note-time-badge">${note.time}</span>`;
      }
      innerHtml += `<span class="note-text-snippet">${note.content ? this.escapeHtml(note.content) : this.getCategoryName(note.category)}</span>`;
      item.innerHTML = innerHtml;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDetailModal(note.id);
      });

      eventsContainer.appendChild(item);
    });

    if (dayNotes.length > 3) {
      const more = document.createElement('div');
      more.className = 'cell-more-badge';
      more.textContent = `+${dayNotes.length - 3} nữa...`;
      eventsContainer.appendChild(more);
    }

    cell.appendChild(eventsContainer);

    // Clicking on cell opens add note modal for this date
    cell.addEventListener('click', () => {
      this.selectedDate = dateIso;
      this.documentSelectCell(dateIso);
      this.openNoteModal(null, dateIso);
    });

    return cell;
  }

  documentSelectCell(dateIso) {
    document.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
  }

  renderMonthFilterPills() {
    this.selectedYearDisplay.textContent = this.viewYear;
    this.monthFilterPills.innerHTML = '';
    const monthShorts = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    monthShorts.forEach((name, index) => {
      const btn = document.createElement('button');
      btn.className = 'month-pill';
      if (this.selectedMonths.includes(index)) {
        btn.classList.add('active');
      }
      btn.textContent = name;
      btn.addEventListener('click', () => {
        // Chuyển sang luồng lọc theo tháng
        this.activeFilterMode = 'month';

        if (this.selectedMonths.includes(index)) {
          this.selectedMonths = this.selectedMonths.filter(m => m !== index);
        } else {
          this.selectedMonths.push(index);
        }

        if (this.selectedMonths.length === 0) {
          // Nếu bỏ chọn hết tháng, quay về mặc định thời gian "Tất cả"
          this.activeFilterMode = 'time';
          this.timeFilter = 'all';
          this.timeFilterPills?.querySelectorAll('.pill').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === 'all');
          });
        } else {
          // Đang chọn tháng -> Tắt active của tất cả nút lọc thời gian
          this.timeFilterPills?.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        }

        this.renderMonthFilterPills();
        this.renderNotesList();
      });
      this.monthFilterPills.appendChild(btn);
    });
  }

  renderNotesList() {
    const allNotes = [...this.state.notes];
    this.mobileNotesCount.textContent = allNotes.length;

    let filtered = allNotes.filter(note => {
      const noteDate = new Date(note.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // ĐỘC QUYỀN: Chỉ lọc theo 1 trong 2 luồng
      if (this.activeFilterMode === 'time') {
        // Luồng 1: Lọc theo khoảng thời gian
        if (this.timeFilter !== 'all') {
          const diffDays = Math.round((noteDate - today) / (1000 * 60 * 60 * 24));
          if (this.timeFilter === 'week1' && (diffDays < 0 || diffDays > 7)) return false;
          if (this.timeFilter === 'week2' && (diffDays < 0 || diffDays > 14)) return false;
          if (this.timeFilter === 'week3' && (diffDays < 0 || diffDays > 21)) return false;
          if (this.timeFilter === 'week4' && (diffDays < 0 || diffDays > 28)) return false;
        }
      } else if (this.activeFilterMode === 'month') {
        // Luồng 2: Lọc theo các tháng được chọn trong năm
        if (this.selectedMonths.length > 0) {
          const noteMonth = noteDate.getMonth();
          const noteYear = noteDate.getFullYear();
          if (noteYear !== this.viewYear || !this.selectedMonths.includes(noteMonth)) {
            return false;
          }
        }
      }

      // 3. Tìm kiếm theo từ khóa (nếu có nhập)
      if (this.searchQuery) {
        const matchContent = note.content.toLowerCase().includes(this.searchQuery);
        const matchTime = note.time && note.time.toLowerCase().includes(this.searchQuery);
        const matchDate = note.date.includes(this.searchQuery);
        if (!matchContent && !matchTime && !matchDate) return false;
      }

      return true;
    });

    // Sort: Date ascending, then time ascending
    filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || '99:99').localeCompare(b.time || '99:99');
    });

    this.notesTotalCount.textContent = `${filtered.length} lịch hẹn`;
    this.notesListContainer.innerHTML = '';

    if (filtered.length === 0) {
      this.notesListContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-xmark"></i>
          <p>Không có lịch hẹn nào phù hợp với bộ lọc</p>
          <button class="btn-primary-sm" style="margin-top: 10px;" id="btnEmptyAddNew">
            <i class="fa-solid fa-plus"></i> Thêm lịch mới ngay
          </button>
        </div>
      `;
      document.getElementById('btnEmptyAddNew')?.addEventListener('click', () => this.openNoteModal());
      return;
    }

    filtered.forEach(note => {
      const card = this.createNoteCard(note);
      this.notesListContainer.appendChild(card);
    });
  }

  createNoteCard(note) {
    const card = document.createElement('div');
    const cat = note.category || 'work';
    card.className = `note-card cat-${cat}`;

    const [y, m, d] = note.date.split('-').map(Number);
    const lunar = LunarCalendar.convert(d, m, y);
    const dateObj = new Date(y, m - 1, d);
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayLabel = daysOfWeek[dateObj.getDay()];

    card.innerHTML = `
      <div class="note-card-top">
        <div class="note-date-tag">
          <span class="day-chip">${dayLabel}</span>
          <span class="note-date-text">${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}</span>
          ${this.showLunar ? `<span class="note-lunar-tag" title="Âm lịch">ÂL ${LunarCalendar.format(lunar)}</span>` : ''}
        </div>
        <div class="note-badges-wrap">
          ${note.time ? `<span class="note-time-pill"><i class="fa-regular fa-clock"></i> ${note.time}</span>` : ''}
          ${note.hasAlarm ? `<span class="note-alarm-badge-pill" title="Có báo thức"><i class="fa-solid fa-bell"></i> Báo thức</span>` : ''}
        </div>
      </div>

      <div class="note-card-content">${note.content ? this.escapeHtml(note.content) : '<span class="text-muted" style="font-style: italic;">(Không có nội dung ghi chú)</span>'}</div>

      <div class="note-card-footer">
        <span class="note-category-tag"><span class="cat-dot"></span> ${this.getCategoryName(note.category)}</span>
        <div class="card-actions">
          <button class="card-action-btn edit-btn" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="card-action-btn delete-btn" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;

    // Clicking card opens Detail
    card.addEventListener('click', () => {
      this.openDetailModal(note.id);
    });

    // Action button events
    card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openNoteModal(note.id);
    });

    card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
        this.state.deleteNote(note.id);
        this.showToast('Đã xóa lịch hẹn', 'info');
        this.renderAll();
      }
    });

    return card;
  }

  /* ====================================================================
     MODAL CONTROLLERS: ADD / EDIT / DETAIL
     ==================================================================== */
  openNoteModal(noteId = null, prefillDate = null) {
    if (!this.state.currentUser) {
      this.openAuthModal();
      return;
    }

    this.noteForm.reset();
    this.btnDeleteNote.style.display = noteId ? 'inline-flex' : 'none';
    this.noteModalTitle.textContent = noteId ? 'Chỉnh Sửa Lịch Hẹn' : 'Thêm Lịch Hẹn';

    if (noteId) {
      const note = this.state.notes.find(n => n.id === noteId);
      if (note) {
        this.noteId.value = note.id;
        this.noteDate.value = note.date;
        this.noteTime.value = note.time || '';

        if (note.time && note.time.includes(':')) {
          const [h, m] = note.time.split(':');
          if (this.noteTimeHour) this.noteTimeHour.value = h || '';
          if (this.noteTimeMinute) this.noteTimeMinute.value = m || '';
        } else {
          if (this.noteTimeHour) this.noteTimeHour.value = '';
          if (this.noteTimeMinute) this.noteTimeMinute.value = '';
        }

        this.noteContent.value = note.content;
        this.noteCategory.value = note.category || 'work';
        this.alarmToggle.checked = !!note.hasAlarm;
        this.alarmSubOptions.style.display = note.hasAlarm ? 'block' : 'none';
        this.alarmVibrate.checked = !!note.vibrate;
        this.alarmRingtone.value = note.ringtone || 'digital_alarm';
      }
    } else {
      this.noteId.value = '';
      this.noteDate.value = prefillDate || this.selectedDate || this.formatDateIso(new Date());
      this.noteTime.value = '';
      if (this.noteTimeHour) this.noteTimeHour.value = '';
      if (this.noteTimeMinute) this.noteTimeMinute.value = '';
      this.alarmToggle.checked = false;
      this.alarmSubOptions.style.display = 'none';
      this.alarmVibrate.checked = true;
      this.alarmRingtone.value = 'digital_alarm';
    }

    const statusLbl = document.getElementById('alarmStatusLabel');
    const container = document.getElementById('alarmToggleContainer');
    if (statusLbl) {
      statusLbl.textContent = this.alarmToggle.checked ? 'Có' : 'Không';
      statusLbl.classList.toggle('active', this.alarmToggle.checked);
    }
    if (container) {
      container.classList.toggle('active', this.alarmToggle.checked);
    }

    this.updateLunarPreviewInForm();
    this.noteModal.classList.add('show');
  }

  updateLunarPreviewInForm() {
    if (!this.noteDate.value) return;
    const [y, m, d] = this.noteDate.value.split('-').map(Number);
    const lunar = LunarCalendar.convert(d, m, y);
    this.noteDateLunarPreview.textContent = `ÂL: ${lunar.day}/${lunar.month}${lunar.isLeap ? 'N' : ''}`;
  }

  handleSaveNote() {
    const noteData = {
      id: this.noteId.value || undefined,
      date: this.noteDate.value,
      time: this.noteTime.value.trim(),
      content: this.noteContent.value.trim(),
      category: this.noteCategory.value,
      hasAlarm: this.alarmToggle.checked,
      vibrate: this.alarmVibrate.checked,
      ringtone: this.alarmRingtone.value
    };

    if (!noteData.date) {
      alert('Vui lòng chọn ngày cho lịch hẹn!');
      return;
    }

    this.state.addOrUpdateNote(noteData);
    this.noteModal.classList.remove('show');
    this.showToast(noteData.id ? 'Đã cập nhật lịch hẹn!' : 'Đã lưu lịch hẹn mới!', 'success');
    this.renderAll();
  }

  openDetailModal(noteId) {
    const note = this.state.notes.find(n => n.id === noteId);
    if (!note) return;

    this.detailModal.dataset.noteId = note.id;
    const [y, m, d] = note.date.split('-').map(Number);
    const lunar = LunarCalendar.convert(d, m, y);

    this.detailCategoryBadge.textContent = this.getCategoryName(note.category);
    this.detailHeaderDate.textContent = `Lịch Ngày ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    this.detailSolarDate.textContent = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    this.detailLunarDate.textContent = `${lunar.day}/${lunar.month}/${lunar.year}${lunar.isLeap ? ' (Nhuận)' : ''}`;

    if (note.time) {
      this.detailTimeRow.style.display = 'flex';
      this.detailTime.textContent = note.time;
    } else {
      this.detailTimeRow.style.display = 'none';
    }

    if (note.hasAlarm) {
      this.detailAlarmBox.className = 'detail-alarm-badge active';
      this.detailAlarmBox.innerHTML = `
        <i class="fa-solid fa-volume-high"></i>
        <span>Đã bật báo thức (${this.getRingtoneName(note.ringtone)}${note.vibrate ? ' + Rung' : ''})</span>
      `;
    } else {
      this.detailAlarmBox.className = 'detail-alarm-badge inactive';
      this.detailAlarmBox.innerHTML = `
        <i class="fa-regular fa-bell-slash"></i>
        <span>Không đặt báo thức</span>
      `;
    }

    this.detailContentText.textContent = note.content || '(Không có nội dung ghi chú)';
    const createdDate = new Date(note.createdAt);
    this.detailMetaText.textContent = `Tạo lúc: ${createdDate.toLocaleTimeString('vi-VN')} ngày ${createdDate.toLocaleDateString('vi-VN')}`;

    this.detailModal.classList.add('show');
  }

  /* ====================================================================
     ADMIN MANAGEMENT MODAL
     ==================================================================== */
  openAdminModal() {
    if (this.state.currentUser?.role !== 'admin') {
      alert('Bạn không có quyền truy cập trang quản trị!');
      return;
    }

    const users = this.state.getUsers();
    this.adminTotalUsers.textContent = users.length;
    this.adminPendingUsers.textContent = users.filter(u => u.status === 'pending').length;
    this.adminActiveUsers.textContent = users.filter(u => u.status === 'active' || u.role === 'admin').length;

    this.adminUsersTableBody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--';

      let statusBadge = '';
      if (u.role === 'admin') {
        statusBadge = '<span class="user-status-badge active"><i class="fa-solid fa-shield"></i> Admin</span>';
      } else if (u.status === 'pending') {
        statusBadge = '<span class="user-status-badge pending"><i class="fa-solid fa-clock"></i> Chờ duyệt</span>';
      } else if (u.status === 'blocked') {
        statusBadge = '<span class="user-status-badge blocked"><i class="fa-solid fa-ban"></i> Đã khóa</span>';
      } else {
        statusBadge = '<span class="user-status-badge active"><i class="fa-solid fa-check"></i> Hoạt động</span>';
      }

      let actionsHtml = '';
      if (u.role !== 'admin') {
        if (u.status === 'pending') {
          actionsHtml += `<button class="btn-table-sm btn-approve" data-user="${u.username}" title="Duyệt người dùng"><i class="fa-solid fa-check"></i> Duyệt</button>`;
        } else {
          const isBlocked = u.status === 'blocked';
          actionsHtml += `<button class="btn-table-sm btn-toggle-block" data-user="${u.username}">${isBlocked ? '<i class="fa-solid fa-lock-open"></i> Mở khóa' : '<i class="fa-solid fa-lock"></i> Khóa'}</button>`;
        }
        actionsHtml += `<button class="btn-table-sm btn-table-delete" data-user="${u.username}" title="Xóa người dùng"><i class="fa-solid fa-trash"></i></button>`;
      } else {
        actionsHtml = '<span class="text-muted" style="font-size: 0.75rem;">Hệ thống</span>';
      }

      tr.innerHTML = `
        <td><strong>${this.escapeHtml(u.fullName || u.username)}</strong></td>
        <td><code>${this.escapeHtml(u.username)}</code></td>
        <td>${dateStr}</td>
        <td>${statusBadge}</td>
        <td><div class="admin-action-btn-group">${actionsHtml}</div></td>
      `;

      // Event delegation for table buttons
      tr.querySelector('.btn-approve')?.addEventListener('click', () => {
        this.state.approveUser(u.username);
        this.showToast(`Đã duyệt tài khoản ${u.username}`, 'success');
        this.openAdminModal();
        this.updateAdminBadges();
      });

      tr.querySelector('.btn-toggle-block')?.addEventListener('click', () => {
        this.state.toggleBlockUser(u.username);
        this.showToast(`Đã cập nhật trạng thái ${u.username}`, 'info');
        this.openAdminModal();
      });

      tr.querySelector('.btn-table-delete')?.addEventListener('click', () => {
        if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${u.username} và toàn bộ dữ liệu lịch của họ?`)) {
          this.state.deleteUser(u.username);
          this.showToast(`Đã xóa tài khoản ${u.username}`, 'info');
          this.openAdminModal();
          this.updateAdminBadges();
        }
      });

      this.adminUsersTableBody.appendChild(tr);
    });

    this.adminModal.classList.add('show');
  }

  updateAdminBadges() {
    if (this.state.currentUser?.role === 'admin') {
      const users = this.state.getUsers();
      const pendingCount = users.filter(u => u.status === 'pending').length;
      if (pendingCount > 0) {
        this.pendingUsersBadge.textContent = pendingCount;
        this.pendingUsersBadge.style.display = 'inline-block';
      } else {
        this.pendingUsersBadge.style.display = 'none';
      }
    }
  }

  /* ====================================================================
     AUTH HELPERS & TOAST NOTIFICATIONS
     ==================================================================== */
  openAuthModal() {
    this.authAlert.style.display = 'none';
    this.tabLoginBtn.click();
    this.authModal.classList.add('show');
  }

  showAuthAlert(message, type = 'error') {
    this.authAlert.className = `auth-alert ${type}`;
    this.authAlert.textContent = message;
    this.authAlert.style.display = 'block';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${this.escapeHtml(message)}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ====================================================================
     UTILITIES
     ==================================================================== */
  formatDateIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  getCategoryName(cat) {
    const map = {
      work: '💼 Công việc',
      personal: '👤 Cá nhân',
      meeting: '👥 Cuộc họp',
      birthday: '🎂 Sinh nhật / Kỷ niệm',
      urgent: '🚨 Quan trọng / Khẩn cấp'
    };
    return map[cat] || '💼 Công việc';
  }

  getRingtoneName(id) {
    const map = {
      digital_alarm: '⏰ Chuông Kỹ Thuật Số',
      gentle_chime: '🔔 Chuông Ngân Dịu Dàng',
      marimba_happy: '🎵 Giai Điệu Vui Vẻ',
      urgent_siren: '🚨 Báo Động Khẩn Cấp',
      zen_harp: '🪕 Chuông Thiền',
      crystal_drop: '💧 Giọt Nước'
    };
    if (map[id]) return map[id];
    if (id && id.startsWith('custom_')) {
      const s = this.customSounds?.find(item => item.id === id);
      return s ? `📁 ${s.name}` : '📁 Chuông từ thiết bị';
    }
    return '⏰ Chuông Kỹ Thuật Số';
  }

  /* ====================================================================
     CUSTOM OFFLINE SOUNDS MANAGEMENT METHODS
     ==================================================================== */
  async loadCustomRingtones() {
    try {
      this.customSounds = await CustomAudioStorage.getAll();
    } catch (e) {
      this.customSounds = [];
    }

    if (!this.customRingtoneOptGroup) return;

    this.customRingtoneOptGroup.innerHTML = '';
    if (this.customSounds.length > 0) {
      this.customRingtoneOptGroup.style.display = '';
      this.customSounds.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `📁 ${s.name}`;
        this.customRingtoneOptGroup.appendChild(opt);
      });
    } else {
      this.customRingtoneOptGroup.style.display = 'none';
    }

    if (this.customSoundCount) {
      this.customSoundCount.textContent = this.customSounds.length;
    }
  }

  async handleCustomSoundUpload(file) {
    if (!file) return;

    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const fileName = file.name.toLowerCase();
    const isAudioType = file.type.startsWith('audio/') || validExtensions.some(ext => fileName.endsWith(ext));

    if (!isAudioType) {
      this.showToast('Vui lòng chọn file âm thanh (.mp3, .wav, .m4a, .aac, .ogg)!', 'error');
      return;
    }

    try {
      this.showToast(`Đang nạp file ${file.name}...`, 'info');
      const added = await CustomAudioStorage.add(file);
      await this.loadCustomRingtones();

      if (this.alarmRingtone) {
        this.alarmRingtone.value = added.id;
      }

      this.showToast(`Đã thêm chuông: "${added.name}"!`, 'success');

      if (this.customSoundModal && this.customSoundModal.classList.contains('show')) {
        this.renderCustomSoundsList();
      }
    } catch (err) {
      this.showToast(err.message || 'Lỗi lưu file âm thanh!', 'error');
    } finally {
      if (this.inputCustomRingtone) this.inputCustomRingtone.value = '';
      if (this.inputModalCustomSound) this.inputModalCustomSound.value = '';
    }
  }

  openCustomSoundModal() {
    AudioEngine.stopAlarm();
    this.renderCustomSoundsList();
    this.customSoundModal.classList.add('show');
  }

  renderCustomSoundsList() {
    if (!this.customSoundsListContainer) return;

    const count = this.customSounds.length;
    if (this.customSoundCount) {
      this.customSoundCount.textContent = count;
    }

    if (count === 0) {
      this.soundEmptyState.style.display = 'flex';
      this.customSoundsListContainer.innerHTML = '';
      return;
    }

    this.soundEmptyState.style.display = 'none';
    const currentSelectedId = this.alarmRingtone ? this.alarmRingtone.value : '';

    this.customSoundsListContainer.innerHTML = this.customSounds.map(s => {
      const sizeMb = (s.size / (1024 * 1024)).toFixed(2);
      const isSelected = s.id === currentSelectedId;
      return `
        <div class="custom-sound-item ${isSelected ? 'active' : ''}" data-id="${s.id}">
          <div class="sound-item-left">
            <div class="sound-item-icon">
              <i class="fa-solid fa-music"></i>
            </div>
            <div class="sound-item-meta">
              <span class="sound-item-title" title="${this.escapeHtml(s.name)}">${this.escapeHtml(s.name)}</span>
              <span class="sound-item-sub">${sizeMb} MB • ${s.fileName}</span>
            </div>
          </div>
          <div class="sound-item-actions">
            <button type="button" class="btn-sound-action btn-play-item" data-action="preview" data-id="${s.id}" title="Nghe thử">
              <i class="fa-solid fa-play"></i>
            </button>
            <button type="button" class="btn-sound-action btn-select-item" data-action="select" data-id="${s.id}" title="Chọn làm chuông báo này">
              <i class="fa-solid fa-check"></i>
            </button>
            <button type="button" class="btn-sound-action btn-delete-sound" data-action="delete" data-id="${s.id}" title="Xóa chuông này">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Sự kiện tương tác trên từng file chuông
    this.customSoundsListContainer.querySelectorAll('.btn-sound-action').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const soundId = btn.dataset.id;

        if (action === 'preview') {
          if (btn.classList.contains('playing')) {
            AudioEngine.stopAlarm();
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
          } else {
            this.customSoundsListContainer.querySelectorAll('.btn-play-item').forEach(b => {
              b.classList.remove('playing');
              b.innerHTML = '<i class="fa-solid fa-play"></i>';
            });
            btn.classList.add('playing');
            btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
            AudioEngine.previewSound(soundId, () => {
              btn.classList.remove('playing');
              btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            });
          }
        } else if (action === 'select') {
          if (this.alarmRingtone) {
            this.alarmRingtone.value = soundId;
          }
          this.showToast('Đã chọn chuông cho lịch hẹn!', 'success');
          this.renderCustomSoundsList();
          setTimeout(() => {
            AudioEngine.stopAlarm();
            this.customSoundModal.classList.remove('show');
          }, 350);
        } else if (action === 'delete') {
          if (confirm('Bạn có chắc chắn muốn xóa file âm thanh này khỏi máy?')) {
            AudioEngine.stopAlarm();
            await CustomAudioStorage.deleteSound(soundId);
            await this.loadCustomRingtones();
            if (this.alarmRingtone && this.alarmRingtone.value === soundId) {
              this.alarmRingtone.value = 'digital_alarm';
            }
            this.showToast('Đã xóa âm thanh!', 'info');
            this.renderCustomSoundsList();
          }
        }
      });
    });
  }

  /* ====================================================================
     WEB PUSH & APPLE APNS INTEGRATION
     ==================================================================== */
  initWebPush() {
    this.pushServerUrl = localStorage.getItem('notes_push_server_url') || '';
    if (this.pushServerUrlInput) {
      this.pushServerUrlInput.value = this.pushServerUrl;
    }
    this.checkPushStatus();
  }

  async checkPushStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      this.updatePushUI(false, 'Trình duyệt không hỗ trợ Web Push', 'Hãy cài đặt ứng dụng vào màn hình chính trên iOS 16.4+');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        this.pushSubscription = sub;
        this.updatePushUI(true, 'Đã kết nối Apple Push (APNs)', 'Thiết bị sẵn sàng nhận báo thức khi khóa màn hình');
      } else {
        this.pushSubscription = null;
        this.updatePushUI(false, 'Chưa kích hoạt thông báo đẩy', 'Bấm nút "Bật Đẩy iPhone" để thiết bị reo chuông khi tắt app');
      }
    } catch (err) {
      console.warn('[Web Push Status Error]:', err);
      this.updatePushUI(false, 'Chưa kết nối', 'Nhấn nút để kích hoạt');
    }
  }

  updatePushUI(isActive, title, desc) {
    if (!this.pushStatusCard) return;
    this.pushStatusCard.classList.toggle('active', isActive);
    if (this.pushStatusTitle) this.pushStatusTitle.textContent = title;
    if (this.pushStatusDesc) this.pushStatusDesc.textContent = desc;
    if (this.btnTogglePushSub) {
      this.btnTogglePushSub.innerHTML = isActive
        ? '<i class="fa-solid fa-bell-slash"></i> Tắt Đẩy'
        : '<i class="fa-solid fa-bell"></i> Bật Đẩy iPhone';
      this.btnTogglePushSub.className = isActive ? 'btn-danger-sm' : 'btn-primary-sm';
    }
  }

  openWebPushModal() {
    this.checkPushStatus();
    if (this.webPushModal) this.webPushModal.classList.add('show');
  }

  async toggleWebPushSubscription() {
    if (this.pushSubscription) {
      // Unsubscribe
      try {
        await this.pushSubscription.unsubscribe();
        const serverUrl = this.getPushServerBaseUrl();
        fetch(`${serverUrl}/api/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: this.pushSubscription.endpoint })
        }).catch(() => {});
        this.pushSubscription = null;
        this.showToast('Đã tắt thông báo đẩy thiết bị', 'info');
        this.checkPushStatus();
      } catch (err) {
        alert('Lỗi hủy đăng ký: ' + err.message);
      }
    } else {
      // Subscribe
      if (!('Notification' in window)) {
        alert('Trình duyệt không hỗ trợ thông báo đẩy!');
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Bạn đã từ chối quyền Thông báo! Vui lòng vào Cài đặt của iPhone/trình duyệt để cấp quyền.');
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const serverUrl = this.getPushServerBaseUrl();

        // Lấy VAPID public key từ server (hoặc fallback)
        let pubKey = '';
        try {
          const res = await fetch(`${serverUrl}/api/vapid-public-key`);
          const data = await res.json();
          if (data && data.publicKey) pubKey = data.publicKey;
        } catch (e) {
          console.warn('[VAPID Fetch Fail]:', e);
        }

        // Khóa công khai mặc định nếu server chưa phản hồi
        if (!pubKey) {
          pubKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        }

        const convertedKey = this.urlBase64ToUint8Array(pubKey);
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        this.pushSubscription = sub;

        // Gửi subscription lên server
        const deviceName = /iPhone/i.test(navigator.userAgent) ? 'iPhone' : (/Android/i.test(navigator.userAgent) ? 'Android' : 'Máy tính');
        await fetch(`${serverUrl}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub,
            deviceName: `${deviceName} (${this.state.currentUser?.fullName || 'User'})`,
            userAgent: navigator.userAgent
          })
        });

        this.showToast('Đã kết nối Apple Push (APNs) thành công!', 'success');
        this.checkPushStatus();
        this.syncAlarmsToPushServer(false);
      } catch (err) {
        console.error('[Subscribe Error]:', err);
        alert('Không thể đăng ký Apple Push: ' + err.message + '\n\nLưu ý: Trên iPhone, hãy chắc chắn bạn đã thêm ứng dụng vào Màn hình chính (Add to Home Screen) và đang dùng iOS 16.4 trở lên.');
      }
    }
  }

  getPushServerBaseUrl() {
    if (this.pushServerUrl) return this.pushServerUrl;
    if (window.location.protocol.startsWith('http')) return window.location.origin;
    return 'http://localhost:3000';
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async syncAlarmsToPushServer(showFeedback = false) {
    const activeAlarms = this.state.notes.filter(n => n.hasAlarm && !n.completed);
    const serverUrl = this.getPushServerBaseUrl();

    try {
      const res = await fetch(`${serverUrl}/api/sync-alarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarms: activeAlarms })
      });
      const data = await res.json();
      if (showFeedback && data.success) {
        this.showToast(`Đã đồng bộ ${activeAlarms.length} lịch hẹn lên Server APNs!`, 'success');
      }
    } catch (err) {
      if (showFeedback) {
        this.showToast('Không thể kết nối đến Web Push Server: ' + serverUrl, 'error');
      }
    }
  }

  async sendTestPush() {
    const serverUrl = this.getPushServerBaseUrl();
    try {
      this.showToast('Đang gửi lệnh thông báo thử nghiệm qua APNs...', 'info');
      const res = await fetch(`${serverUrl}/api/test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: this.pushSubscription,
          title: '⏰ BÁO THỨC THỬ NGHIỆM - NOTES',
          body: 'Đánh thức thành công! Khóa màn hình iPhone thông báo vẫn sẽ reo đúng giờ hẹn.'
        })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Đã gửi thông báo đẩy! Hãy thử khóa màn hình điện thoại trong 3 giây.', 'success');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Không thể kết nối Push Server (' + serverUrl + '): ' + err.message);
    }
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NotesApp();
});
