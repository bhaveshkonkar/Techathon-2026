import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function HandTracker({ videoRef, children, onGesture, isActive = true }: { videoRef: React.RefObject<HTMLVideoElement>, children: React.ReactNode, onGesture?: (gesture: { rx: number, ry: number, zoom: number, px: number, py: number }) => void, isActive?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [feedback, setFeedback] = useState("");

    const target = useRef({ scale: 1, x: 0, y: 0, rotX: 0, rotY: 0 });
    const current = useRef({ scale: 1, x: 0, y: 0, rotX: 0, rotY: 0 });

    const state = useRef({
        lastDistance: null as number | null,
        lastX: null as number | null,
        lastY: null as number | null,
        lastCenterX: null as number | null,
        lastCenterY: null as number | null
    });

    const onGestureRef = useRef(onGesture);
    useEffect(() => {
        onGestureRef.current = onGesture;
    }, [onGesture]);

    useEffect(() => {
        if (!isActive) {
            setFeedback("");
            return;
        }

        let active = true;
        let handLandmarker: HandLandmarker | null = null;
        let lastVideoTime = -1;
        let animationFrameId: number;

        const initMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.4,
                    minHandPresenceConfidence: 0.4,
                    minTrackingConfidence: 0.4
                });

                if (active) renderLoop();
            } catch (err) {
                console.error("MediaPipe Init Error:", err);
            }
        };

        function renderLoop() {
            if (!active) return;
            const video = videoRef.current;

            if (video && video.readyState >= 2 && handLandmarker) {
                if (lastVideoTime !== video.currentTime) {
                    lastVideoTime = video.currentTime;
                    const results = handLandmarker.detectForVideo(video, performance.now());

                    processHands(results);
                }
                // Linear Interpolation (LERP) for buttery smooth physics (25% closer every frame to absorb ALL jitter)
                const prevScale = current.current.scale;
                const prevX = current.current.x;
                const prevY = current.current.y;
                const prevRotX = current.current.rotX;
                const prevRotY = current.current.rotY;

                current.current.scale += (target.current.scale - current.current.scale) * 0.25;
                current.current.x += (target.current.x - current.current.x) * 0.25;
                current.current.y += (target.current.y - current.current.y) * 0.25;
                current.current.rotX += (target.current.rotX - current.current.rotX) * 0.25;
                current.current.rotY += (target.current.rotY - current.current.rotY) * 0.25;

                // Emit the difference between this frame and last frame to the consumer for API manipulation
                if (onGestureRef.current) {
                    const rxDelta = current.current.rotX - prevRotX;
                    const ryDelta = current.current.rotY - prevRotY;
                    const zoomDelta = current.current.scale - prevScale;
                    const pxDelta = current.current.x - prevX;
                    const pyDelta = current.current.y - prevY;

                    if (Math.abs(rxDelta) > 0.01 || Math.abs(ryDelta) > 0.01 || Math.abs(zoomDelta) > 0.001 || Math.abs(pxDelta) > 0.01 || Math.abs(pyDelta) > 0.01) {
                        onGestureRef.current({ rx: rxDelta, ry: ryDelta, zoom: zoomDelta, px: pxDelta, py: pyDelta });
                    }
                }
            }

            animationFrameId = requestAnimationFrame(renderLoop);
        }

        function getFingerState(landmarks: any) {
            const indexUp = landmarks[8].y < landmarks[6].y;
            const middleUp = landmarks[12].y < landmarks[10].y;
            const ringUp = landmarks[16].y < landmarks[14].y;
            const pinkyUp = landmarks[20].y < landmarks[18].y;

            const isFist = !indexUp && !middleUp && !ringUp && !pinkyUp;
            if (isFist) return { state: 'FIST' };

            const pinchDist = Math.hypot(landmarks[8].x - landmarks[4].x, landmarks[8].y - landmarks[4].y);
            const isPinching = pinchDist < 0.05;

            if ((indexUp && middleUp && !ringUp && !pinkyUp) || isPinching) {
                return { state: 'GRAB', f1: 8, f2: isPinching ? 4 : 12, mode: isPinching ? 'PINCH' : 'PEACE' };
            }

            if ((indexUp && !middleUp && !ringUp && !pinkyUp) || (indexUp && middleUp && ringUp && pinkyUp)) {
                return { state: 'HOVER' };
            }

            return { state: 'NONE' };
        }

        function processHands(results: any) {
            if (!results.landmarks || results.landmarks.length === 0) {
                state.current.lastDistance = null;
                state.current.lastX = null;
                state.current.lastY = null;
                state.current.lastCenterX = null;
                state.current.lastCenterY = null;

                target.current = { scale: Math.max(0.1, target.current.scale), x: 0, y: 0, rotX: 0, rotY: 0 };
                setFeedback("Hover/Grab = Rotate | 2 Fists = Zoom");
                return;
            }

            // Two-Handed Zoom Logic (BOTH FISTS)
            if (results.landmarks.length >= 2) {
                const hand1 = getFingerState(results.landmarks[0]);
                const hand2 = getFingerState(results.landmarks[1]);

                if (hand1.state === 'FIST' && hand2.state === 'FIST') {
                    setFeedback("TWO FISTS: Zooming in/out");
                    const h1c = results.landmarks[0][9];
                    const h2c = results.landmarks[1][9];
                    const dist = Math.hypot(h1c.x - h2c.x, h1c.y - h2c.y);

                    if (state.current.lastDistance !== null) {
                        const delta = dist - state.current.lastDistance;
                        if (Math.abs(delta) > 0.002) {
                            target.current.scale += delta * 150; // Massively increased sensitivity
                        }
                    }
                    state.current.lastDistance = dist;
                    state.current.lastCenterX = null;
                    state.current.lastCenterY = null;
                    return;
                }
            }

            // Single Hand Rotate Logic (FIST or GRAB)
            const hand = results.landmarks[0];
            const info = getFingerState(hand);

            if (info.state === 'FIST' || info.state === 'GRAB') {
                setFeedback(info.state === 'FIST' ? "FIST: Rotating" : "GRABBED: Rotating");

                const cx = hand[9].x;
                const cy = hand[9].y;

                if (state.current.lastCenterX !== null && state.current.lastCenterY !== null) {
                    const dx = cx - state.current.lastCenterX;
                    const dy = cy - state.current.lastCenterY;

                    if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
                        target.current.rotY -= dx * 100;
                        target.current.rotX -= dy * 100;
                    }
                }

                state.current.lastCenterX = cx;
                state.current.lastCenterY = cy;
                state.current.lastDistance = null;

            } else if (info.state === 'HOVER') {
                setFeedback("HOVERING (1 Finger/Open Hand)");
                state.current.lastDistance = null;
                state.current.lastCenterX = null;
                state.current.lastCenterY = null;
            } else {
                setFeedback("Ready: Grab to Rotate, 2 Fists to Zoom");
                state.current.lastDistance = null;
                state.current.lastCenterX = null;
                state.current.lastCenterY = null;
            }
        }

        initMediaPipe();

        return () => {
            active = false;
            cancelAnimationFrame(animationFrameId);
            if (handLandmarker) handLandmarker.close();
        };
    }, [videoRef, isActive]);

    return (
        <div className="relative w-full h-full overflow-hidden" ref={containerRef} style={{ perspective: '1200px' }}>
            {feedback && (
                <div className="absolute top-4 right-4 z-[60] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {feedback}
                </div>
            )}

            <div className="w-full h-full block">
                {children}
            </div>
        </div>
    );
}
