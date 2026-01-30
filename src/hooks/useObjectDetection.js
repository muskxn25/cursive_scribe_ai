import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocossd from '@tensorflow-models/coco-ssd';

export const useObjectDetection = () => {
    const [model, setModel] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(true);

    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log("[CV] Setting up WebGL backend...");
                await tf.setBackend('webgl');
                await tf.ready();
                console.log("[CV] Loading COCO-SSD model...");
                const loadedModel = await cocossd.load();
                setModel(loadedModel);
                setIsModelLoading(false);
                console.log("[CV] Model loaded successfully on backend:", tf.getBackend());
            } catch (err) {
                console.error("[CV] Model load failed:", err);
                setIsModelLoading(false);
            }
        };
        loadModel();
    }, []);

    const detect = useCallback(async (videoElement) => {
        if (!model || !videoElement || videoElement.readyState !== 4) return [];

        try {
            const predictions = await model.detect(videoElement);
            return predictions;
        } catch (err) {
            console.error("[CV] Detection error:", err);
            return [];
        }
    }, [model]);

    return { detect, isModelLoading };
};
