

// ACTIOREDUX VERSION 0.2 branch preview test

// Simple QR Code Scanner App with Authentication
// Requires: jsQR.js from library in folder
// Requires: <script src="https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js"></script>


/*
  This Frontend is deployed through Netlify
    - access through arqdiscan.netlify.app
    - maybe serve jsQR library in HTML directly instead of npm install
    - CDN: <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
    */ 

// App version for cache busting and update control
const APP_VERSION = 'v1.0.2'; // Increment this on every deploy

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js?v=' + APP_VERSION)
    .then(reg => {
      // Optionally, force update check
      //reg.update && reg.update();
    });
}

// Connect to backend on Render
const API_BASE = "https://qdiappexpressbackend.onrender.com";
// Define QR header (QR is valid only if contains this string)
const QRHEADER = "QRHEADER"; // header for valid QR content


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
document.getElementById('app-version').textContent = 'ApVer : ' + APP_VERSION;
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
    loginStatus.textContent = 'Error: ' + err.message;
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
  alert("Starting QR Scanner, testing alerts");
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
function tick() {
  loop++;
  if (!scanning){
    qrStatus.textContent = "Scanning stopped at loop "+loop;
    return; // exit loop if scanning === false
  } 
  //qrStatus.textContent = `____inside tick loop  ${loop}`;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    qrStatus.textContent = "Scanning for QR code loop "+loop;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let code = null;
    try {
      code = jsQR(imageData.data, imageData.width, imageData.height);
    } catch (err) {
      debugMsg += ` | jsQR error: ${err.message}`;
      alert("jsQR error: " + err.message);
    }
    //debugMsg += code ? ` | QR found: ${JSON.stringify(code)}` : ' | No QR detected';
    debuginfo.textContent = debugMsg;

    if (code) { // found a QR code
      debugMsg += ' | QR code Lock : ' + JSON.stringify(code);
      stopQRScanner(); // Freeze camera
      qrResult.textContent = "Got QR Code lock : \n" + code.data;
      if (isValidQR(code.data)) {
        // Ask for confirmation
        if (window.confirm("Valid QR Code lock :\n\n" + code.data + " \n\n Send to server?" )) {
          // Split and decrypt
          let echoedQrData;
          try {
            alert("now sending to server :\n" + code.data);
            echoedQrData = splitAndDecypherData(code.data);
            alert("recieved from server :\n" + echoedQrData );
          }
          catch (err) {
            debugMsg += ' | Error at splitAndDecypherData(code.data): ' + err.message;
            debuginfo.textContent = debugMsg;
            alert("Error at splitAndDecypherData(code.data): " + err.message);
            qrResult.textContent = "Error at splitAndDecypherData(code.data): :\n\n" + err.message;
          }
          document.getElementById('decrypted-content').textContent ="Decrypted QR :\n"+ echoedQrData;
          return; // confirmation ends, no further scanning until user acts
        } else {"waiting for user window confirmation";}
      } else { // invalid QR
        debugMsg += ' | Invalid QR code: ' + code.data;
        debuginfo.textContent = debugMsg;
        alert("Invalid QR Code:\n\n" + code.data);
        qrResult.textContent = "Got Invalid QR Code :\n\n" + code.data;
        return; // Will resume scanning when user clicks start scanner button again
      }
    }
  }
  requestAnimationFrame(tick);
  //debuginfo.textContent = debugMsg + ' | [tick] End loop #' + loop;
};


// DATA PROCESSING
// Is Valid QR?
function isValidQR(qrcontent) {
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
      const header = qrcontent.split("?cypherdata=")[0];
      const decryptedData = await sendEncryptedStringToBackend(encryptedData);
      console.log("Decrypted data recieved from server : \n", decryptedData);
      return header + decryptedData;
    }
  } catch (err) {
    throw new Error('splitQRData() or Decryption failed :'+ err.message);
  }
};

// QR DECRYPTION 
// Send cyphertext to backend for decryption end echo back
async function sendEncryptedStringToBackend(ciphertext) {
  try {
    fetch(API_BASE + '/api/decrypt', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken 
      },
      body: JSON.stringify({ encrypted: ciphertext })
    })
      .then(r => r.json())
      .then(response => {
        alert('Decrypted data recieved : ' + response.decrypted);
        return response.decrypted;
      });
    } catch(err) {
      alert('Decryption/echo Error: ' + err.message);
      return "DECRYPTION FAILED";
    };    
};

}); // end of DOMContentLoaded event listener
