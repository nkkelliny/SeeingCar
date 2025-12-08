# SeeingCar – Dashcam Assist

# 

# !\[Build Status: passing](https://img.shields.io/badge/build-passing-brightgreen.svg) !\[Version 0.1.0](https://img.shields.io/badge/version-0.1.0-blue.svg) !\[Platform: Web](https://img.shields.io/badge/platform-web%20browser-lightgrey.svg)

# 

# \*\*SeeingCar\*\* is an experimental, browser-based dashcam assist application that runs entirely in the web browser using \*\*HTML\*\*, \*\*CSS\*\*, and \*\*JavaScript\*\*. It uses \*\*OpenCV.js\*\* for lane detection, \*\*TensorFlow.js\*\* + \*\*COCO-SSD\*\* for vehicle detection, and the device camera via `getUserMedia` to provide:

# 

# \*   Real-time lane assist (lane lines + lane center offset)

# \*   Experimental collision risk estimation based on detected vehicles and distance

# \*   Audio warnings (beeps) for lane drift and high collision risk

# \*   Per-device calibration for lane center and distance model

# \*   On-device video recording to `.webm` (where supported)

# \*   A mobile-friendly HUD optimized for phone screens

# 

# \_SeeingCar is designed as a prototype / research and hobby tool for understanding lane detection and collision risk estimation in the browser. It is \*\*not\*\* a certified driver-assistance or safety system.\_

# 

# \*\*Safety Warning\*\*  

# This project is for educational and experimental purposes only. It is \*\*not\*\* intended for real-world safety-critical use. Always keep full control of your vehicle and never rely on SeeingCar for driving decisions.

# 

# \* \* \*

# 

# Files in This Application

# -------------------------

# 

# \*   `index.html` – Main HTML entry point:

# &nbsp;   \*   Defines the camera video element (`<video id="camera">`) and overlay canvas.

# &nbsp;   \*   Includes the bottom HUD showing lane, offset, collision status, and FPS.

# &nbsp;   \*   Contains the \*\*Settings \& Calibration\*\* bottom sheet for performance, features, and calibration.

# &nbsp;   \*   Loads:

# &nbsp;       \*   \*\*OpenCV.js\*\* (from the official CDN) – lane detection pipeline.

# &nbsp;       \*   \*\*TensorFlow.js\*\* and \*\*COCO-SSD\*\* – vehicle detection model.

# &nbsp;       \*   `main.js` – core logic and analysis loop.

# &nbsp;       \*   `style.css` – layout and visual styling.

# &nbsp;   \*   Includes an inline top-left \*\*SeeingCar\*\* logo (camera+car hybrid icon + text) in the UI.

# \*   `style.css` – Global styles and HUD layout:

# &nbsp;   \*   Defines full-screen camera layout via a container `#app` with `position: relative`.

# &nbsp;   \*   Styles the camera video (`#camera`) and overlay canvas (`#overlay`) to cover the screen.

# &nbsp;   \*   Implements the bottom \*\*HUD\*\*:

# &nbsp;       \*   Status rows for lane, offset, collision, and FPS.

# &nbsp;       \*   Button row for \_Start Camera\_, \_Start Recording\_, \_Settings\_, and \_Stop\_.

# &nbsp;   \*   Styles collision text with `.status-low`, `.status-medium`, and `.status-high` classes.

# &nbsp;   \*   Implements the \*\*Settings \& Calibration\*\* bottom sheet:

# &nbsp;       \*   Backdrop (`.settings-backdrop`) with blur-like overlay.

# &nbsp;       \*   Panel layout, header, scrollable body, and footer.

# &nbsp;       \*   Forms for FOV, car height, toggles, calibration and test buttons.

# &nbsp;   \*   Defines the \*\*SeeingCar brand/logo\*\* styles:

# &nbsp;       \*   `.brand` – pill-shaped container with blurred dark background.

# &nbsp;       \*   `.brand-icon` – wraps an inline SVG camera+car icon.

# &nbsp;       \*   `.brand-text` – "SeeingCar" text styling.

# \*   `main.js` – Core application logic:

# &nbsp;   \*   \*\*Global elements \& state\*\*:

# &nbsp;       \*   Selects DOM elements (video, canvas, HUD spans, buttons, settings controls, audio element).

# &nbsp;       \*   Creates an offscreen canvas used as the working OpenCV/TensorFlow frame buffer.

# &nbsp;       \*   Tracks current camera stream, MediaRecorder, recorded chunks, and animation frame ID.

# &nbsp;       \*   Maintains latest analysis (lane index, lane offset, collision risk, distance, vehicles, lane lines, ROI).

# &nbsp;       \*   Tracks FPS and beep cooldown state.

# &nbsp;   \*   \*\*Settings management\*\*:

# &nbsp;       \*   Stores settings in `localStorage` under `dashcamAssistSettings`.

# &nbsp;       \*   Settings include:

# &nbsp;           \*   `perfProfile` – high / medium / low (affects detection interval).

# &nbsp;           \*   `resolution` – 1080p / 720p / 480p.

# &nbsp;           \*   `cameraFovDeg` – vertical FOV in degrees.

# &nbsp;           \*   `carHeightMeters` – effective reference height of vehicles for distance estimation.

# &nbsp;           \*   `laneAssistEnabled`, `collisionWarningEnabled`, `detectionEnabled`, `beepEnabled`.

# &nbsp;           \*   `debugOverlaysEnabled` – toggles ROI polygon in overlay.

# &nbsp;           \*   `laneOffsetBias` – calibration bias for lane center.

# &nbsp;       \*   `populateSettingsUI()` syncs settings to inputs.

# &nbsp;       \*   `readSettingsFromUI()` reads values, validates ranges, and persists them.

# &nbsp;   \*   \*\*Library initialization\*\*:

# &nbsp;       \*   Waits for `OpenCV.js` runtime via `cv.onRuntimeInitialized`.

# &nbsp;       \*   Loads `cocoSsd` (COCO-SSD model) asynchronously and sets `modelReady = true` when done.

# &nbsp;   \*   \*\*Camera setup\*\*:

# &nbsp;       \*   `getResolutionConstraints()` returns recommended constraints for 1080p/720p/480p.

# &nbsp;       \*   `startCamera()`:

# &nbsp;           \*   Uses `navigator.mediaDevices.getUserMedia` with `facingMode: { ideal: 'environment' }` and fallback.

# &nbsp;           \*   Attaches stream to `video.srcObject`, starts playback, resizes canvases, and starts the analysis loop.

# &nbsp;           \*   Provides error handling for permission denied, missing camera, and non-secure context.

# &nbsp;       \*   `resizeCanvases()` syncs overlay and offscreen canvas size to the video dimensions.

# &nbsp;   \*   \*\*Main analysis loop\*\* (`startAnalysisLoop()`):

# &nbsp;       \*   Runs via `requestAnimationFrame`.

# &nbsp;       \*   Tracks FPS by counting frames and using `performance.now()`.

# &nbsp;       \*   Copies current video frame to offscreen canvas.

# &nbsp;       \*   Per frame:

# &nbsp;           \*   Performs lane detection via OpenCV (if enabled \& ready).

# &nbsp;           \*   Performs vehicle detection periodically based on performance profile and COCO-SSD model readiness.

# &nbsp;           \*   Updates `latestAnalysis` with lane and vehicle info.

# &nbsp;           \*   Redraws the overlay (lanes, boxes, banner, HUD text) via `drawOverlay()`.

# &nbsp;   \*   \*\*Lane detection (`detectLanesWithOpenCV()`)\*\*:

# &nbsp;       \*   Reads current frame into OpenCV Mats.

# &nbsp;       \*   Converts to grayscale, applies Gaussian blur, and runs Canny edge detection.

# &nbsp;       \*   Builds a trapezoidal Region of Interest (ROI) near the bottom of the image.

# &nbsp;       \*   Uses Hough Lines (Probabilistic) to find line segments in the ROI.

# &nbsp;       \*   Splits lines into left vs. right based on slope sign.

# &nbsp;       \*   Averages left and right lines to generate stable lane lines.

# &nbsp;       \*   Computes lane center and offset ratio relative to image center.

# &nbsp;       \*   Outputs `laneIndex` (left/center/right), `laneOffsetRatio`, lane lines, and ROI points.

# &nbsp;   \*   \*\*Vehicle detection \& collision risk (`runVehicleDetection()`)\*\*:

# &nbsp;       \*   Uses COCO-SSD (`cocoSsd.load()`) to detect objects in the frame.

# &nbsp;       \*   Filters predictions to vehicle-like classes: `car`, `truck`, `bus`, `motorcycle`.

# &nbsp;       \*   Uses a simple pinhole camera model to estimate distance: `distance = (real\_height\_m \* focal\_px) / bbox\_height\_px`.

# &nbsp;       \*   Computes a minimum estimated distance and classifies risk:

# &nbsp;           \*   `LOW` – distance >= 25m

# &nbsp;           \*   `MEDIUM` – 15m <= distance < 25m

# &nbsp;           \*   `HIGH` – distance < 15m

# &nbsp;   \*   \*\*Overlay drawing (`drawOverlay()`)\*\*:

# &nbsp;       \*   Clears overlay canvas, draws road shading, lane lines, lane center line, and ROI (if debug enabled).

# &nbsp;       \*   Renders bounding boxes and labels for detected vehicles.

# &nbsp;       \*   Shows a top-center collision risk banner with risk level and estimated distance.

# &nbsp;       \*   Updates HUD DOM text for lane, offset, collision, and FPS.

# &nbsp;       \*   Applies collision status color classes to the HUD text.

# &nbsp;       \*   Invokes `handleWarnings()` to emit beeps for lane drift or high risk.

# &nbsp;   \*   \*\*Warnings \& audio (`handleWarnings()`)\*\*:

# &nbsp;       \*   Checks if audio warnings are enabled.

# &nbsp;       \*   Triggers a beep when:

# &nbsp;           \*   Lane assist is enabled and absolute lane offset exceeds a threshold; or

# &nbsp;           \*   Collision risk is `HIGH` and collision warnings are enabled.

# &nbsp;       \*   Applies a cooldown (`BEEP\_COOLDOWN\_MS`) to avoid continuous beeping.

# &nbsp;   \*   \*\*Recording\*\*:

# &nbsp;       \*   `toggleRecording()` uses `MediaRecorder` to record the raw camera stream.

# &nbsp;       \*   Collects recorded chunks into a Blob and triggers a `.webm` download when recording stops.

# &nbsp;       \*   `stopAll()` stops analysis, recording, and camera tracks, and resets HUD text.

# &nbsp;   \*   \*\*Calibration\*\*:

# &nbsp;       \*   `calibrateLaneCenter()`:

# &nbsp;           \*   Uses the current raw lane offset while you are centered in the lane.

# &nbsp;           \*   Saves this as `laneOffsetBias` so that future offsets are measured relative to this “true center”.

# &nbsp;       \*   `calibrateDistanceFromDetection()`:

# &nbsp;           \*   Uses a known real-world distance and the bounding box height of a detected vehicle.

# &nbsp;           \*   Solves for an effective `carHeightMeters` that better fits your camera setup.

# &nbsp;   \*   \*\*Settings panel \& test helpers\*\*:

# &nbsp;       \*   `openSettings()` / `closeSettings()` – toggles bottom sheet visibility.

# &nbsp;       \*   `testBeep()` – triggers a sample beep sound for validation.

# &nbsp;       \*   `simulateHighRisk()` – forces a `HIGH` collision risk and redraws the overlay for UI testing.

# &nbsp;   \*   \*\*Event bindings\*\*:

# &nbsp;       \*   Binds `Start Camera`, `Stop`, `Start Recording`, `Settings`, calibration buttons, and test buttons to their respective handlers.

# &nbsp;       \*   Applies settings on Save and restarts the camera if already running.

# &nbsp;       \*   Initializes settings UI on page load.

# 

# \* \* \*

# 

# To Use

# ------

# 

# SeeingCar is a pure front-end web project. You can host it on any static web server, but to use the camera API on mobile devices, the page must be loaded over \*\*HTTPS\*\* (or `http://localhost` in development).

# 

# \### 1\\. Clone / Download this repository

# 

# &nbsp;   git clone https://github.com/your-username/seeingcar-dashcam.git

# &nbsp;   cd seeingcar-dashcam

# 

# \### 2\\. Install a simple static server (for local dev)

# 

# You can use any static server; for example, with Node.js installed:

# 

# &nbsp;   npm install -g serve

# 

# Then run:

# 

# &nbsp;   serve .

# 

# By default, `serve` will host the files on `http://localhost:3000`. For mobile testing, ensure you either:

# 

# \*   Use a secure tunnel (e.g., ngrok, Cloudflare Tunnel) to expose it as `https://...`, or

# \*   Run it directly on the device (e.g., via a local server app) so it is `http://localhost` on the phone.

# 

# \### 3\\. Open the app in a modern browser

# 

# Supported / tested environments:

# 

# \*   Desktop: Chrome, Firefox, Edge (latest) with webcam

# \*   Mobile:

# &nbsp;   \*   Android Chrome (via HTTPS)

# &nbsp;   \*   iOS Safari 11+ (via HTTPS)

# 

# \*\*Important:\*\* Do \_not\_ open the app in an embedded/in-app browser (e.g., inside Instagram, Facebook, or some email apps). Open the URL directly in Chrome or Safari so that the camera API is available.

# 

# \### 4\\. Start the camera

# 

# 1\.  Tap or click \*\*Start Camera\*\*.

# 2\.  Your browser will prompt you to allow camera access:

# &nbsp;   \*   Accept the permission prompt.

# &nbsp;   \*   If you accidentally denied it, update your browser’s site settings to allow camera access.

# 3\.  Once the camera is running, you should see your camera feed with an overlay. The HUD at the bottom will show lane, offset, collision status, and FPS.

# 

# \### 5\\. Optional: Recording

# 

# 1\.  With the camera running, click \*\*Start Recording\*\*.

# 2\.  The button text will change to “Recording…” and recording will begin.

# 3\.  Click the button again to stop recording.

# 4\.  The app will trigger a download of a `.webm` file (where supported by the browser).

# 

# \### 6\\. Settings \& Calibration

# 

# Click \*\*Settings\*\* to open the bottom sheet.

# 

# \*   \*\*Performance profile\*\* – choose High / Medium / Low:

# &nbsp;   \*   \_High\_ – more frequent detection, heavier CPU/GPU usage.

# &nbsp;   \*   \_Medium\_ – balanced (default).

# &nbsp;   \*   \_Low\_ – fewer detections, higher FPS on weaker devices.

# \*   \*\*Video resolution\*\* – 1080p / 720p / 480p:

# &nbsp;   \*   Higher resolution gives more detail at the cost of performance.

# &nbsp;   \*   720p is a good default for many devices.

# \*   \*\*Camera vertical FOV\*\* – approximate FOV in degrees:

# &nbsp;   \*   Used for the distance estimation model.

# &nbsp;   \*   Adjust if you know your device’s camera FOV; otherwise, the default (50°) works as a rough guess.

# \*   \*\*Typical vehicle height (m)\*\* – average height of vehicles in front:

# &nbsp;   \*   Used as the reference object for distance estimation.

# &nbsp;   \*   Can be refined through distance calibration.

# \*   \*\*Feature toggles\*\*:

# &nbsp;   \*   \_Enable lane assist\_ – toggles lane line and offset analysis.

# &nbsp;   \*   \_Enable collision warning\_ – toggles risk banner logic.

# &nbsp;   \*   \_Enable vehicle detection (COCO-SSD)\_ – toggles the ML detection model.

# &nbsp;   \*   \_Enable audio warnings\_ – toggles beep sounds.

# &nbsp;   \*   \_Show debug overlays\_ – shows ROI polygon and additional debug info in the overlay.

# \*   \*\*Lane center calibration\*\*:

# &nbsp;   \*   Enable lane assist and ensure lane lines are clearly visible.

# &nbsp;   \*   Drive centered in your lane.

# &nbsp;   \*   Tap \_Set current as center\_.

# &nbsp;   \*   The app will store the current raw offset as `laneOffsetBias`, making future offsets relative to your actual center.

# \*   \*\*Distance calibration\*\*:

# &nbsp;   \*   Park at a known distance behind a vehicle (e.g., 10 meters) with the car centered in view.

# &nbsp;   \*   Ensure the vehicle is detected (bounding box visible).

# &nbsp;   \*   Enter that distance into the \_Known distance\_ input.

# &nbsp;   \*   Tap \_Calibrate from detection\_.

# &nbsp;   \*   The app computes an effective `carHeightMeters` to better match your camera’s geometry.

# \*   \*\*Test warnings\*\*:

# &nbsp;   \*   \_Test beep\_ – plays the warning beep sound.

# &nbsp;   \*   \_Simulate HIGH risk\_ – sets collision risk to HIGH with a short distance to validate the UI and beep logic.

# 

# \* \* \*

# 

# Configuration

# -------------

# 

# \### Camera \& Browser Constraints

# 

# \*   \*\*Secure context\*\*:

# &nbsp;   \*   Most browsers require \*\*HTTPS\*\* (or `http://localhost`) for camera access.

# &nbsp;   \*   If the app reports “Camera not supported” but you are on a modern browser, it is often because the page is not secure.

# \*   \*\*Facing mode\*\*:

# &nbsp;   \*   The app requests the back camera via `facingMode: { ideal: 'environment' }`.

# &nbsp;   \*   If this fails, it falls back to unspecified facing mode, letting the browser pick a default camera.

# \*   \*\*Permissions\*\*:

# &nbsp;   \*   If camera permission is denied, the app will show an appropriate message.

# &nbsp;   \*   You can restore camera permission in the browser’s site settings.

# 

# \### Performance Tuning

# 

# \*   Use \*\*Low\*\* performance profile on older phones to reduce CPU/GPU usage and avoid stutter.

# \*   Lower the resolution (480p) if your device struggles to keep up at 720p or 1080p.

# \*   Disable \_vehicle detection\_ if you only care about lane assist – this will significantly reduce load.

# 

# \* \* \*

# 

# Example Code Snippets

# ---------------------

# 

# \### Accessing the camera stream

# 

# &nbsp;   async function startCamera() {

# &nbsp;     const res = getResolutionConstraints();

# &nbsp;   

# &nbsp;     // Prefer back camera with ideal facingMode

# &nbsp;     const constraints = {

# &nbsp;       video: {

# &nbsp;         ...res,

# &nbsp;         facingMode: { ideal: 'environment' }

# &nbsp;       },

# &nbsp;       audio: false

# &nbsp;     };

# &nbsp;   

# &nbsp;     let stream;

# &nbsp;     try {

# &nbsp;       stream = await navigator.mediaDevices.getUserMedia(constraints);

# &nbsp;     } catch (err1) {

# &nbsp;       console.warn('Environment camera failed, retrying without facingMode...', err1);

# &nbsp;       stream = await navigator.mediaDevices.getUserMedia({ video: res, audio: false });

# &nbsp;     }

# &nbsp;   

# &nbsp;     video.srcObject = stream;

# &nbsp;     const playPromise = video.play();

# &nbsp;     if (playPromise \&\& playPromise.catch) {

# &nbsp;       playPromise.catch(err => console.warn('Video play blocked:', err));

# &nbsp;     }

# &nbsp;   }

# 

# \### Running COCO-SSD detection on the current frame

# 

# &nbsp;   async function runVehicleDetection(canvas, settings) {

# &nbsp;     const { width, height } = canvas;

# &nbsp;   

# &nbsp;     if (!detectionModel) {

# &nbsp;       return { vehicles: \[], distanceMeters: Infinity, collisionRisk: 'LOW' };

# &nbsp;     }

# &nbsp;   

# &nbsp;     const predictions = await detectionModel.detect(canvas);

# &nbsp;     const vehicleClasses = \['car', 'truck', 'bus', 'motorcycle'];

# &nbsp;     const vehicles = \[];

# &nbsp;   

# &nbsp;     const fovRad = (settings.cameraFovDeg \* Math.PI) / 180;

# &nbsp;     const focalPx = (height / 2) / Math.tan(fovRad / 2);

# &nbsp;   

# &nbsp;     let minDistance = Infinity;

# &nbsp;   

# &nbsp;     for (const pred of predictions) {

# &nbsp;       if (!vehicleClasses.includes(pred.class)) continue;

# &nbsp;       if (pred.score < 0.4) continue;

# &nbsp;   

# &nbsp;       const \[x, y, w, h] = pred.bbox;

# &nbsp;       vehicles.push({ x, y, width: w, height: h, score: pred.score, class: pred.class });

# &nbsp;   

# &nbsp;       if (h <= 0) continue;

# &nbsp;   

# &nbsp;       const distance = (settings.carHeightMeters \* focalPx) / h;

# &nbsp;       if (distance < minDistance) minDistance = distance;

# &nbsp;     }

# &nbsp;   

# &nbsp;     let risk = 'LOW';

# &nbsp;     if (minDistance < 25) risk = 'MEDIUM';

# &nbsp;     if (minDistance < 15) risk = 'HIGH';

# &nbsp;   

# &nbsp;     return {

# &nbsp;       vehicles,

# &nbsp;       distanceMeters: isFinite(minDistance) ? minDistance : Infinity,

# &nbsp;       collisionRisk: risk

# &nbsp;     };

# &nbsp;   }

# 

# \* \* \*

# 

# Limitations \& Notes

# -------------------

# 

# \*   SeeingCar runs entirely in the browser; there is no persistent backend or server-side processing.

# \*   Distance and collision risk estimates are approximate and depend heavily on calibration, FOV, and phone mounting position.

# \*   Recording is limited by browser support for `MediaRecorder` and supported codecs (e.g., `video/webm;codecs=vp9`).

# \*   Lane detection requires clear lane markings and works best on highways and well-marked roads.

# \*   The app is not designed for, nor tested in, safety-critical scenarios.

# 

# \* \* \*

# 

# Acknowledgments

# ---------------

# 

# \*   \[OpenCV.js](https://opencv.org/) for real-time computer vision in the browser

# \*   \[TensorFlow.js](https://www.tensorflow.org/js) and \[COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) for object detection

# \*   \[getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) \& \[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder\_API) for camera and recording APIs

# \*   The broader open-source community for inspiration and documentation on browser-based CV and dashcam-like tools

# 

# © SeeingCar. This project is provided as-is, without any warranty of fitness for a particular purpose. Use at your own risk.

