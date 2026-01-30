# 🖋️ Cogniscript Vision

**Cogniscript Vision** is an AI-powered digital ink engine designed to bridge the gap between physical writing and digital data. Using advanced computer vision and hand tracking, it transforms any surface into a smart writing canvas.

## 🚀 Mission
To provide a seamless, tool-agnostic handwriting digitization experience that captures the nuances of human writing—including velocity, pressure (proxied by pinch distance), and hesitation—without requiring specialized hardware like expensive tablets or styluses.

## 📊 Project Roadmap

### Current Features (Achieved)
- [x] **Real-time Hand Tracking**: Powered by MediaPipe for precise fingertip and wrist localization.
- [x] **Smart Tool Detection**: Uses COCO-SSD to identify pens or "fancy pen" proxies (brushes, styluses, etc.) to calibrate writing offsets.
- [x] **Remote Camera Pairing**: Seamlessly pair your smartphone as a dedicated wireless camera feed using PeerJS.
- [x] **Kinematic Metrics**: Real-time tracking of writing velocity and hesitation detection.
- [x] **Digital Ink Engine**: Smooth coordinate filtering and multi-color rendering based on writing speed.
- [x] **Export Capability**: Instant PNG export of your captured handwriting sessions.
- [x] **GitHub Automation**: Automatic daily backup to GitHub scheduled for 6:00 PM local time.

### Future Goals (Planned)
- [ ] **Handwriting-to-Text (OCR)**: Integrated local/cloud OCR to convert sketches into editable text.
- [ ] **Advanced Calibration**: Auto-alignment for various writing surfaces (paper, whiteboard, tablet).
- [ ] **Multi-Session History**: A dashboard to review and organize previous writing sessions.
- [ ] **Cloud Sync**: Optional synchronization with popular note-taking apps.

## 🛠️ Tech Stack
- **Frontend**: React + Vite
- **Vision**: MediaPipe Hands & TensorFlow.js (COCO-SSD)
- **Networking**: PeerJS (WebRTC) for low-latency remote camera streaming
- **Styling**: Vanilla CSS for premium, responsive UI

## ⚙️ Quick Start

### Local Development
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

### Pairing a Remote Camera
1. Open the app on your PC.
2. Scan the generated QR code with your smartphone.
3. Tap **START FEED** on your phone to turn it into a wireless document camera.

---

*Cogniscript Vision — Digitizing human expression, one stroke at a time.*
