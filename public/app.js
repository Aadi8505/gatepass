// Configuration & State
const STORAGE_KEY_SESSION = 'chitkara_ci_session';
const DEFAULT_INITIAL_TOKEN = 'v5dpgh2sl7t4oi727sil62t6o0pr5e5j';

// DOM Elements
const ciSessionInput = document.getElementById('ciSessionInput');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const sessionSavedBadge = document.getElementById('sessionSavedBadge');
const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');

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
  }, 3500);
}

// Initialize Session Token
function initSessionToken() {
  const saved = localStorage.getItem(STORAGE_KEY_SESSION);
  if (saved) {
    ciSessionInput.value = saved;
    updateSessionBadge(true);
  } else {
    ciSessionInput.value = DEFAULT_INITIAL_TOKEN;
    localStorage.setItem(STORAGE_KEY_SESSION, DEFAULT_INITIAL_TOKEN);
    updateSessionBadge(true);
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
  return selected ? selected.value : '1';
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
  -H 'sec-ch-ua: "Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "Windows"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'sec-gpc: 1' \\
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36' \\
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
    showToast('ci_session saved!', 'success');
  });

  ciSessionInput.addEventListener('input', () => {
    updateSessionBadge(false);
  });

  // Toggle Token Visibility
  toggleTokenVisibility.addEventListener('click', () => {
    ciSessionInput.type = ciSessionInput.type === 'password' ? 'text' : 'password';
  });

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
