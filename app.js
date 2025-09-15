

/*

ACTIOREDUX VERSION on branch preview
Frontend PWA : qrCode Scanner App with JWR Authentication

-> https://preview--arqdiscan.netlify.app/ or localhost:5500 for local test
 
Requires: jsQR.js from library in folder
Requires: <script src="https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js"></script>

    - maybe serve jsQR library in HTML directly instead of npm install
    - CDN: <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
Debug:
  - in backend terminal (qrAppExpressBackend): > node server.js
  - in frontend terminal (ARqrPhoneApp): > serve .

  - require npm install -g serve (frontend mini static server)

  - access through link provided by serve .
  - make sure backend server is running on localhost:3000: > node server.js 
  - use alice/1234 or bob/abcd to login
  - stop backend: Ctrl+C
  - stop frontend: Ctrl+C

    
*/ 

const debug = true;           // debug in localhost
const APP_VERSION = 'v1.0.2'; // App version for cache busting and update control
const QRHEADER = "QRHEADER";  // header in qr, defines a valid QR

if (debug) {
  console.log("Localhost Debug mode ON, access through: frontendTerminal > serve -l 5500 ");
  console.log(" --> Run the frontend in browser at http//localhost:5500 ");
  console.log("(make sure backend server is running on localhost:3000: backendTerminal > node server.js )");
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js?v=' + APP_VERSION)
    .then(reg => {
      //reg.update && reg.update(); //Optionally, force update check on netlify deploy
    });
}

let API_BASE;
if (debug) {
  // localhost debug
  API_BASE = "http://localhost:3000";
  console.log("Service worker registered, API_BASE set to " + API_BASE);
} else {
  // Connect to backend on Render
  console.log("Service worker registered");
  API_BASE = "https://qdiappexpressbackend.onrender.com";
}


document.addEventListener('DOMContentLoaded', function() { // Ensure DOM is loaded before accessing elements

// index.html elements
const loginBtn = document.getElementById('login-btn');
const loginStatus = document.getElementById('login-status');
const scannerDiv = document.getElementById('scanner-div');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const qrStatus = document.getElementById('qr-status');
const qrResult = document.getElementById('qr-result');
const debuginfo = document.getElementById('debug-info');
const closeAppBtn = document.getElementById('closeAppBtn');

let accessToken = null;
let scanning = true;
let videoStream = null;


// versioning
document.getElementById('app-version').textContent = 'ApVersion : ' + APP_VERSION;
// Close app button handler
closeAppBtn.addEventListener('click', () => {
  if (window.confirm('Close the app?')) {
    window.close();
    // Fallback for browsers that block window.close()
    document.body.innerHTML = '<h2>App closed.</h2>';
  }
});

// USER LOGIN
loginBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  loginStatus.textContent = '... Attempting login ... Serveur waking  up ...';
  try {
    // to server query
    console.log("Attempting login for ", username, " @", API_BASE);
    const res = await fetch(API_BASE+'/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    accessToken = data.accessToken;
    // layout changes
    loginStatus.textContent = 'Login successful!'; // will never be seen ... 
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('welcome-section').style.display = 'block';
    document.getElementById('welcome-msg').textContent = 'Welcome ' + username + '!';
    document.getElementById('start-scan-div').style.display = 'inline-block'; // show scanner button
    scannerDiv.style.display = 'block'; // start scanner View

  } catch (err) {
    loginStatus.textContent = API_BASE+' Login Error: ' + err.message;
    console.error("Login error details:", err);
  }
});

/*
// logout button TODO: implement
document.getElementById('logout-btn').addEventListener('click', () => {
  accessToken = null;
  scannerDiv.style.display = 'none';
  loginStatus.textContent = 'Logged out.';
  stopQRScanner();
});
*/




// ---- QR SCANNING -----

// Start camera and scanning (called by Start Scanning button)
document.getElementById('start-scan-btn').addEventListener('click', () => {
  //document.getElementById('start-scan-btn').style.display = 'none';
  qrStatus.textContent = "Starting camera ...";
  startQRScanner();
});

async function startQRScanner() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = videoStream;
    video.setAttribute("playsinline", true);
    video.play();
    scanning = true;
    qrStatus.textContent = "Scanning for QR code.";
    requestAnimationFrame(tick); // Initiating scan loop  
  } catch (err) {
    qrStatus.textContent = "Camera error: " + err.message;
  }
}

function stopQRScanner() {
  scanning = false;
  qrStatus.textContent = "Scanning stopped.";
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
}

// QR scanning loop 
let loop = 0;
let debugMsg = "";
async function tick() {
  loop++;
  if (!scanning){
    qrStatus.textContent = "Scanning stopped at loop "+loop;
    return; // exit loop if scanning === false
  } 
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    qrStatus.textContent = "Video ready, Scanning for QR code loop "+loop;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let code = null;
    try {
      code = jsQR(imageData.data, imageData.width, imageData.height);
    } catch (err) {
      console.log("jsQR error: " + err);
      alert("jsQR error: " + err.message);
    }
    if (code) { 
      // found a QR code (either valid or invalid)
      stopQRScanner(); // Freeze camera
      qrResult.textContent = "Got QR Code lock : \n" + code.data;
      if (isValidQR(code.data)) {
        // case valid QR, asking confirmation to send to server
        if (window.confirm("Valid QR Code lock :\n\n" + code.data + " \n\n Send to server?" )) { 
          let echoedQrData;
          try {
            console.log("Now sending data to server : " , code.data);
            echoedQrData = await splitAndDecypherData(code.data); //Recieving decrypted data from server
            console.log("Recieved back from server : " , echoedQrData );
          }
          catch (err) {
            console.log("Error at splitAndDecypherData(code.data) : " , err);
            alert("Error at splitAndDecypherData(code.data): " + err.message);
            qrResult.textContent = "Error at splitAndDecypherData(code.data): :\n\n" + err.message;
          }
          document.getElementById('decrypted-content').textContent ="Decrypted QR :\n"+ echoedQrData;
          return; // confirmation ends, no further scanning until user acts
        } else {"waiting for user window confirmation";}
      } else { 
        // case invalid QR
        alert("Found invalid QR Code:\n\n" + code.data);
        qrResult.textContent = "Got Invalid QR Code :\n\n" + code.data;
        return; // Will resume scanning when user clicks start scanner button again
      }
    }
  }
  requestAnimationFrame(tick);
  //debuginfo.textContent = debugMsg + ' | [tick] End loop #' + loop;
};

// DATA PROCESSING
function isValidQR(qrcontent) { // Valid QR are those containing QRHEADER
  if (qrcontent.includes(QRHEADER)) {
    return true
  } else {
    return false; 
  }
};
// Entry point for DECRYPTION LOGIC // QR Split and decode
// asuming format is "QRHEADER"+"whatever"+"?cypherdata=encryptedData"
async function splitAndDecypherData(qrcontent) {
  try {
    if (!qrcontent.includes("?cypherdata=")) {
      console.log("No encrypted data found in QR content");
      return qrcontent; // return as is
    } else {
      const encryptedData = qrcontent.split("?cypherdata=")[1];
      const pub =  qrcontent.split("?cypherdata=")[0];
      const header = pub.split(" ;")[0];
      const publicData = pub.split(" ;")[1];
      const decryptedData = await sendEncryptedStringToBackend(encryptedData);
      // console.log("Decrypted data recieved from server :", decryptedData);
      const formatedData = header+"?public="+publicData+"?private="+decryptedData; // format qrData
      return formatedData
    }
  } catch (err) {
    throw new Error('splitQRData() or Decryption failed :'+ err.message);
  }
};

// QR DECRYPTION 
// Send cyphertext to backend for decryption end echo back
async function sendEncryptedStringToBackend(ciphertext) {
  const encryptedPayload = JSON.stringify({ encrypted: ciphertext })
  //console.log("Sending playload to backend : " , encryptedPayload);
  try {
      const serverResponse = await fetch(API_BASE + '/api/decrypt', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken 
      },
      body: encryptedPayload
    });
    const response = await serverResponse.json();
    //console.log('Decrypted data recieved : ' , JSON.stringify(response));
    const decryptedDataString = JSON.stringify(response.data);
    return decryptedDataString; 
  } catch(err) {
    console.log('Decryption/echo Error: ' , err);
    alert('Decryption/echo Error: ' + err.message);
    return "DECRYPTION FAILED";
  };    
};



}); // end of DOMContentLoaded event listener
