/* ========================================
   DROWSINESS DETECTION — VANILLA JS
   MediaPipe Face Mesh + Eye Aspect Ratio
   ======================================== */

(function () {
  'use strict';

  // --- Config ---
  const CLOSED_THRESHOLD = 2.5;   // seconds
  const EAR_THRESHOLD = 0.25;     // below this = eyes closed (raised from 0.20)
  const SMOOTHING_FRAMES = 3;     // average EAR over N frames

  // --- MediaPipe Face Mesh landmark indices for eyes ---
  const LEFT_EYE = [362, 385, 387, 263, 373, 380];
  const RIGHT_EYE = [33, 160, 158, 133, 153, 144];

  // --- DOM Elements ---
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('overlay');
  const ctx = canvas.getContext('2d');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const errorState = document.getElementById('errorState');
  const errorText = document.getElementById('errorText');
  const cameraCard = document.getElementById('cameraCard');
  const noFaceBadge = document.getElementById('noFaceBadge');
  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const earValue = document.getElementById('earValue');
  const progressBar = document.getElementById('progressBar');
  const timerText = document.getElementById('timerText');
  const alarmAudio = document.getElementById('alarmAudio');
  const startOverlay = document.getElementById('startOverlay');
  const startBtn = document.getElementById('startBtn');

  // --- State ---
  let eyesClosedStart = null;
  let alarmPlaying = false;
  let earHistory = [];

  // --- Utility: Euclidean distance between two 3D landmarks ---
  function dist(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );
  }

  // --- Compute Eye Aspect Ratio ---
  function computeEAR(landmarks, eyeIndices) {
    var p1 = landmarks[eyeIndices[0]];
    var p2 = landmarks[eyeIndices[1]];
    var p3 = landmarks[eyeIndices[2]];
    var p4 = landmarks[eyeIndices[3]];
    var p5 = landmarks[eyeIndices[4]];
    var p6 = landmarks[eyeIndices[5]];

    var vertical1 = dist(p2, p6);
    var vertical2 = dist(p3, p5);
    var horizontal = dist(p1, p4);

    if (horizontal === 0) return 0;
    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  // --- Smoothed EAR (rolling average) ---
  function getSmoothedEAR(currentEAR) {
    earHistory.push(currentEAR);
    if (earHistory.length > SMOOTHING_FRAMES) {
      earHistory.shift();
    }
    return earHistory.reduce(function (a, b) { return a + b; }, 0) / earHistory.length;
  }

  // --- Update UI state ---
  function setState(state, ear, elapsed) {
    earValue.textContent = 'EAR: ' + ear.toFixed(2);

    statusDot.className = 'status-indicator';
    cameraCard.className = 'camera-card';

    switch (state) {
      case 'open':
        statusDot.classList.add('open');
        cameraCard.classList.add('state-open');
        statusLabel.textContent = 'OPEN';
        statusLabel.style.color = 'var(--green)';
        progressBar.style.width = '0%';
        timerText.textContent = '0.0s / ' + CLOSED_THRESHOLD + '.0s';
        break;

      case 'closing':
        statusDot.classList.add('closing');
        cameraCard.classList.add('state-closing');
        statusLabel.textContent = 'CLOSED (' + elapsed.toFixed(1) + 's)';
        statusLabel.style.color = 'var(--orange)';
        progressBar.style.width = Math.min((elapsed / CLOSED_THRESHOLD) * 100, 100) + '%';
        timerText.textContent = elapsed.toFixed(1) + 's / ' + CLOSED_THRESHOLD + '.0s';
        break;

      case 'alarm':
        statusDot.classList.add('alarm');
        cameraCard.classList.add('state-alarm');
        statusLabel.textContent = 'WAKE UP! (' + elapsed.toFixed(1) + 's)';
        statusLabel.style.color = 'var(--red)';
        progressBar.style.width = '100%';
        timerText.textContent = elapsed.toFixed(1) + 's / ' + CLOSED_THRESHOLD + '.0s';
        break;

      default:
        statusLabel.textContent = 'Waiting...';
        statusLabel.style.color = 'var(--text-secondary)';
        progressBar.style.width = '0%';
    }
  }

  // --- Draw eye contour on canvas ---
  function drawEyeContour(landmarks, eyeIndices, color) {
    ctx.beginPath();
    for (var i = 0; i < eyeIndices.length; i++) {
      var pt = landmarks[eyeIndices[i]];
      var x = pt.x * canvas.width;
      var y = pt.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // --- MediaPipe Face Mesh result handler ---
  function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      noFaceBadge.classList.remove('hidden');
      return;
    }

    noFaceBadge.classList.add('hidden');
    var landmarks = results.multiFaceLandmarks[0];

    // Compute EAR for both eyes
    var leftEAR = computeEAR(landmarks, LEFT_EYE);
    var rightEAR = computeEAR(landmarks, RIGHT_EYE);
    var avgEAR = (leftEAR + rightEAR) / 2.0;
    var smoothedEAR = getSmoothedEAR(avgEAR);

    // Draw eye contours
    var eyeColor = smoothedEAR > EAR_THRESHOLD ? '#00e676' : '#ff1744';
    drawEyeContour(landmarks, LEFT_EYE, eyeColor);
    drawEyeContour(landmarks, RIGHT_EYE, eyeColor);

    // --- Drowsiness detection logic ---
    if (smoothedEAR <= EAR_THRESHOLD) {
      // Eyes closed
      if (eyesClosedStart === null) {
        eyesClosedStart = Date.now();
      }

      var elapsed = (Date.now() - eyesClosedStart) / 1000;

      if (elapsed >= CLOSED_THRESHOLD) {
        // ALARM STATE
        setState('alarm', smoothedEAR, elapsed);
        if (!alarmPlaying) {
          alarmAudio.currentTime = 0;
          alarmAudio.play().catch(function (e) {
            console.warn('Audio play failed:', e);
          });
          alarmPlaying = true;
        }
      } else {
        // CLOSING STATE (timer counting)
        setState('closing', smoothedEAR, elapsed);
      }
    } else {
      // Eyes open — reset everything
      eyesClosedStart = null;
      earHistory = [];
      setState('open', smoothedEAR, 0);

      if (alarmPlaying) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        alarmPlaying = false;
      }
    }
  }

  // --- Main init (called after start button click) ---
  async function init() {
    try {
      // Unlock audio with a silent play (user gesture context)
      alarmAudio.volume = 0;
      await alarmAudio.play().catch(function () {});
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio.volume = 1;

      // Request camera
      var stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      video.srcObject = stream;
      await video.play();

      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Initialize MediaPipe Face Mesh
      var faceMesh = new FaceMesh({
        locateFile: function (file) {
          return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(onResults);

      // Start camera loop
      var camera = new Camera(video, {
        onFrame: async function () {
          await faceMesh.send({ image: video });
        },
        width: 640,
        height: 480
      });

      await camera.start();

      // Hide loading
      loadingOverlay.classList.add('hidden');

    } catch (err) {
      console.error('Init error:', err);
      loadingOverlay.classList.add('hidden');
      errorState.classList.remove('hidden');

      if (err.name === 'NotAllowedError') {
        errorText.textContent = 'Camera access denied. Please allow camera access and refresh.';
      } else if (err.name === 'NotFoundError') {
        errorText.textContent = 'No camera found. Please connect a webcam and refresh.';
      } else {
        errorText.textContent = 'Error: ' + err.message;
      }
    }
  }

  // --- Start button handler ---
  startBtn.addEventListener('click', function () {
    // Fade out the start overlay
    startOverlay.classList.add('fade-out');

    // Wait for fade animation, then init
    setTimeout(function () {
      startOverlay.style.display = 'none';
      init();
    }, 500);
  });

  // --- Keyboard shortcut ---
  document.addEventListener('keydown', function (e) {
    if (e.key === 'q' || e.key === 'Q') {
      if (alarmPlaying) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
      }
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(function (track) { track.stop(); });
      }
      document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#8888a0;font-family:Inter,sans-serif;">Detection stopped. Close this tab.</div>';
    }
  });

})();
