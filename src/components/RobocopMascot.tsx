"use client";

import React, { useEffect, useState, useRef } from 'react';

// Coordenadas aproximadas del sprite (ajusta X y Y según el PNG descargado)
// Asumiendo que el archivo descargado tiene frames de Robocop caminando.
const FRAMES = {
  idle:  { x: 16, y: 10, w: 26, h: 36 },
  walk1: { x: 54, y: 10, w: 26, h: 36 },
  walk2: { x: 88, y: 10, w: 26, h: 36 },
  walk3: { x: 122, y: 10, w: 26, h: 36 },
  shoot: { x: 156, y: 10, w: 38, h: 36 },
};

export default function RobocopMascot({ successCount }: { successCount: number }) {
  const [posX, setPosX] = useState(0); 
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [frame, setFrame] = useState<'idle'|'walk1'|'walk2'|'walk3'|'shoot'>('idle');
  const [isRoaming, setIsRoaming] = useState(true);

  const prevSuccessRef = useRef(successCount);

  // Reacción al éxito (Disparo)
  useEffect(() => {
    if (successCount > prevSuccessRef.current) {
      setIsRoaming(false);
      setFrame('shoot');
      setTimeout(() => {
        setIsRoaming(true);
        setFrame('idle');
      }, 2500);
    }
    prevSuccessRef.current = successCount;
  }, [successCount]);

  // Bucle de Roaming
  useEffect(() => {
    if (!isRoaming) return;

    let walkCycle = 0;
    const walkFrames: Array<'walk1'|'walk2'|'walk3'> = ['walk1', 'walk2', 'walk3', 'walk2'];

    const intervalId = setInterval(() => {
      // 5% chance de frenar
      if (Math.random() < 0.05 && frame !== 'idle') {
         setFrame('idle');
         return;
      }
      
      // Si está quieto, arrancar de nuevo
      if (frame === 'idle') {
         if (Math.random() < 0.2) {
             setDirection(Math.random() > 0.5 ? 'left' : 'right');
             setFrame('walk1');
         }
         return;
      }

      setFrame(walkFrames[walkCycle]);
      walkCycle = (walkCycle + 1) % walkFrames.length;

      setPosX(prev => {
        const step = 6;
        const next = direction === 'right' ? prev + step : prev - step;
        
        // Limites de patrullaje
        if (next > 280) { setDirection('left'); return prev; }
        if (next < 0) { setDirection('right'); return prev; }
        return next;
      });

    }, 180);

    return () => clearInterval(intervalId);
  }, [isRoaming, frame, direction]);

  const activeBox = FRAMES[frame] || FRAMES.idle;

  return (
    <div className="relative h-[55px] w-[350px] ml-4 hidden sm:block pointer-events-none">
      {/* Contenedor en Movimiento */}
      <div 
         className="absolute bottom-0 transition-all duration-200 ease-linear pointer-events-auto cursor-crosshair group"
         style={{ 
            left: `${posX}px`,
            transform: `scaleX(${direction === 'left' ? -1 : 1})`,
            width: `${activeBox.w * 1.5}px`, // Escala 1.5x
            height: `${activeBox.h * 1.5}px`
         }}
         onClick={() => {
            setIsRoaming(false);
            setFrame('shoot');
            setTimeout(() => { setIsRoaming(true); setFrame('idle'); }, 1200);
         }}
      >
        {/* Renderizado de Sprite Sheet */}
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: "url('/robocop_sheet.png')",
            backgroundPosition: `-${activeBox.x * 1.5}px -${activeBox.y * 1.5}px`,
            backgroundSize: `${677 * 1.5}px auto`, // La imagen original medía 677px de ancho, escalado a 1.5x
            imageRendering: 'pixelated',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))'
          }}
        />
        
        {/* Láser Holográfico en el disparo */}
        {frame === 'shoot' && (
          <div className="absolute top-[30%] -right-[150%] w-[150%] h-[4px] bg-[#ff00aa] rounded-full animate-pulse border-y border-white shadow-[0_0_15px_#ff00aa] z-0"></div>
        )}
      </div>
      
      {/* HUD Efecto (Solo se muestra en hover) */}
      <div className="absolute top-1 left-2 text-[8px] font-mono text-[#00e5ff] opacity-0 group-hover:opacity-100 transition-opacity">
        SYS.O.C.P: ONLINE
      </div>
    </div>
  );
}
