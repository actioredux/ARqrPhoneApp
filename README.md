# qrPhoneAppV0 Frontend @ qdiscan.netlify.app

A simple QR code phone app project.

## Purpose
qrPhoneAppV0 is a Progressive Web App (PWA) that allows users to log in, scan QR codes using their device camera, and securely send the scanned data to a backend server using JWT authentication. It is designed to work both locally and as an installable app on mobile devices.

### Frontend Deployed through Netlify  
   - access through qdiscan.netlify.app

## qrPhoneApp:📱 Overview
 built a **Progressive Web App (PWA)** that:
- Runs in the browser (frontend, pure JavaScript + HTML).
- Lets users **log in** with username/password.
- Uses **JWT (JSON Web Token)** for secure authentication.
- Can **scan QR codes** with the smartphone camera (via `jsQR`).
- Sends scanned QR results securely to your backend.

### debug Login with alice / 1234 or bob / abcd
### require https protocole


---

## 🗂 Project Structure

### Frontend (PWA) on Netlify 
- `index.html` → App entry point
- `app.js` → Handles login, QR scanning, fetch requests
- `manifest.json` → Defines app name, icon, installability
- `sw.js` → Service worker (needed for PWA)
- `appIcon.png` → Custom app icon
- `jsQR.js` -> js QR reader package

### Backend (Node.js + Express) on Render
- `server.js` → Express server with:
- `/auth/login` → Issues JWT on successful login
- `/api/qr` → Protected endpoint for QR results
- `package.json` → Dependencies: `express`, `cors`, `jsonwebtoken`, (`body-parser`)

---
## How to Install App on phone:
    - if Android (Chrome / Edge / Brave):
        Open the app URL in Chrome (e.g. http://192.168.178.21:5000 or whatever port serve . has choosen)
        tap the (...) menu
        Select “Add to Home screen” or “Install app”
        A shortcut with your app’s name and icon will appear on your home screen
    - if iphone (safari)
        Open the app URL in Safari.
        Tap the Share icon (square with an arrow ↑).
        Scroll down and select “Add to Home Screen”.
        Enter a name and tap Add.
        The app now appears on your home screen and opens in its own window (not in Safari tabs).



## Main Logic and Features
1. User Authentication
- The app provides a login form (index.html).
- On login, it sends a POST request to /auth/login on the backend, receives a JWT (accessToken), and stores it in the frontend.
- Only after successful login does the QR scanning section become visible.

2. QR Code Scanning
- Uses the device camera (via navigator.mediaDevices.getUserMedia) to stream video.
- Uses the jsQR library to scan for QR codes in the video stream.
- When a QR code is detected, its data is displayed and sent to the backend (/api/qr) with the JWT in the Authorization header.

3. PWA Features
- Registers a service worker (sw.js) for offline capability and installability.
- Has a manifest (manifest.json) for app metadata and icon.
- Can be installed on a phone’s home screen and run like a native app.

4. Project Structure
- index.html: Main UI, login form, QR scanner section.
- app.js: Handles login, camera access, QR scanning, and API requests.
- jsQR.js: QR code decoding library.
- style.css: App styling.
- manifest.json: PWA manifest (name, icon, theme, etc.).
- sw.js: Service worker for PWA.
- appIcon.png: App icon.

5. Backend (not included here, but referenced)
- Expects a backend server (Node.js/Express) with /auth/login and /api/qr endpoints.
- Handles authentication and QR data processing.

## Example Flow
- User opens the app in a browser or as a PWA.
- User logs in with username/password.
- On success, the app shows the QR scanner.
- User scans a QR code; the app decodes it and sends the result to the backend with JWT authentication.
- The backend processes the QR data and responds.

## Debug

## Production 
