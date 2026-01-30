import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export const useRemoteCamera = (mode = 'receiver', addLog = console.log) => {
    const [peerId, setPeerId] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [status, setStatus] = useState('initializing');
    const peerRef = useRef(null);

    useEffect(() => {
        const peer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                ]
            }
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerId(id);
            setStatus('ready');
            addLog("Peer initialized. ID: " + id.slice(0, 8));
            console.log('Peer ID:', id);
        });

        if (mode === 'receiver') {
            peer.on('call', (call) => {
                console.log('Incoming call from sender...');
                setStatus('connecting');
                call.answer();
                call.on('stream', (stream) => {
                    console.log('Remote stream received! Tracks:', stream.getVideoTracks().length);
                    addLog("Stream received! Binding to display...");
                    setRemoteStream(stream);
                    setStatus('streaming');
                });
                call.on('error', (err) => {
                    console.error('Call error:', err);
                    addLog("Call error: " + err.type);
                });
            });
        }

        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            setStatus('error: ' + err.type);
        });

        return () => {
            peer.destroy();
        };
    }, [mode]);

    const startStreaming = async (targetId) => {
        if (mode !== 'sender' || !peerRef.current) return;

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatus('error-insecure');
                return;
            }

            console.log('Requesting camera for target:', targetId);
            setStatus('accessing-camera');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log('Camera active. Calling peer...');
            const call = peerRef.current.call(targetId, stream);

            if (!call) {
                throw new Error("Failed to initiate call to " + targetId);
            }

            setRemoteStream(stream);
            setStatus('streaming');
            addLog("Calling target: " + targetId);
            return stream;
        } catch (err) {
            console.error('Streaming error:', err);
            setStatus('error: ' + (err.message || 'unknown'));
            throw err;
        }
    };

    return { peerId, remoteStream, status, startStreaming };
};
