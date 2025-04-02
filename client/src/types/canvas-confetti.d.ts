declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    colors?: string[];
    disableForReducedMotion?: boolean;
  }

  type ConfettiCallback = (options?: ConfettiOptions) => Promise<null>;

  const confetti: ConfettiCallback & {
    reset: () => void;
    create: (canvas: HTMLCanvasElement, options?: {
      resize?: boolean;
      useWorker?: boolean;
    }) => ConfettiCallback;
  };

  export default confetti;
}