SeeingCar – Dashcam Assist
==========================

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg) ![Version](https://img.shields.io/badge/version-0.1.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Web%20Browser-lightgrey.svg) ![License](https://img.shields.io/badge/license-MIT-yellow.svg) ![Status](https://img.shields.io/badge/status-Experimental-orange.svg) ![Last Commit](https://img.shields.io/github/last-commit/your-username/seeingcar-dashcam)

**SeeingCar** is an experimental browser-based dashcam assist application built using **HTML**, **CSS**, and **JavaScript**. It runs entirely in the browser and leverages:

*   **OpenCV.js** – for real-time lane detection
*   **TensorFlow.js** + **COCO-SSD** – for vehicle detection
*   `getUserMedia` – to access the device camera

It provides the following features:

*   Real-time lane assist (detect lane lines and calculate lane offset)
*   Experimental collision risk estimation using object distance
*   Audio alerts for lane drift and high collision risk
*   Per-device calibration system for better accuracy
*   On-device recording support via `MediaRecorder` (.webm format)
*   Mobile-friendly HUD optimized for smaller screens

> _SeeingCar is a prototype and hobby research tool meant for learning and experimenting with lane detection and collision estimation in the browser. It is **not** a certified safety system._

⚠️ Safety Warning
-----------------

This project is for **educational and experimental** purposes only. It is **not** intended for use in safety-critical real-world scenarios. Always maintain full control of your vehicle and never rely on SeeingCar for driving decisions.

* * *

📋 Key Features
---------------

*   **Pure front-end** – No server or backend required
*   **On-device analysis** – Real-time processing using the browser
*   **Performance profiles** – Optimize for high or low-end devices
*   **Custom calibration** – Adjust distance and lane center based on your setup
*   **HUD overlay** – Displays lane status, collision risk, FPS, etc.

* * *

🧪 Technologies Used
--------------------

*   `OpenCV.js` – Canny edge detection, Hough lines, ROI mask
*   `TensorFlow.js` – COCO-SSD pre-trained ML model
*   `MediaRecorder` – In-browser video recording
*   `localStorage` – Save and restore settings
*   `requestAnimationFrame` – Smooth real-time rendering loop

* * *

📁 Files in This Application
----------------------------

*   `index.html` – Entry point, layout, video and overlay setup, settings UI
*   `style.css` – Styles for layout, HUD, buttons, calibration panel
*   `main.js` – Handles camera, lane detection, ML inference, audio alerts

* * *

🚀 To Use
---------

To clone and run this repository, you'll need [Git](https://git-scm.com) and a modern web browser installed on your computer.

From your command line:

**1. Clone this repository**

```bash
git clone https://github.com/your-username/seeingcar-dashcam.git
```

**2. Go into the repository**

```bash
cd seeingcar-dashcam
```

**3. Install a static server (optional)**

```bash
npm install -g serve
serve .
```

**4. Open in a modern browser**

Navigate to `http://localhost:3000` (or the port your server uses). Note: HTTPS is required on mobile devices.

**5. Start using SeeingCar**

*   Click "Start Camera" and allow camera permissions
*   Click "Start Recording" to capture .webm video (if supported)
*   Use the "Settings" panel for calibration & performance tuning

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use a regular command prompt / PowerShell.

* * *

Configuration
-------------

SeeingCar uses `localStorage` to persist your calibration settings and preferences. You can adjust the following via the in-app Settings panel:

### Camera Settings

*   **Resolution** – Adjust camera resolution for performance vs. quality
*   **Frame rate** – Set target frame rate for processing

### Calibration

*   **Lane center offset** – Adjust horizontal lane center position
*   **Distance calibration** – Fine-tune distance estimation based on your camera mount
*   **ROI mask** – Define the region of interest for lane detection

### Performance

*   **Processing mode** – Choose between high-quality or performance-optimized modes
*   **Detection frequency** – Adjust how often vehicle detection runs

All settings are saved automatically to `localStorage` and restored on your next visit.

* * *

⚠️ Limitations
--------------

*   Accuracy depends on your camera angle, mounting, and lighting
*   Vehicle distance estimation is a rough approximation using camera FOV
*   Some features (recording, camera) may not work in in-app browsers (e.g., Facebook, Instagram)
*   No backend or persistent data – all processing is local

* * *

🙏 Acknowledgments
------------------

*   [OpenCV.js](https://opencv.org/)
*   [TensorFlow.js](https://www.tensorflow.org/js)
*   [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
*   [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
*   [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder_API)

**© SeeingCar – Educational use only. No warranty. Use at your own risk.**
