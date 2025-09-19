import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Simple POC: horizontal road with 6 checkpoints and avatar that animates to the last checkpoint.

const CHECKPOINTS = 6;
const CANVAS_HEIGHT = 300;

const JourneyCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    const setup = async () => {
      await app.init({
        width: containerRef.current!.clientWidth,
        height: CANVAS_HEIGHT,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      // Graphics containers
      const road = new PIXI.Graphics();
      const checkpointsContainer = new PIXI.Container();
      const avatar = new PIXI.Graphics();

      app.stage.addChild(road);
      app.stage.addChild(checkpointsContainer);
      app.stage.addChild(avatar);

      const drawScene = () => {
        const { width } = app.renderer;
        road.clear();
        checkpointsContainer.removeChildren();
        road.beginFill(0xb7e3ff);
        road.drawRoundedRect(0, CANVAS_HEIGHT / 2 - 4, width, 8, 4);
        road.endFill();
        const gapVal = width / (CHECKPOINTS + 1);
        for (let i = 1; i <= CHECKPOINTS; i++) {
          const x = gapVal * i;
          const cp = new PIXI.Graphics();
          cp.beginFill(0xffffff);
          cp.lineStyle(2, 0x00c4ff);
          cp.drawCircle(0, 0, 10);
          cp.endFill();
          cp.x = x;
          cp.y = CANVAS_HEIGHT / 2;
          checkpointsContainer.addChild(cp);
        }
      };

      drawScene();

      avatar.beginFill(0xff6363);
      avatar.drawCircle(0, 0, 12);
      avatar.endFill();
      avatar.y = CANVAS_HEIGHT / 2;

      let progress = 0;
      const targetIndex = 3;
      const gapVal = () => app.renderer.width / (CHECKPOINTS + 1);
      const targetX = () => gapVal() * (targetIndex + 1);

      const ticker = app.ticker.add((delta) => {
        if (progress < 1) {
          progress += 0.01 * delta;
          avatar.x = targetX() * Math.min(progress, 1);
        }
      });

      function handleResize() {
        if (!containerRef.current) return;
        app.renderer.resize(containerRef.current.clientWidth, CANVAS_HEIGHT);
        drawScene();
      }

      window.addEventListener('resize', handleResize);

      (JourneyCanvas as any)._cleanup = () => {
        window.removeEventListener('resize', handleResize);
        ticker.destroy();
        app.destroy(true, { children: true });
      };
    };

    setup();

    return () => {
      if ((JourneyCanvas as any)._cleanup) (JourneyCanvas as any)._cleanup();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-[300px]" />;
};

export default JourneyCanvas; 