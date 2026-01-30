import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, Download, Activity, Clock, Info, Brain, Smartphone, Monitor, QrCode, AlertCircle, RefreshCw, Camera, Eye, Link, Terminal, Send, PenTool, Layout, Box, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useHandTracking } from './hooks/useHandTracking';
import { useRemoteCamera } from './hooks/useRemoteCamera';
import { useObjectDetection } from './hooks/useObjectDetection';
import { smoothCoordinates } from './utils/smoothing';
import { calculateVelocity, getVelocityColor, isHesitating } from './utils/metrics';

// MediaPipe Landmark Indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;

// COCO-SSD Proxies for Pens and Writing Tools
const PEN_PROXIES = ['toothbrush', 'scissors', 'knife', 'fork', 'spoon', 'remote', 'cell phone', 'tie', 'pencil'];

function App() {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const overlayContextRef = useRef(null);
  const sharedVideoRef = useRef(null);

  const [appMode, setAppMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('pair') ? 'phone' : 'pc';
  });

  const [velocity, setVelocity] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [isCurrentlyHesitating, setIsCurrentlyHesitating] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [logs, setLogs] = useState([]);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [manualId, setManualId] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showObjects, setShowObjects] = useState(true);

  const [sceneStatus, setSceneStatus] = useState({
    handVisible: false,
    penVisible: false,
    calibratedTool: 'Searching...',
    detectedObjects: []
  });

  const addLog = (msg) => {
    console.log("[Cogniscript]", msg);
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const prevState = useRef({ x: 0, y: 0, t: Date.now() });
  const smoothedPos = useRef({ x: 0, y: 0 });
  const lastHesitationTime = useRef(0);
  const lastDetectionTime = useRef(0);

  const { detect, isModelLoading } = useObjectDetection();

  // Hand Tracking Results
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await tf.setBackend('webgl');
        const backend = tf.getBackend();
        addLog(`NVIDIA/GPU Engine: ${backend.toUpperCase()} active`);
      } catch (e) {
        addLog("GPU Engine: Falling back to CPU...");
      }
    };
    checkBackend();
  }, []);

  const onResults = useCallback(async (results) => {
    if (appMode !== 'pc' || !contextRef.current || !canvasRef.current || !overlayContextRef.current) return;

    // 1. Clear Overlay
    overlayContextRef.current.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    const now = Date.now();
    const handFound = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

    // 2. Throttled Object Detection & Pen Proximity
    if (now - lastDetectionTime.current > 500) {
      const objects = await detect(sharedVideoRef.current);

      let bestPenCandidate = null;
      let minDistanceToHand = Infinity;

      // If hand is visible, find the closest pen-like object
      if (handFound) {
        const wrist = results.multiHandLandmarks[0][WRIST];
        objects.forEach(obj => {
          const [ox, oy, ow, oh] = obj.bbox;
          const objCenterX = ox + ow / 2;
          const objCenterY = oy + oh / 2;

          // Distance to wrist (proxy for holding)
          const dist = Math.sqrt(Math.pow(objCenterX - wrist.x * sharedVideoRef.current.videoWidth, 2) + Math.pow(objCenterY - wrist.y * sharedVideoRef.current.videoHeight, 2));

          if (PEN_PROXIES.includes(obj.class) || obj.class === 'pen') {
            if (dist < minDistanceToHand) {
              minDistanceToHand = dist;
              bestPenCandidate = obj;
            }
          }
        });
      }

      setSceneStatus({
        handVisible: handFound,
        penVisible: !!bestPenCandidate,
        calibratedTool: bestPenCandidate ? bestPenCandidate.class.toUpperCase() : 'Not Seen',
        detectedObjects: objects
      });
      lastDetectionTime.current = now;
    }

    // 3. Draw UI & Objects
    const video = sharedVideoRef.current;
    const canvas = overlayCanvasRef.current;
    const containerRatio = canvas.width / canvas.height;
    const videoRatio = video.videoWidth / video.videoHeight;

    let scale, offsetX = 0, offsetY = 0;
    if (containerRatio > videoRatio) {
      scale = canvas.height / video.videoHeight;
      offsetX = (canvas.width - video.videoWidth * scale) / 2;
    } else {
      scale = canvas.width / video.videoWidth;
      offsetY = (canvas.height - video.videoHeight * scale) / 2;
    }

    if (showObjects) {
      sceneStatus.detectedObjects.forEach(obj => {
        const [x, y, width, height] = obj.bbox;
        const bx = x * scale + offsetX;
        const by = y * scale + offsetY;
        const bw = width * scale;
        const bh = height * scale;

        const isPen = PEN_PROXIES.includes(obj.class) || obj.class === 'pen';
        overlayContextRef.current.strokeStyle = isPen ? '#22c55e' : '#2563eb';
        overlayContextRef.current.lineWidth = isPen ? 3 : 1;
        overlayContextRef.current.strokeRect(bx, by, bw, bh);

        overlayContextRef.current.fillStyle = isPen ? '#22c55e' : '#2563eb';
        overlayContextRef.current.font = 'bold 12px Inter';
        overlayContextRef.current.fillText(`${isPen ? '🖋️ ' : ''}${obj.class}`, bx, by > 20 ? by - 5 : by + 15);
      });
    }

    // 4. Trace Handwriting
    if (handFound) {
      const landmarks = results.multiHandLandmarks[0];
      const index = landmarks[INDEX_TIP];
      const thumb = landmarks[THUMB_TIP];

      const dx = (index.x - thumb.x) * video.videoWidth * scale;
      const dy = (index.y - thumb.y) * video.videoHeight * scale;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isCurrentlyPinching = distance < 50;
      setIsPinching(isCurrentlyPinching);

      const rawX = (1 - index.x) * video.videoWidth * scale + offsetX;
      const rawY = index.y * video.videoHeight * scale + offsetY;
      const smoothed = smoothCoordinates({ x: rawX, y: rawY }, smoothedPos.current, 0.4);
      smoothedPos.current = smoothed;

      // Metrics
      const currentPoint = { x: index.x, y: index.y, t: now };
      const v = calculateVelocity(prevState.current, currentPoint);
      setVelocity(v);

      const hesitating = isHesitating(v);
      setIsCurrentlyHesitating(hesitating);
      if (hesitating && (now - lastHesitationTime.current > 1000)) {
        setHesitationCount(prev => prev + 1);
        lastHesitationTime.current = now;
      }

      if (isCurrentlyPinching) {
        contextRef.current.beginPath();
        contextRef.current.strokeStyle = getVelocityColor(v);
        contextRef.current.lineWidth = 4;
        contextRef.current.lineCap = 'round';
        contextRef.current.moveTo(prevState.current.pixelX || smoothed.x, prevState.current.pixelY || smoothed.y);
        contextRef.current.lineTo(smoothed.x, smoothed.y);
        contextRef.current.stroke();
      }

      if (showSkeleton) {
        landmarks.forEach(lm => {
          const lx = (1 - lm.x) * video.videoWidth * scale + offsetX;
          const ly = lm.y * video.videoHeight * scale + offsetY;
          overlayContextRef.current.fillStyle = isCurrentlyPinching ? '#22c55e' : 'rgba(255, 255, 255, 0.5)';
          overlayContextRef.current.beginPath();
          overlayContextRef.current.arc(lx, ly, 2, 0, Math.PI * 2);
          overlayContextRef.current.fill();
        });
        overlayContextRef.current.strokeStyle = isCurrentlyPinching ? '#22c55e' : '#fff';
        overlayContextRef.current.lineWidth = 2;
        overlayContextRef.current.beginPath(); overlayContextRef.current.arc(smoothed.x, smoothed.y, 10, 0, Math.PI * 2); overlayContextRef.current.stroke();
      }

      prevState.current = { ...currentPoint, pixelX: smoothed.x, pixelY: smoothed.y };
    }
  }, [appMode, showSkeleton, showObjects, detect, sceneStatus.detectedObjects]);

  const { peerId, remoteStream, status: remoteStatus, startStreaming } = useRemoteCamera(appMode === 'phone' ? 'sender' : 'receiver', addLog);

  useEffect(() => {
    if (remoteStream && sharedVideoRef.current) {
      addLog("Stream detected. Binding to display...");
      const video = sharedVideoRef.current;
      video.srcObject = remoteStream;

      video.onloadedmetadata = () => {
        if (!video) return;
        video.play().then(() => {
          addLog("Playback active!");
          if (canvasRef.current && overlayCanvasRef.current) {
            [canvasRef.current, overlayCanvasRef.current].forEach(canvas => {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            });
            contextRef.current = canvasRef.current.getContext('2d');
            overlayContextRef.current = overlayCanvasRef.current.getContext('2d');
          }
        }).catch(e => {
          addLog("Autoplay blocked! Click RE-SYNC.");
          console.warn("Autoplay failed:", e);
        });
      };
    }
  }, [remoteStream]);

  const { isLoaded: localLoaded } = useHandTracking(appMode === 'pc' ? onResults : null, sharedVideoRef, true);
  const isLoaded = forceLoaded || (remoteStatus === 'streaming');

  const handleStartCapture = async (e) => {
    if (e) e.preventDefault();
    const idToUse = manualId || new URLSearchParams(window.location.search).get('pair');
    if (!idToUse) { addLog("Error!"); return; }
    try {
      const stream = await startStreaming(idToUse);
      if (sharedVideoRef.current) { sharedVideoRef.current.srcObject = stream; await sharedVideoRef.current.play(); }
    } catch (e) { addLog("Sync error!"); }
  };

  if (appMode === 'phone') {
    return (
      <div style={{ background: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <Smartphone size={40} color="#2563eb" style={{ margin: '0 auto 1rem' }} />
          <h2>Sender Mode</h2>
          <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: remoteStatus === 'streaming' ? '#22c55e' : '#f59e0b' }}>{remoteStatus.toUpperCase()}</p>
          </div>
          <div style={{ width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', border: '2px solid' + (remoteStatus === 'streaming' ? '#2563eb' : '#1e293b') }}>
            <video ref={sharedVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted autoPlay />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleStartCapture}>START FEED</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <video ref={sharedVideoRef} className="input_video" style={{ display: 'block' }} playsInline muted autoPlay />
      <canvas ref={canvasRef} className="drawing-canvas" />
      <canvas ref={overlayCanvasRef} className="overlay-canvas" />

      {remoteStatus === 'streaming' && (!sceneStatus.handVisible || !sceneStatus.penVisible) && (
        <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: '#ef4444', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', animation: 'bounce 2s infinite' }}>
          <AlertCircle size={20} />
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
            ADJUST VIEW: {!sceneStatus.handVisible ? 'HAND' : ''} {!sceneStatus.penVisible ? 'FANCY PEN' : ''} NOT SEEN
          </div>
        </div>
      )}

      <div className="ui-overlay" style={{ width: '320px' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Brain size={20} color="#2563eb" />
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Cogniscript</h1>
          </div>

          {!remoteStream && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', display: 'inline-block' }}>
                <QRCodeSVG value={`https://subbronchial-alisia-unreprobatively.ngrok-free.dev/?pair=${peerId}`} size={160} />
              </div>
              <div style={{ marginTop: '1rem', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.6rem', color: '#64748b' }}>SECURE LINK: <br /><a href="https://subbronchial-alisia-unreprobatively.ngrok-free.dev" target="_blank" style={{ color: '#2563eb', fontWeight: 'bold' }}>ngrok-free.dev</a></p>
                <p style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '5px' }}>PAIRING CODE: <strong>{peerId || '...'}</strong></p>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1rem' }}>
            <div className="glass-panel" style={{ padding: '10px', background: 'white', boxShadow: 'none' }}>
              <Activity size={12} color="#64748b" /> VELOCITY
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getVelocityColor(velocity) }}>{(velocity * 1000).toFixed(1)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '10px', background: isCurrentlyHesitating ? '#fee2e2' : 'white', boxShadow: 'none' }}>
              <Clock size={12} color="#64748b" /> HESITATIONS
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{hesitationCount}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: '10px', padding: '10px', background: isPinching ? 'rgba(34,197,94,0.1)' : 'white', boxShadow: 'none' }}>
            <PenTool size={12} color="#64748b" /> STATUS: <span style={{ color: isPinching ? '#22c55e' : '#94a3b8', fontWeight: 'bold' }}>{isPinching ? 'INKING' : 'HOVERING'}</span>
          </div>

          <div className="glass-panel" style={{ marginTop: '10px', padding: '10px', background: 'rgba(37,99,235,0.05)', boxShadow: 'none' }}>
            <Sparkles size={12} color="#2563eb" /> DETECTED PEN: <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{sceneStatus.calibratedTool}</span>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '5px' }}>
            <button className="btn" style={{ flex: 1, fontSize: '0.6rem', padding: '5px' }} onClick={() => setShowSkeleton(!showSkeleton)}>SKELETON</button>
            <button className="btn" style={{ flex: 1, fontSize: '0.6rem', padding: '5px' }} onClick={() => setShowObjects(!showObjects)}>OBJECTS</button>
            <button className="btn" style={{ flex: 1, fontSize: '0.6rem', padding: '5px', background: '#fef3c7' }} onClick={() => sharedVideoRef.current?.play()}>RE-SYNC</button>
          </div>

          <div style={{ marginTop: '1rem', padding: '10px', background: '#f1f5f9', borderRadius: '8px', maxHeight: '100px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>SYSTEM LOGS</div>
            {logs.map((log, i) => (
              <div key={i} style={{ fontSize: '0.55rem', color: '#334155', borderBottom: '1px solid #e2e8f0', padding: '2px 0' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn" onClick={() => contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)}>
          <Trash2 size={16} /> Reset
        </button>
        <button className="btn btn-primary" onClick={() => {
          const link = document.createElement('a'); link.download = 'capture.png'; link.href = canvasRef.current.toDataURL(); link.click();
        }}>
          <Download size={16} /> Export
        </button>
      </div>

      {!isLoaded && remoteStatus !== 'streaming' && (
        <div style={{ position: 'fixed', inset: 0, background: '#f8fafc', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Brain className="animate-pulse" size={48} color="#2563eb" />
          <h2 style={{ marginTop: '2rem' }}>Cogniscript Vision</h2>
          <button className="btn" style={{ marginTop: '2rem' }} onClick={() => setForceLoaded(true)}>Skip to Dashboard</button>
        </div>
      )}
    </div>
  );
}

export default App;
