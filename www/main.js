// ============ GLOBAL ELEMENTS ============

const video = document.getElementById('camera');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');

const laneStatusEl = document.getElementById('lane-status');
const offsetStatusEl = document.getElementById('offset-status');
const collisionStatusEl = document.getElementById('collision-status');
const fpsStatusEl = document.getElementById('fps-status');

const startBtn = document.getElementById('start-btn');
const recordBtn = document.getElementById('record-btn');
const stopBtn = document.getElementById('stop-btn');
const settingsBtn = document.getElementById('settings-btn');

const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const settingsSaveBtn = document.getElementById('settings-save-btn');

const perfProfileSelect = document.getElementById('perf-profile');
const resolutionSelect = document.getElementById('resolution');
const cameraFovInput = document.getElementById('camera-fov');
const carHeightInput = document.getElementById('car-height');
const laneAssistCheckbox = document.getElementById('lane-assist-enabled');
const collisionWarningCheckbox = document.getElementById('collision-warning-enabled');
const beepCheckbox = document.getElementById('beep-enabled');
const detectionCheckbox = document.getElementById('detection-enabled');
const debugCheckbox = document.getElementById('debug-enabled');

const laneCalibrateBtn = document.getElementById('lane-calibrate-btn');
const laneCalibrationDisplay = document.getElementById('lane-calibration-display');

const distanceKnownInput = document.getElementById('distance-known');
const distanceCalibrateBtn = document.getElementById('distance-calibrate-btn');
const distanceCalibrationDisplay = document.getElementById('distance-calibration-display');

const testBeepBtn = document.getElementById('test-beep-btn');
const testHighRiskBtn = document.getElementById('test-high-risk-btn');

const beepAudio = document.getElementById('beep-audio');

// Offscreen canvas
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// Camera & recording state
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let animationFrameId = null;

// CV model state
let cvReady = false;
let detectionModel = null;
let modelReady = false;
let detecting = false;

// Analysis state
let latestAnalysis = {
  laneIndex: 1,
  laneOffsetRatio: 0,
  rawLaneOffsetRatio: 0,
  collisionRisk: 'LOW',
  distanceMeters: Infinity,
  vehicles: [],
  leftLane: null,
  rightLane: null,
  roiPoints: null
};

// FPS tracking
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

// Warning beep throttling
let lastBeepTime = 0;
const BEEP_COOLDOWN_MS = 1500;

// ============ SETTINGS ============

const SETTINGS_KEY = 'dashcamAssistSettings';

const defaultSettings = {
  perfProfile: 'medium', // high, medium, low
  resolution: '720p', // 1080p, 720p, 480p
  cameraFovDeg: 50,
  carHeightMeters: 1.5,
  laneAssistEnabled: true,
  collisionWarningEnabled: true,
  beepEnabled: true,
  detectionEnabled: true,
  debugOverlaysEnabled: false,
  laneOffsetBias: 0 // raw lane offset considered "center"
};

let settings = loadSettings();

// detection interval based on performance profile
function getDetectionIntervalFrames() {
  switch (settings.perfProfile) {
    case 'high':
      return 4;
    case 'low':
      return 14;
    case 'medium':
    default:
      return 8;
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch (err) {
    console.warn('Failed to load settings, using defaults', err);
    return { ...defaultSettings };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings', err);
  }
}

// Apply settings to UI controls
function populateSettingsUI() {
  perfProfileSelect.value = settings.perfProfile;
  resolutionSelect.value = settings.resolution;
  cameraFovInput.value = settings.cameraFovDeg.toString();
  carHeightInput.value = settings.carHeightMeters.toFixed(2);
  laneAssistCheckbox.checked = settings.laneAssistEnabled;
  collisionWarningCheckbox.checked = settings.collisionWarningEnabled;
  beepCheckbox.checked = settings.beepEnabled;
  detectionCheckbox.checked = settings.detectionEnabled;
  debugCheckbox.checked = settings.debugOverlaysEnabled;

  laneCalibrationDisplay.textContent =
    `Current lane center bias: ${(settings.laneOffsetBias * 100).toFixed(1)}%`;

  distanceCalibrationDisplay.textContent =
    `Effective vehicle height: ${settings.carHeightMeters.toFixed(2)} m`;
}

// Read settings from UI controls
function readSettingsFromUI() {
  settings.perfProfile = perfProfileSelect.value;
  settings.resolution = resolutionSelect.value;

  const fovVal = parseFloat(cameraFovInput.value);
  if (isFinite(fovVal) && fovVal >= 30 && fovVal <= 90) {
    settings.cameraFovDeg = fovVal;
  }

  const carHVal = parseFloat(carHeightInput.value);
  if (isFinite(carHVal) && carHVal >= 1.0 && carHVal <= 3.0) {
    settings.carHeightMeters = carHVal;
  }

  settings.laneAssistEnabled = laneAssistCheckbox.checked;
  settings.collisionWarningEnabled = collisionWarningCheckbox.checked;
  settings.beepEnabled = beepCheckbox.checked;
  settings.detectionEnabled = detectionCheckbox.checked;
  settings.debugOverlaysEnabled = debugCheckbox.checked;

  saveSettings();
  populateSettingsUI();
}

// ============ LIB INITIALIZATION ============

// OpenCV.js ready
if (window.cv) {
  cv['onRuntimeInitialized'] = () => {
    cvReady = true;
    console.log('OpenCV.js ready');
  };
} else {
  console.warn('OpenCV.js not found, lane detection disabled');
}

// COCO-SSD model
async function loadDetectionModel() {
  if (!window.cocoSsd) {
    console.warn('COCO-SSD not found, vehicle detection disabled');
    return;
  }
  try {
    detectionModel = await cocoSsd.load();
    modelReady = true;
    console.log('COCO-SSD model loaded');
  } catch (err) {
    console.error('Error loading detection model:', err);
  }
}
loadDetectionModel();

// ============ CAMERA SETUP ============

function getResolutionConstraints() {
  switch (settings.resolution) {
    case '1080p':
      return { width: { ideal: 1920 }, height: { ideal: 1080 } };
    case '480p':
      return { width: { ideal: 854 }, height: { ideal: 480 } };
    case '720p':
    default:
      return { width: { ideal: 1280 }, height: { ideal: 720 } };
  }
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Camera not supported on this device/browser.');
    return;
  }

  const res = getResolutionConstraints();

  let localStream = null;

  try {
    // Prefer back camera with ideal facingMode
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        ...res,
        facingMode: { ideal: 'environment' }
      },
      audio: false
    });
  } catch (err1) {
    console.warn('getUserMedia with environment facingMode failed, retrying without it…', err1);

    try {
      // Fallback for browsers that don't like facingMode constraints
      localStream = await navigator.mediaDevices.getUserMedia({
        video: res,
        audio: false
      });
    } catch (err2) {
      console.error('Error starting camera:', err2);

      if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
        alert(
          'Camera access was denied.\n\n' +
          'On iOS: Settings > Safari > Camera > Allow.\n' +
          'On Android/Chrome: check Site settings and allow camera for this site.'
        );
      } else if (err2.name === 'NotFoundError' || err2.name === 'OverconstrainedError') {
        alert('No suitable camera was found on this device.');
      } else {
        alert('Could not access camera. Error: ' + err2.name);
      }
      return;
    }
  }

  stream = localStream;

  try {
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      // Important for mobile: call play() in the user gesture chain
      const playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((err) => {
          console.warn('Video play was blocked by the browser:', err);
        });
      }

      resizeCanvases();
      startAnalysisLoop();
    };

    recordBtn.disabled = false;
    stopBtn.disabled = false;
    startBtn.disabled = true;
  } catch (err) {
    console.error('Error attaching camera stream:', err);
    alert('Camera started but could not attach video element.');
  }
}

function resizeCanvases() {
  const width = video.videoWidth || window.innerWidth;
  const height = video.videoHeight || window.innerHeight;

  overlay.width = width;
  overlay.height = height;

  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
}

window.addEventListener('resize', () => {
  if (video.videoWidth) {
    resizeCanvases();
  }
});

// ============ MAIN ANALYSIS LOOP ============

function startAnalysisLoop() {
  const detectionIntervalFrames = getDetectionIntervalFrames();

  const loop = () => {
    if (!video.videoWidth || !video.videoHeight) {
      animationFrameId = requestAnimationFrame(loop);
      return;
    }

    // FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
      fps = (frameCount * 1000) / (now - lastFpsUpdate);
      frameCount = 0;
      lastFpsUpdate = now;
      fpsStatusEl.textContent = `FPS: ${fps.toFixed(1)}`;
    }

    // Draw frame to offscreen canvas
    offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Lane detection
    if (cvReady && settings.laneAssistEnabled) {
      try {
        const laneInfo = detectLanesWithOpenCV(offscreenCanvas);
        latestAnalysis.rawLaneOffsetRatio = laneInfo.laneOffsetRatio;
        latestAnalysis.laneOffsetRatio =
          laneInfo.laneOffsetRatio - (settings.laneOffsetBias || 0);
        latestAnalysis.laneIndex = laneInfo.laneIndex;
        latestAnalysis.leftLane = laneInfo.leftLane;
        latestAnalysis.rightLane = laneInfo.rightLane;
        latestAnalysis.roiPoints = laneInfo.roiPoints;
      } catch (err) {
        console.error('Lane detection error:', err);
      }
    } else {
      latestAnalysis.leftLane = null;
      latestAnalysis.rightLane = null;
      latestAnalysis.roiPoints = null;
    }

    // Vehicle detection
    if (
      settings.detectionEnabled &&
      modelReady &&
      !detecting &&
      frameCount % detectionIntervalFrames === 0
    ) {
      detecting = true;
      runVehicleDetection(offscreenCanvas, settings)
        .then((vehInfo) => {
          latestAnalysis.vehicles = vehInfo.vehicles;
          latestAnalysis.distanceMeters = vehInfo.distanceMeters;
          latestAnalysis.collisionRisk = vehInfo.collisionRisk;
        })
        .catch((err) => console.error('Detection error:', err))
        .finally(() => {
          detecting = false;
        });
    }

    // Draw overlay with latest analysis
    drawOverlay(latestAnalysis, settings);

    animationFrameId = requestAnimationFrame(loop);
  };

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  loop();
}

// ============ LANE DETECTION (OpenCV) ============

function detectLanesWithOpenCV(canvas) {
  const width = canvas.width;
  const height = canvas.height;

  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
  const maskedEdges = new cv.Mat();
  const lines = new cv.Mat();

  try {
    // 1. Grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    // 2. Blur
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

    // 3. Canny edges
    cv.Canny(blurred, edges, 50, 150, 3, false);

    // 4. ROI mask (trapezoid near bottom)
    const bottomY = height - 5;
    const roiCoords = [
      Math.floor(width * 0.1), bottomY,
      Math.floor(width * 0.4), Math.floor(height * 0.6),
      Math.floor(width * 0.6), Math.floor(height * 0.6),
      Math.floor(width * 0.9), bottomY
    ];

    const points = cv.matFromArray(4, 1, cv.CV_32SC2, roiCoords);
    const contours = new cv.MatVector();
    contours.push_back(points);
    cv.fillPoly(mask, contours, new cv.Scalar(255, 255, 255, 255));

    cv.bitwise_and(edges, mask, maskedEdges);

    // 5. Hough transform
    cv.HoughLinesP(
      maskedEdges,
      lines,
      1,
      Math.PI / 180,
      50,
      40,
      100
    );

    const leftLines = [];
    const rightLines = [];

    for (let i = 0; i < lines.rows; i++) {
      const x1 = lines.data32S[i * 4];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const dx = x2 - x1;
      const dy = y2 - y1;
      if (dx === 0) continue;

      const slope = dy / dx;
      if (Math.abs(slope) < 0.3) continue; // ignore nearly horizontal lines

      const line = { x1, y1, x2, y2, slope };
      if (slope < 0) leftLines.push(line);
      else rightLines.push(line);
    }

    const leftLane = averageLaneLine(leftLines, height);
    const rightLane = averageLaneLine(rightLines, height);

    const imageCenterX = width / 2;
    let laneCenterX = imageCenterX;

    if (leftLane && rightLane) {
      const bottomY = height;
      const leftX = interpolateXAtY(leftLane, bottomY);
      const rightX = interpolateXAtY(rightLane, bottomY);
      laneCenterX = (leftX + rightX) / 2;
    } else if (leftLane) {
      const bottomY = height;
      const leftX = interpolateXAtY(leftLane, bottomY);
      laneCenterX = leftX + width * 0.15;
    } else if (rightLane) {
      const bottomY = height;
      const rightX = interpolateXAtY(rightLane, bottomY);
      laneCenterX = rightX - width * 0.15;
    }

    const offsetPixels = laneCenterX - imageCenterX;
    const laneOffsetRatio = offsetPixels / (width / 2);

    let laneIndex = 1;
    if (laneOffsetRatio < -0.2) laneIndex = 0;
    if (laneOffsetRatio > 0.2) laneIndex = 2;

    const roiPoints = roiCoords; // [x1,y1,x2,y2,x3,y3,x4,y4]

    return { laneIndex, laneOffsetRatio, leftLane, rightLane, roiPoints };
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    mask.delete();
    maskedEdges.delete();
    lines.delete();
  }
}

function averageLaneLine(lines, height) {
  if (!lines.length) return null;

  let sumSlope = 0;
  let sumIntercept = 0;
  let count = 0;

  for (const l of lines) {
    const { x1, y1, slope } = l;
    const intercept = y1 - slope * x1;
    sumSlope += slope;
    sumIntercept += intercept;
    count++;
  }

  const slopeAvg = sumSlope / count;
  const interceptAvg = sumIntercept / count;

  const y1 = height;
  const y2 = Math.floor(height * 0.6);
  const x1 = (y1 - interceptAvg) / slopeAvg;
  const x2 = (y2 - interceptAvg) / slopeAvg;

  return { x1, y1, x2, y2, slope: slopeAvg, intercept: interceptAvg };
}

function interpolateXAtY(line, y) {
  return (y - line.intercept) / line.slope;
}

// ============ VEHICLE DETECTION & COLLISION ============

async function runVehicleDetection(canvas, settings) {
  const width = canvas.width;
  const height = canvas.height;

  if (!detectionModel) {
    return {
      vehicles: [],
      distanceMeters: Infinity,
      collisionRisk: 'LOW'
    };
  }

  const predictions = await detectionModel.detect(canvas);
  const vehicleClasses = ['car', 'truck', 'bus', 'motorcycle'];
  const vehicles = [];

  // FOV -> focal length in pixels (vertical)
  const fovRad = (settings.cameraFovDeg * Math.PI) / 180;
  const focalPx = (height / 2) / Math.tan(fovRad / 2);

  let minDistance = Infinity;

  for (const pred of predictions) {
    if (!vehicleClasses.includes(pred.class)) continue;
    if (pred.score < 0.4) continue;

    const [x, y, w, h] = pred.bbox;
    vehicles.push({
      x,
      y,
      width: w,
      height: h,
      score: pred.score,
      class: pred.class
    });

    if (h <= 0) continue;

    // Pinhole model:
    // distance = (real_height * focal_px) / image_height_px
    const approxDistance =
      (settings.carHeightMeters * focalPx) / h;

    if (approxDistance < minDistance) {
      minDistance = approxDistance;
    }
  }

  let risk = 'LOW';
  if (minDistance < 25) risk = 'MEDIUM';
  if (minDistance < 15) risk = 'HIGH';

  return {
    vehicles,
    distanceMeters: isFinite(minDistance) ? minDistance : Infinity,
    collisionRisk: risk
  };
}

// ============ OVERLAY DRAWING ============

function drawOverlay(analysis, settings) {
  const { width, height } = overlay;
  overlayCtx.clearRect(0, 0, width, height);

  const {
    laneIndex,
    laneOffsetRatio,
    rawLaneOffsetRatio,
    collisionRisk,
    distanceMeters,
    vehicles,
    leftLane,
    rightLane,
    roiPoints
  } = analysis;

  // Road shading
  overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  overlayCtx.fillRect(0, height * 0.4, width, height * 0.6);

  // Debug ROI overlay
  if (settings.debugOverlaysEnabled && roiPoints && roiPoints.length === 8) {
    overlayCtx.strokeStyle = 'rgba(96,165,250,0.8)';
    overlayCtx.lineWidth = 2;
    overlayCtx.setLineDash([6, 4]);

    overlayCtx.beginPath();
    overlayCtx.moveTo(roiPoints[0], roiPoints[1]);
    overlayCtx.lineTo(roiPoints[2], roiPoints[3]);
    overlayCtx.lineTo(roiPoints[4], roiPoints[5]);
    overlayCtx.lineTo(roiPoints[6], roiPoints[7]);
    overlayCtx.closePath();
    overlayCtx.stroke();

    overlayCtx.setLineDash([]);

    overlayCtx.font = '12px system-ui';
    overlayCtx.fillStyle = 'rgba(15,23,42,0.7)';
    overlayCtx.fillRect(10, 10, 120, 32);
    overlayCtx.fillStyle = '#e5e7eb';
    overlayCtx.fillText('DEBUG ROI', 18, 28);
  }

  // Lane lines
  if (settings.laneAssistEnabled) {
    overlayCtx.lineWidth = 4;
    overlayCtx.setLineDash([16, 12]);

    if (leftLane) {
      overlayCtx.strokeStyle = 'rgba(156,163,175,0.9)';
      overlayCtx.beginPath();
      overlayCtx.moveTo(leftLane.x1, leftLane.y1);
      overlayCtx.lineTo(leftLane.x2, leftLane.y2);
      overlayCtx.stroke();
    }

    if (rightLane) {
      overlayCtx.strokeStyle = 'rgba(156,163,175,0.9)';
      overlayCtx.beginPath();
      overlayCtx.moveTo(rightLane.x1, rightLane.y1);
      overlayCtx.lineTo(rightLane.x2, rightLane.y2);
      overlayCtx.stroke();
    }

    overlayCtx.setLineDash([]);

    // Lane center line (after bias)
    const laneCenterX = width / 2 + laneOffsetRatio * (width / 2);
    overlayCtx.strokeStyle = 'rgba(56,189,248,0.9)';
    overlayCtx.lineWidth = 3;
    overlayCtx.beginPath();
    overlayCtx.moveTo(laneCenterX, height * 0.55);
    overlayCtx.lineTo(laneCenterX, height);
    overlayCtx.stroke();
  }

  // Vehicles
  if (settings.detectionEnabled) {
    for (const v of vehicles) {
      const riskColor = v.score > 0.7 ? 'rgba(239,68,68,0.9)' : 'rgba(234,179,8,0.9)';
      overlayCtx.strokeStyle = riskColor;
      overlayCtx.lineWidth = 3;
      overlayCtx.strokeRect(v.x, v.y, v.width, v.height);

      overlayCtx.font = '14px system-ui';
      overlayCtx.fillStyle = 'rgba(0,0,0,0.7)';
      overlayCtx.fillRect(v.x, v.y - 18, v.width, 18);
      overlayCtx.fillStyle = '#fff';
      overlayCtx.textAlign = 'left';
      overlayCtx.fillText(
        `${v.class} ${(v.score * 100).toFixed(0)}%`,
        v.x + 4,
        v.y - 4
      );
    }
  }

  // Collision risk banner
  if (settings.collisionWarningEnabled) {
    let color = '#22c55e';
    if (collisionRisk === 'MEDIUM') color = '#eab308';
    if (collisionRisk === 'HIGH') color = '#ef4444';

    overlayCtx.fillStyle = color;
    overlayCtx.strokeStyle = 'rgba(0,0,0,0.8)';
    overlayCtx.lineWidth = 2;

    const label = `${collisionRisk} RISK`;
    const distanceLabel = isFinite(distanceMeters)
      ? `${distanceMeters.toFixed(1)} m`
      : '∞ m';

    overlayCtx.font = 'bold 24px system-ui';
    overlayCtx.textAlign = 'center';

    const centerX = width / 2;
    const centerY = height * 0.12;
    const padding = 12;
    const textWidth = overlayCtx.measureText(label).width;

    overlayCtx.fillRect(
      centerX - textWidth / 2 - padding,
      centerY - 28,
      textWidth + padding * 2,
      40
    );
    overlayCtx.strokeRect(
      centerX - textWidth / 2 - padding,
      centerY - 28,
      textWidth + padding * 2,
      40
    );

    overlayCtx.fillStyle = '#000';
    overlayCtx.fillText(label, centerX, centerY);

    overlayCtx.font = 'normal 16px system-ui';
    overlayCtx.fillText(distanceLabel, centerX, centerY + 22);
  }

  // HUD text
  const laneText = laneIndex === 0 ? 'Left' : laneIndex === 1 ? 'Center' : 'Right';
  laneStatusEl.textContent = settings.laneAssistEnabled
    ? `Lane: ${laneText}`
    : 'Lane: Off';

  offsetStatusEl.textContent = settings.laneAssistEnabled
    ? `Offset: ${(laneOffsetRatio * 100).toFixed(0)}% (raw ${(rawLaneOffsetRatio * 100).toFixed(0)}%)`
    : 'Offset: —';

  const collisionText = settings.collisionWarningEnabled
    ? `Collision: ${collisionRisk}${
        isFinite(distanceMeters) ? ` (${distanceMeters.toFixed(1)} m)` : ''
      }`
    : 'Collision: Off';

  collisionStatusEl.textContent = collisionText;

  collisionStatusEl.classList.remove('status-low', 'status-medium', 'status-high');
  if (collisionRisk === 'LOW') collisionStatusEl.classList.add('status-low');
  if (collisionRisk === 'MEDIUM') collisionStatusEl.classList.add('status-medium');
  if (collisionRisk === 'HIGH') collisionStatusEl.classList.add('status-high');

  // Warnings
  handleWarnings(laneOffsetRatio, collisionRisk, settings);
}

// ============ WARNINGS (BEEPS) ============

function handleWarnings(laneOffsetRatio, collisionRisk, settings) {
  if (!settings.beepEnabled) return;

  const now = performance.now();
  const laneDrift = settings.laneAssistEnabled && Math.abs(laneOffsetRatio) > 0.4;
  const highCollision =
    settings.collisionWarningEnabled && collisionRisk === 'HIGH';

  if ((laneDrift || highCollision) && now - lastBeepTime > BEEP_COOLDOWN_MS) {
    lastBeepTime = now;
    try {
      beepAudio.currentTime = 0;
      beepAudio.play().catch(() => {});
    } catch (err) {
      console.warn('Beep failed:', err);
    }
  }
}

// ============ RECORDING ============

function toggleRecording() {
  if (!stream) return;

  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `dashcam-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    recordBtn.textContent = 'Recording…';
    recordBtn.classList.add('recording');
  } else if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordBtn.textContent = 'Start Recording';
    recordBtn.classList.remove('recording');
  }
}

async function checkCameraPermission() {
  if (!navigator.permissions || !navigator.permissions.query) return;

  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    console.log('Camera permission state:', status.state);

    if (status.state === 'denied') {
      alert(
        'Camera permission is currently blocked for this site.\n' +
        'Please enable camera access in your browser settings.'
      );
    }

    status.onchange = () => {
      console.log('Camera permission changed to:', status.state);
    };
  } catch (e) {
    // Not supported on some browsers (e.g., iOS Safari) – safe to ignore
  }
}


function stopAll() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  video.srcObject = null;
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  startBtn.disabled = false;
  recordBtn.disabled = true;
  stopBtn.disabled = true;

  laneStatusEl.textContent = 'Lane: —';
  offsetStatusEl.textContent = 'Offset: —';
  collisionStatusEl.textContent = 'Collision: —';
  fpsStatusEl.textContent = 'FPS: —';
}

// ============ CALIBRATION FUNCTIONS ============

function calibrateLaneCenter() {
  if (!settings.laneAssistEnabled) {
    alert('Enable lane assist first, then calibrate while centered in your lane.');
    return;
  }

  const raw = latestAnalysis.rawLaneOffsetRatio;
  if (!isFinite(raw)) {
    alert('No lane detection data yet. Start driving with clear lane lines visible.');
    return;
  }

  settings.laneOffsetBias = raw;
  saveSettings();
  populateSettingsUI();
  alert('Lane center calibrated. Offsets will now be measured relative to this.');
}

function calibrateDistanceFromDetection() {
  const knownDist = parseFloat(distanceKnownInput.value);
  if (!isFinite(knownDist) || knownDist <= 0) {
    alert('Enter a valid known distance in meters.');
    return;
  }

  if (!latestAnalysis.vehicles || latestAnalysis.vehicles.length === 0) {
    alert('No vehicle detected. Make sure a car is clearly visible and detection is enabled.');
    return;
  }

  const height = overlay.height || offscreenCanvas.height;
  if (!height) {
    alert('No video frame size yet. Ensure camera is running.');
    return;
  }

  const tallestVehicle = latestAnalysis.vehicles.reduce((max, v) =>
    v.height > max.height ? v : max
  );

  const bboxHeightPx = tallestVehicle.height;
  if (bboxHeightPx <= 0) {
    alert('Detected vehicle height is invalid for calibration.');
    return;
  }

  const fovRad = (settings.cameraFovDeg * Math.PI) / 180;
  const focalPx = (height / 2) / Math.tan(fovRad / 2);

  // Solve for effective carHeightMeters:
  // knownDist = (carHeightMeters * focalPx) / bboxHeightPx
  // => carHeightMeters = knownDist * bboxHeightPx / focalPx
  const newCarHeight = (knownDist * bboxHeightPx) / focalPx;

  if (!isFinite(newCarHeight) || newCarHeight <= 0) {
    alert('Calibration failed due to invalid computed height.');
    return;
  }

  settings.carHeightMeters = newCarHeight;
  saveSettings();
  populateSettingsUI();

  alert(
    `Distance calibration updated.\n` +
    `Effective vehicle height is now ${newCarHeight.toFixed(2)} m.`
  );
}

// ============ SETTINGS PANEL UI ============

function openSettings() {
  populateSettingsUI();
  settingsBackdrop.classList.remove('hidden');
}

function closeSettings() {
  settingsBackdrop.classList.add('hidden');
}

// ============ TEST HELPERS ============

function testBeep() {
  try {
    beepAudio.currentTime = 0;
    beepAudio.play().catch(() => {});
  } catch (err) {
    console.warn('Test beep failed:', err);
  }
}

function simulateHighRisk() {
  latestAnalysis.collisionRisk = 'HIGH';
  latestAnalysis.distanceMeters = 8;
  drawOverlay(latestAnalysis, settings);
  handleWarnings(latestAnalysis.laneOffsetRatio, 'HIGH', settings);
}

// ============ EVENT BINDINGS ============

startBtn.addEventListener('click', startCamera);
recordBtn.addEventListener('click', toggleRecording);
stopBtn.addEventListener('click', stopAll);
settingsBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', closeSettings);

settingsSaveBtn.addEventListener('click', () => {
  readSettingsFromUI();
  closeSettings();

  // Re-apply camera settings if already running
  if (stream) {
    stopAll();
    startCamera();
  }
});

settingsBackdrop.addEventListener('click', (e) => {
  if (e.target === settingsBackdrop) closeSettings();
});

laneCalibrateBtn.addEventListener('click', calibrateLaneCenter);
distanceCalibrateBtn.addEventListener('click', calibrateDistanceFromDetection);

testBeepBtn.addEventListener('click', testBeep);
testHighRiskBtn.addEventListener('click', simulateHighRisk);

// Initialize UI with current settings
populateSettingsUI();

// Optional: check permission state (where supported)
checkCameraPermission();
