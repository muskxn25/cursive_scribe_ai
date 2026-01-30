import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export const useRemoteCamera = (mode = 'receiver') => {
    const [peerId, setPeerId] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [status, setStatus] = useState('initializing');
    const peerRef = useRef(null);

    useEffect(() => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerId(id);
            setStatus('ready');
            console.log('Peer ID:', id);
        });

        if (mode === 'receiver') {
            peer.on('call', (call) => {
                console.log('Incoming call from sender...');
                setStatus('connecting');
                call.answer();
                call.on('stream', (stream) => {
                    console.log('Remote stream received!');
                    setRemoteStream(stream);
                    setStatus('streaming');
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
            return stream;
        } catch (err) {
            console.error('Streaming error:', err);
            setStatus('error: ' + (err.message || 'unknown'));
            throw err;
        }
    };

    return { peerId, remoteStream, status, startStreaming };
};
