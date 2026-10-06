// Configuration & State
const STORAGE_KEY_SESSION = 'chitkara_ci_session';

// DOM Elements
const ciSessionInput = document.getElementById('ciSessionInput');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const sessionSavedBadge = document.getElementById('sessionSavedBadge');
const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');

// Tabs
const tabNewPass = document.getElementById('tabNewPass');
const tabViewPasses = document.getElementById('tabViewPasses');
const applyPassContainer = document.getElementById('applyPassContainer');
const viewPassesContainer = document.getElementById('viewPassesContainer');
const openChitkaraBtn = document.getElementById('openChitkaraBtn');

// Gatepass List Elements
const refreshPassesBtn = document.getElementById('refreshPassesBtn');
const fetchPassesInitBtn = document.getElementById('fetchPassesInitBtn');
const passesLoading = document.getElementById('passesLoading');
const passesEmpty = document.getElementById('passesEmpty');
const passesList = document.getElementById('passesList');

// Form Inputs
const dateCheckOut = document.getElementById('dateCheckOut');
const nativeDateCheckOutPicker = document.getElementById('nativeDateCheckOutPicker');
const checkoutTime = document.getElementById('checkoutTime');

const dateCheckIn = document.getElementById('dateCheckIn');
const nativeDateCheckInPicker = document.getElementById('nativeDateCheckInPicker');
const checkinTime = document.getElementById('checkinTime');

const reasonInput = document.getElementById('reasonInput');
const gidInput = document.getElementById('gidInput');

const submitGatepassBtn = document.getElementById('submitGatepassBtn');
const copyCurlBtn = document.getElementById('copyCurlBtn');

const serverStatusBadge = document.getElementById('serverStatusBadge');
const serverStatusText = document.getElementById('serverStatusText');

const responseCard = document.getElementById('responseCard');
const responseStatusBadge = document.getElementById('responseStatusBadge');
const emptyState = document.getElementById('emptyState');
const responseContent = document.getElementById('responseContent');
const resMetaCode = document.getElementById('resMetaCode');
const resMetaTime = document.getElementById('resMetaTime');
const resMetaTimestamp = document.getElementById('resMetaTimestamp');
const responseBodyCode = document.getElementById('responseBodyCode');

const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// Helpers: Date formatting
function formatDateToDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDDMMYYYYtoYYYYMMDD(str) {
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

function parseYYYYMMDDtoDDMMYYYY(str) {
  if (!str) return '';
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

// Show Toast
function showToast(msg, type = 'info') {
  toastMessage.textContent = msg;
  toastNotification.className = `toast ${type}`;
  setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 4000);
}

// Initialize Session Token (Default is 100% EMPTY unless saved by user)
function initSessionToken() {
  const saved = localStorage.getItem(STORAGE_KEY_SESSION);
  // Clear any old placeholder token from previous version
  if (saved === 'v5dpgh2sl7t4oi727sil62t6o0pr5e5j') {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    ciSessionInput.value = '';
    updateSessionBadge(false);
    return;
  }

  if (saved && saved.trim()) {
    ciSessionInput.value = saved.trim();
    updateSessionBadge(true);
  } else {
    ciSessionInput.value = '';
    updateSessionBadge(false);
  }
}

function updateSessionBadge(isSaved) {
  if (isSaved && ciSessionInput.value.trim().length > 0) {
    sessionSavedBadge.textContent = 'Saved';
    sessionSavedBadge.className = 'mini-badge is-saved';
  } else {
    sessionSavedBadge.textContent = 'Unsaved';
    sessionSavedBadge.className = 'mini-badge not-saved';
  }
}

// Check Backend Server Health
async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      serverStatusBadge.className = 'status-badge online';
      serverStatusText.textContent = 'Online';
    } else {
      throw new Error('Offline');
    }
  } catch {
    serverStatusBadge.className = 'status-badge offline';
    serverStatusText.textContent = 'Proxy Offline';
  }
}

// Get Active applyFor Value: 1 (Day) or 2 (Night)
function getApplyForValue() {
  const selected = document.querySelector('input[name="applyFor"]:checked');
  return selected ? selected.value : '2';
}

// Build Payload Object
function getFormData() {
  return {
    ci_session: ciSessionInput.value.trim(),
    applyFor: getApplyForValue(),
    dateCheckOut: dateCheckOut.value.trim(),
    checkoutTime: checkoutTime.value.trim(),
    dateCheckIn: dateCheckIn.value.trim(),
    checkinTime: checkinTime.value.trim(),
    reason: reasonInput.value.trim(),
    gid: gidInput.value.trim()
  };
}

// Generate cURL String
function generateCurlString() {
  const data = getFormData();
  const rawData = `applyFor=${encodeURIComponent(data.applyFor)}&dateCheckOut=${encodeURIComponent(data.dateCheckOut)}&checkoutTime=${encodeURIComponent(data.checkoutTime)}&dateCheckIn=${encodeURIComponent(data.dateCheckIn)}&checkinTime=${encodeURIComponent(data.checkinTime)}&reason=${encodeURIComponent(data.reason)}&gid=${encodeURIComponent(data.gid)}`;
  
  return `curl 'https://uhostel.chitkarauniversity.edu.in/gatepass/initSendData' \\
  -H 'accept: */*' \\
  -H 'accept-language: en-US,en;q=0.7' \\
  -H 'content-type: application/x-www-form-urlencoded; charset=UTF-8' \\
  -b 'ci_session=${data.ci_session || '<YOUR_CI_SESSION>'}' \\
  -H 'origin: https://uhostel.chitkarauniversity.edu.in' \\
  -H 'priority: u=0, i' \\
  -H 'referer: https://uhostel.chitkarauniversity.edu.in/Gatepass' \\
  -H 'sec-ch-ua: "Chromium";v="154", "Brave";v="154", "Not A(Brand";v="99"' \\
  -H 'sec-ch-ua-mobile: ?1' \\
  -H 'sec-ch-ua-platform: "Android"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'sec-gpc: 1' \\
  -H 'user-agent: Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36' \\
  -H 'x-requested-with: XMLHttpRequest' \\
  --data-raw '${rawData}'`;
}

// Copy helper
async function copyToClipboard(text, message = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message, 'success');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(message, 'success');
  }
}

// Initialize Dates
function initDates() {
  if (!dateCheckOut.value) {
    dateCheckOut.value = '02-10-2026';
  }
  if (!dateCheckIn.value) {
    dateCheckIn.value = '06-10-2026';
  }
  nativeDateCheckOutPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckOut.value);
  nativeDateCheckInPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckIn.value);
}

// Open Chitkara Portal with Cookie Autofill helper
function handleOpenChitkaraPortal() {
  const token = ciSessionInput.value.trim();
  if (!token) {
    showToast('Please enter your ci_session cookie first!', 'error');
    ciSessionInput.focus();
    return;
  }

  // 1. Create 1-click cookie script
  const cookieScript = `document.cookie="ci_session=${token};path=/;domain=.chitkarauniversity.edu.in";location.href="https://uhostel.chitkarauniversity.edu.in/Gatepass";`;
  
  // 2. Copy script to clipboard
  navigator.clipboard.writeText(cookieScript).catch(() => {});

  // 3. Open Portal
  window.open('https://uhostel.chitkarauniversity.edu.in/Gatepass', '_blank');

  showToast('Opening Chitkara Portal! Cookie auto-login script copied to clipboard.', 'success');
}

// Fetch Student Gatepasses List
async function fetchGatepasses() {
  const token = ciSessionInput.value.trim();
  if (!token) {
    showToast('Please enter and save your ci_session cookie first!', 'error');
    ciSessionInput.focus();
    return;
  }

  passesLoading.classList.remove('hidden');
  passesEmpty.classList.add('hidden');
  passesList.classList.add('hidden');

  try {
    const res = await fetch('/api/student-gatepasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ci_session: token,
        applyFor: getApplyForValue()
      })
    });

    const result = await res.json();
    passesLoading.classList.add('hidden');

    if (result.sessionExpired) {
      passesEmpty.classList.remove('hidden');
      passesEmpty.innerHTML = `
        <div class="empty-icon">⚠️</div>
        <p><strong>Session Expired or Invalid!</strong></p>
        <p class="text-muted text-sm mt-1">Please log into Chitkara UHostel and update your <code>ci_session</code> cookie above.</p>
      `;
      showToast('Session expired. Please update your ci_session cookie.', 'error');
      return;
    }

    if (!result.success || !result.data || !Array.isArray(result.data.info) || result.data.info.length === 0) {
      passesEmpty.classList.remove('hidden');
      passesEmpty.innerHTML = `
        <div class="empty-icon">📭</div>
        <p>No gatepasses found on Chitkara portal.</p>
        <button type="button" class="btn-primary-sm mt-3" onclick="fetchGatepasses()">Try Again</button>
      `;
      return;
    }

    renderGatepasses(result.data.info);
    showToast(`Loaded ${result.data.info.length} gatepass(es) from Chitkara!`, 'success');

  } catch (err) {
    passesLoading.classList.add('hidden');
    passesEmpty.classList.remove('hidden');
    passesEmpty.innerHTML = `
      <div class="empty-icon">❌</div>
      <p>Error connecting to server: ${err.message}</p>
      <button type="button" class="btn-primary-sm mt-3" onclick="fetchGatepasses()">Retry</button>
    `;
    showToast('Failed to load gatepasses', 'error');
  }
}

// Helper to strip HTML tags from raw string
function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

// Render Gatepasses to DOM
function renderGatepasses(items) {
  passesList.innerHTML = '';
  passesEmpty.classList.add('hidden');
  passesList.classList.remove('hidden');

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gatepass-item-card';

    // Status parsing
    const rawStatus = stripHtml(item.status || item.isApproveT || 'Pending');
    const isApproved = rawStatus.toLowerCase().includes('approved');
    const isRejected = rawStatus.toLowerCase().includes('rejected');
    const statusClass = isApproved ? 'status-pill-approved' : (isRejected ? 'status-pill-rejected' : 'status-pill-pending');

    // Leave Type
    const rawType = stripHtml(item.leaveType || (item.applyFor === '2' ? 'Night Out' : 'Day Pass'));

    // Warden contact
    const wardenName = item.wardenUserName || stripHtml(item.approveName).split('\n')[0] || 'Warden';
    const wardenPhone = item.wardenEmployeeNo || '';

    card.innerHTML = `
      <div class="pass-card-header">
        <div class="pass-id-wrap">
          <span class="pass-tag-badge">#${item.gateId || item.tokenId || item.srNo}</span>
          <span class="pass-type-badge">${rawType}</span>
        </div>
        <span class="status-pill ${statusClass}">${rawStatus || 'Pending'}</span>
      </div>

      <div class="pass-time-grid">
        <div class="time-block">
          <span class="time-label">Exit (Out)</span>
          <span class="time-val">${item.dateCheckOutT || item.dateCheckOut || ''}</span>
          <span class="time-sub">${item.checkoutDateTime || ''}</span>
        </div>
        <div class="time-arrow">➔</div>
        <div class="time-block">
          <span class="time-label">Return (In)</span>
          <span class="time-val">${item.dateCheckInT || item.dateCheckIn || 'Day Pass'}</span>
          <span class="time-sub">${item.checkinDateTime || ''}</span>
        </div>
      </div>

      <div class="pass-detail-row">
        <span class="detail-label">Reason:</span>
        <span class="detail-val highlight">${item.reason || stripHtml(item.reasonT) || 'N/A'}</span>
      </div>

      ${wardenPhone ? `
      <div class="pass-detail-row">
        <span class="detail-label">Warden:</span>
        <span class="detail-val">
          ${wardenName} 
          <a href="tel:${wardenPhone}" class="phone-link">📞 ${wardenPhone}</a>
        </span>
      </div>
      ` : ''}

      ${item.studentName ? `
      <div class="pass-footer-meta">
        <span>${item.studentName} (${item.rollNo || ''})</span>
        <span>${item.hostelName || ''} - Room ${item.roomName || ''}</span>
      </div>
      ` : ''}
    `;

    passesList.appendChild(card);
  });
}

// Event Listeners Setup
function setupEventListeners() {
  // Session Save
  saveSessionBtn.addEventListener('click', () => {
    const val = ciSessionInput.value.trim();
    if (!val) {
      showToast('Please enter a session value first', 'error');
      return;
    }
    localStorage.setItem(STORAGE_KEY_SESSION, val);
    updateSessionBadge(true);
    showToast('ci_session saved in browser localStorage!', 'success');
  });

  ciSessionInput.addEventListener('input', () => {
    updateSessionBadge(false);
  });

  // Toggle Token Visibility
  toggleTokenVisibility.addEventListener('click', () => {
    ciSessionInput.type = ciSessionInput.type === 'password' ? 'text' : 'password';
  });

  // Tab switching
  tabNewPass.addEventListener('click', () => {
    tabNewPass.classList.add('active');
    tabViewPasses.classList.remove('active');
    applyPassContainer.classList.remove('hidden');
    viewPassesContainer.classList.add('hidden');
  });

  tabViewPasses.addEventListener('click', () => {
    tabViewPasses.classList.add('active');
    tabNewPass.classList.remove('active');
    applyPassContainer.classList.add('hidden');
    viewPassesContainer.classList.remove('hidden');
    // Auto-fetch if token is present
    if (ciSessionInput.value.trim()) {
      fetchGatepasses();
    }
  });

  // Open Chitkara Portal button
  openChitkaraBtn.addEventListener('click', handleOpenChitkaraPortal);

  // Refresh & Fetch Passes buttons
  refreshPassesBtn.addEventListener('click', fetchGatepasses);
  fetchPassesInitBtn.addEventListener('click', fetchGatepasses);

  // Apply For radio changes (Day vs Night)
  document.querySelectorAll('input[name="applyFor"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
      e.target.closest('.pill-option').classList.add('active');
    });
  });

  // Date Check Out quick buttons
  document.getElementById('chipOutToday').addEventListener('click', () => {
    dateCheckOut.value = formatDateToDDMMYYYY(new Date());
    nativeDateCheckOutPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckOut.value);
  });

  document.getElementById('chipOutTomorrow').addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateCheckOut.value = formatDateToDDMMYYYY(tomorrow);
    nativeDateCheckOutPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckOut.value);
  });

  // Date pickers sync
  nativeDateCheckOutPicker.addEventListener('change', (e) => {
    if (e.target.value) {
      dateCheckOut.value = parseYYYYMMDDtoDDMMYYYY(e.target.value);
    }
  });

  dateCheckOut.addEventListener('input', () => {
    nativeDateCheckOutPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckOut.value);
  });

  // Date Check In quick buttons
  document.getElementById('chipInSameDay').addEventListener('click', () => {
    dateCheckIn.value = dateCheckOut.value;
    nativeDateCheckInPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckIn.value);
  });

  document.getElementById('chipInClear').addEventListener('click', () => {
    dateCheckIn.value = '';
    nativeDateCheckInPicker.value = '';
  });

  nativeDateCheckInPicker.addEventListener('change', (e) => {
    if (e.target.value) {
      dateCheckIn.value = parseYYYYMMDDtoDDMMYYYY(e.target.value);
    }
  });

  dateCheckIn.addEventListener('input', () => {
    nativeDateCheckInPicker.value = parseDDMMYYYYtoYYYYMMDD(dateCheckIn.value);
  });

  // Time preset chips
  document.querySelectorAll('.time-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const val = btn.getAttribute('data-val');
      const el = document.getElementById(targetId);
      if (el) el.value = val;
    });
  });

  // Reason chips
  document.querySelectorAll('#reasonChips .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      reasonInput.value = btn.getAttribute('data-reason');
    });
  });

  // Copy Button
  copyCurlBtn.addEventListener('click', () => {
    copyToClipboard(generateCurlString(), 'Exact cURL copied!');
  });

  // Form Submit
  submitGatepassBtn.addEventListener('click', handleSubmit);
}

// Handle Gatepass Submission
async function handleSubmit() {
  const data = getFormData();

  if (!data.ci_session) {
    showToast('Please enter your ci_session value first', 'error');
    ciSessionInput.focus();
    return;
  }

  if (!data.dateCheckOut) {
    showToast('Check-out date is required', 'error');
    dateCheckOut.focus();
    return;
  }

  if (!data.checkoutTime) {
    showToast('Check-out time is required', 'error');
    checkoutTime.focus();
    return;
  }

  if (!data.reason) {
    showToast('Please enter a reason', 'error');
    reasonInput.focus();
    return;
  }

  // Ensure current ci_session is saved
  localStorage.setItem(STORAGE_KEY_SESSION, data.ci_session);
  updateSessionBadge(true);

  // UI Loading State
  submitGatepassBtn.disabled = true;
  submitGatepassBtn.querySelector('.btn-text').classList.add('hidden');
  submitGatepassBtn.querySelector('.btn-spinner').classList.remove('hidden');

  responseStatusBadge.className = 'status-tag loading';
  responseStatusBadge.textContent = 'Sending...';

  const startTime = Date.now();

  try {
    const res = await fetch('/api/send-gatepass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const elapsed = Date.now() - startTime;
    const result = await res.json();

    emptyState.classList.add('hidden');
    responseContent.classList.remove('hidden');

    resMetaCode.textContent = `HTTP ${result.status || res.status}`;
    resMetaTime.textContent = `Latency: ${result.durationMs || elapsed}ms`;
    resMetaTimestamp.textContent = new Date().toLocaleTimeString();

    if (result.success) {
      responseStatusBadge.className = 'status-tag success';
      responseStatusBadge.textContent = 'Success (200)';
      showToast('Gatepass request submitted successfully!', 'success');
    } else {
      responseStatusBadge.className = 'status-tag error';
      responseStatusBadge.textContent = result.sessionExpired ? 'Session Expired' : `Error (${result.status || 'Failed'})`;
      showToast(result.error || 'Request failed. Check response console.', 'error');
    }

    if (result.error && !result.data) {
      responseBodyCode.textContent = `Error: ${result.error}\n\nStatus: ${result.status} ${result.statusText || ''}`;
    } else if (typeof result.data === 'object') {
      responseBodyCode.textContent = JSON.stringify(result.data, null, 2);
    } else if (result.rawText) {
      responseBodyCode.textContent = result.rawText;
    } else {
      responseBodyCode.textContent = JSON.stringify(result, null, 2);
    }

    // Scroll smoothly to response on mobile
    if (window.innerWidth < 768) {
      responseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    const elapsed = Date.now() - startTime;
    emptyState.classList.add('hidden');
    responseContent.classList.remove('hidden');

    responseStatusBadge.className = 'status-tag error';
    responseStatusBadge.textContent = 'Network Error';

    resMetaCode.textContent = 'Proxy Error';
    resMetaTime.textContent = `${elapsed}ms`;
    resMetaTimestamp.textContent = new Date().toLocaleTimeString();

    responseBodyCode.textContent = `Could not connect to the local server.\n\nMake sure the Node.js server is running:\n  node server.js\n\nError: ${err.message}`;
    showToast('Failed to connect to local server proxy', 'error');
  } finally {
    submitGatepassBtn.disabled = false;
    submitGatepassBtn.querySelector('.btn-text').classList.remove('hidden');
    submitGatepassBtn.querySelector('.btn-spinner').classList.add('hidden');
  }
}

// Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initSessionToken();
  initDates();
  setupEventListeners();
  checkServerHealth();
});
