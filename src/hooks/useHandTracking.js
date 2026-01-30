import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export const useHandTracking = (onResults, externalVideoRef = null, skipLocalCamera = false) => {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!onResults || !videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    // If we're skipping the local camera (using a remote stream), 
    // we don't start the MediaPipe Camera helper. 
    // Instead, we manually trigger the hands.send on setiap frame of the video.
    let camera = null;
    let requestRef = null;

    if (!skipLocalCamera) {
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            try {
              await hands.send({ image: videoRef.current });
            } catch (e) { }
          }
        },
        width: 1280,
        height: 720,
      });

      camera.start()
        .then(() => setIsLoaded(true))
        .catch((err) => {
          console.error("Local camera failed:", err);
          setError("Local camera access denied.");
        });
    } else {
      // For remote stream, we use a custom frame loop
      const processFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await hands.send({ image: videoRef.current });
          } catch (e) { }
        }
        requestRef = requestAnimationFrame(processFrame);
      };
      setIsLoaded(true);
      requestRef = requestAnimationFrame(processFrame);
    }

    return () => {
      if (camera) camera.stop();
      if (requestRef) cancelAnimationFrame(requestRef);
      hands.close();
    };
  }, [onResults, skipLocalCamera]);

  return { videoRef, isLoaded, error };
};
