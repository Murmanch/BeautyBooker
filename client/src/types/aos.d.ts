declare module 'aos' {
  interface AOSOptions {
    duration?: number;
    easing?: string;
    once?: boolean;
    offset?: number;
    delay?: number;
  }

  const AOS: {
    init(options?: AOSOptions): void;
    refresh(): void;
    refreshHard(): void;
  };

  export default AOS;
}


