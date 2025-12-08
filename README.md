# &nbsp;SeeingCar – Dashcam Assist

# 

# 🚘 SeeingCar – Dashcam Assist

# =============================

# 

# !\[Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg) !\[Version](https://img.shields.io/badge/version-0.1.0-blue.svg) !\[Platform](https://img.shields.io/badge/platform-Web%20Browser-lightgrey.svg) !\[License](https://img.shields.io/badge/license-MIT-yellow.svg) !\[Status](https://img.shields.io/badge/status-Experimental-orange.svg) !\[Last Commit](https://img.shields.io/github/last-commit/your-username/seeingcar-dashcam)

# 

# \*\*SeeingCar\*\* is an experimental browser-based dashcam assist application built using \*\*HTML\*\*, \*\*CSS\*\*, and \*\*JavaScript\*\*. It runs entirely in the browser and leverages:

# 

# \*   \*\*OpenCV.js\*\* – for real-time lane detection

# \*   \*\*TensorFlow.js\*\* + \*\*COCO-SSD\*\* – for vehicle detection

# \*   `getUserMedia` – to access the device camera

# 

# It provides the following features:

# 

# \*   Real-time lane assist (detect lane lines and calculate lane offset)

# \*   Experimental collision risk estimation using object distance

# \*   Audio alerts for lane drift and high collision risk

# \*   Per-device calibration system for better accuracy

# \*   On-device recording support via `MediaRecorder` (.webm format)

# \*   Mobile-friendly HUD optimized for smaller screens

# 

# > \_SeeingCar is a prototype and hobby research tool meant for learning and experimenting with lane detection and collision estimation in the browser. It is \*\*not\*\* a certified safety system.\_

# 

# ⚠️ Safety Warning

# -----------------

# 

# This project is for \*\*educational and experimental\*\* purposes only. It is \*\*not\*\* intended for use in safety-critical real-world scenarios. Always maintain full control of your vehicle and never rely on SeeingCar for driving decisions.

# 

# \* \* \*

# 

# 📋 Key Features

# ---------------

# 

# \*   \*\*Pure front-end\*\* – No server or backend required

# \*   \*\*On-device analysis\*\* – Real-time processing using the browser

# \*   \*\*Performance profiles\*\* – Optimize for high or low-end devices

# \*   \*\*Custom calibration\*\* – Adjust distance and lane center based on your setup

# \*   \*\*HUD overlay\*\* – Displays lane status, collision risk, FPS, etc.

# 

# \* \* \*

# 

# 🧪 Technologies Used

# --------------------

# 

# \*   `OpenCV.js` – Canny edge detection, Hough lines, ROI mask

# \*   `TensorFlow.js` – COCO-SSD pre-trained ML model

# \*   `MediaRecorder` – In-browser video recording

# \*   `localStorage` – Save and restore settings

# \*   `requestAnimationFrame` – Smooth real-time rendering loop

# 

# \* \* \*

# 

# 📁 Files in This Application

# ----------------------------

# 

# \*   `index.html` – Entry point, layout, video and overlay setup, settings UI

# \*   `style.css` – Styles for layout, HUD, buttons, calibration panel

# \*   `main.js` – Handles camera, lane detection, ML inference, audio alerts

# 

# \* \* \*

# 

# 🚀 How to Use

# -------------

# 

# 1\.  \*\*Clone or Download:\*\*  

# &nbsp;   `git clone https://github.com/your-username/seeingcar-dashcam.git`

# 2\.  \*\*Install a static server (optional):\*\*  

# &nbsp;   `npm install -g serve`  

# &nbsp;   `serve .`

# 3\.  \*\*Open in a modern browser (HTTPS required on mobile)\*\*

# 4\.  \*\*Click “Start Camera” and allow permissions\*\*

# 5\.  \*\*Click “Start Recording” to capture .webm video (if supported)\*\*

# 6\.  \*\*Use the “Settings” panel for calibration \& performance tuning\*\*

# 

# \* \* \*

# 

# ⚠️ Limitations

# --------------

# 

# \*   Accuracy depends on your camera angle, mounting, and lighting

# \*   Vehicle distance estimation is a rough approximation using camera FOV

# \*   Some features (recording, camera) may not work in in-app browsers (e.g., Facebook, Instagram)

# \*   No backend or persistent data – all processing is local

# 

# \* \* \*

# 

# 🙏 Acknowledgments

# ------------------

# 

# \*   \[OpenCV.js](https://opencv.org/)

# \*   \[TensorFlow.js](https://www.tensorflow.org/js)

# \*   \[COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)

# \*   \[getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

# \*   \[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder\_API)

# 

# \*\*© SeeingCar – Educational use only. No warranty. Use at your own risk.\*\*

