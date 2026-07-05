import React, { useEffect, useRef, useState } from 'react';
import { useEngigraphStore } from '../../store/useEngigraphStore';

export const AcousticOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const elements = useEngigraphStore(state => state.elements);
    const view = useEngigraphStore(state => state.view);
    const [status, setStatus] = useState<string>('Initializing Acoustic Sensor...');

    const elementsRef = useRef(elements);
    const viewRef = useRef(view);

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let dataArray: Uint8Array | null = null;
        let animationFrameId: number;

        const initMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                dataArray = new Uint8Array(analyser.frequencyBinCount);
                setStatus('Microphone linked. Vibration Analysis Active.');
                renderLoop();
            } catch (err) {
                console.error('Error accessing microphone:', err);
                setStatus('Failed to access microphone for vibration analysis.');
            }
        };

        const renderLoop = () => {
            if (!ctx || !analyser || !dataArray) return;

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            analyser.smoothingTimeConstant = 0.85;
            analyser.getByteFrequencyData(dataArray as any);

            const barCount = Math.min(128, analyser.frequencyBinCount);
            const currentView = viewRef.current;
            const mappedComponents = elementsRef.current.map(el => ({
                ...el,
                x: (el.x || 0) * currentView.zoom + currentView.x,
                y: (el.y || 0) * currentView.zoom + currentView.y
            }));

            const motors = mappedComponents.filter(c => 
                c.partType === 'nema17' || c.partType === 'dc_motor_generic' || c.partType === 'servo_sg90'
            );

            if (motors.length > 0) {
                motors.forEach(motor => {
                    const radius = (40 * currentView.zoom) / 2 + 10;
                    const slice = (Math.PI * 2) / barCount;
                    
                    for (let i = 0; i < barCount; i++) {
                        const angle = slice * i;
                        const value = dataArray![i];
                        const barHeight = (value / 255) * h * 0.15 * 1.5;
                        const barWidth = (Math.PI * 2 * radius) / barCount * 0.8;

                        ctx.fillStyle = `rgb(255, ${255 - value}, 0)`;
                        ctx.save();
                        ctx.translate(motor.x, motor.y);
                        ctx.rotate(angle);
                        ctx.fillRect(radius, -barWidth/2, barHeight, barWidth);
                        ctx.restore();
                    }
                });
            } else {
                const barWidth = w / barCount;
                for (let i = 0; i < barCount; i++) {
                    const value = dataArray[i];
                    const barHeight = (value / 255) * h * 0.3 * 1.5;
                    const x = i * barWidth;
                    const y = h - barHeight;
                    
                    ctx.fillStyle = `rgba(0, 255, 100, ${value/255})`;
                    ctx.fillRect(x, y, barWidth - 1, barHeight);
                }
            }

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        initMicrophone();

        const handleResize = () => {
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if (audioContext) {
                audioContext.close();
            }
        };
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-51 opacity-70">
            <canvas ref={canvasRef} className="w-full h-full" />
            {status !== 'Microphone linked. Vibration Analysis Active.' && (
                <div className="absolute top-10 left-5 text-red-500 font-bold bg-black/50 px-3 py-1 rounded">
                    {status}
                </div>
            )}
        </div>
    );
};
