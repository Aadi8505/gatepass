# Chitkara UHostel Gatepass Dispatcher 🚀

A streamlined, modern web interface to quickly submit gatepass requests to Chitkara University's hostel system (`uhostel.chitkarauniversity.edu.in`).

## ✨ Features

- **5 Configured Fields:**
  1. **`applyFor`**: 1 (Day Pass), 2 (Night Out / Home), 3 (Official Duty), or Custom.
  2. **Check-out Date & Time**: `dateCheckOut` (formatted as `DD-MM-YYYY`) and `checkoutTime` (e.g. `7am`).
  3. **Check-in Date & Time**: `dateCheckIn` (optional/blank for day passes) and `checkinTime` (e.g. `6pm`).
  4. **Reason**: Text input with 1-click quick suggestion chips (`placement`, `market`, `medical`, etc.).
  5. **`ci_session` Persistence**: Your session token is saved in browser `localStorage` and remembered automatically across reloads until you change or update it.
- **Bypasses Browser CORS Restrictions**: Built-in zero-dependency local Node.js proxy relays the request directly to `https://uhostel.chitkarauniversity.edu.in/gatepass/initSendData` with all the required browser headers (`User-Agent`, `Referer`, `Cookie`, `Origin`, etc.).
- **Response Console**: Real-time HTTP status, latency, and full server response payload preview.
- **Live cURL Generator**: Dynamically constructs and updates the exact equivalent cURL command with 1-click copy.

## 🚀 How to Run

### Option 1: Quick Double-Click (Windows)
Double-click `start.bat`. It will launch the Node server and immediately open your browser to `http://localhost:3000`.

### Option 2: Terminal
```bash
npm start
# or
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000).

## 🔑 How to get your `ci_session`
1. Log into your [Chitkara UHostel Portal](https://uhostel.chitkarauniversity.edu.in/Gatepass).
2. Press `F12` to open Developer Tools -> Go to the **Application** (or **Storage**) tab -> **Cookies** -> `https://uhostel.chitkarauniversity.edu.in`.
3. Copy the value of the `ci_session` cookie.
4. Paste it into the website once. It will stay saved in your browser storage automatically!
