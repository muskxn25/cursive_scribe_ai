# 🖋️ Cogniscript Vision

**Cogniscript Vision** is an AI-powered digital ink engine designed to bridge the gap between physical writing and digital data. Using advanced computer vision and hand tracking, it transforms any surface into a smart writing canvas.

## 🚀 Mission
To provide a seamless, tool-agnostic handwriting digitization experience that captures the nuances of human writing—including velocity, pressure (proxied by pinch distance), and hesitation—without requiring specialized hardware like expensive tablets or styluses.

## 📊 Project Roadmap

### 🏆 Current Features (Achieved)
| Status | Feature | Implementation |
| :---: | :--- | :--- |
| ✅ | **Real-time Hand Tracking** | MediaPipe Hands (Fingertip & Wrist) |
| ✅ | **Smart Tool Detection** | TensorFlow.js (COCO-SSD Tool Calibration) |
| ✅ | **Remote Camera Pairing** | PeerJS (WebRTC P2P Pairing) |
| ✅ | **Kinematic Metrics** | Flowing Velocity & Hesitation Tracking |
| ✅ | **Digital Ink Engine** | Dynamic coordinate smoothing & rendering |
| ✅ | **Instant Export** | Canvas-to-PNG persistence |
| ✅ | **Cloud Backups** | Automated 6 PM GitHub synchronization |

### 🛠️ Future Goals (Planned)
- [ ] **AI Handwriting OCR**: Real-time conversion to editable text.
- [ ] **Surface-Aware Calibration**: Auto-alignment for any writing surface.
- [ ] **Session Replay**: Interactive dashboard for reviewing previous sessions.
- [ ] **Collaboration Mode**: Shared canvas for remote pair-writing.

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
