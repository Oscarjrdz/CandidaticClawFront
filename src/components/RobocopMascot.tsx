"use client";

import React, { useEffect, useState, useRef } from 'react';

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  'k': '#0f172a', // Midnight outline
  's': '#cbd5e1', // Silver armor light
  'd': '#64748b', // Dark silver armor
  'o': '#fcd34d', // Face skin tone
  'r': '#ff00aa', // Laser blast
  'g': '#334155'  // Gun metal
};

const FRAMES = {
  idle: [
    "....kkkk........",
    "...kssssk.......",
    "..ksskkssk......",
    "..kskkkkdk......",
    ".kskookdok......",
    ".kddkkdddk......",
    ".ksdddddsk......",
    "..kkssskk..k....",
    ".kssssssskk.....",
    ".kssssssskg.....",
    "..kdddddk.k.....",
    "...ksssk........",
    "...kdddk........",
    "...ks.sk........",
    "...k...k........",
    "...kk..kk......."
  ],
  walk1: [
    "....kkkk........",
    "...kssssk.......",
    "..ksskkssk......",
    "..kskkkkdk......",
    ".kskookdok......",
    ".kddkkdddk......",
    ".ksdddddsk......",
    "..kkssskk.......",
    ".ksssssssk......",
    ".ksssssssk.gk...",
    "..kdddddk..k....",
    "...ksssk...k....",
    "...k..ddk.......",
    "..kk..ksk.......",
    "..k....k........",
    "...k...kk......."
  ],
  walk2: [
    "....kkkk........",
    "...kssssk.......",
    "..ksskkssk......",
    "..kskkkkdk......",
    ".kskookdok......",
    ".kddkkdddk......",
    ".ksdddddsk......",
    "..kkssskk.......",
    ".ksssssssk......",
    ".ksssssssk.gk...",
    "..kdddddk..k....",
    "...ksssk..k.....",
    "...kdddk........",
    '...ks.k.........',
    '...k.kk.........',
    '...k.k..........'
  ],
  shoot: [
    "....kkkk........",
    "...kssssk.......",
    "..ksskkssk......",
    "..kskkkkdk......",
    ".kskookdok......",
    ".kddkkdddk......",
    ".ksdddddsk......",
    "..kkssskk.......",
    "..ssssssskgggggr",
    ".kdddddddk...k..",
    "..ksssssk.......",
    "...kdddk........",
    "...ks.sok.......",
    "...k...k........",
    "...kk..kk......."
  ]
};

export default function RobocopMascot({ successCount }: { successCount: number }) {
  const [frame, setFrame] = useState<'idle' | 'walk1' | 'walk2' | 'shoot'>('idle');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const prevSuccessRef = useRef(successCount);
  const walkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Success Celebration (Disparo de éxito)
  useEffect(() => {
    if (successCount > prevSuccessRef.current) {
      setFrame('shoot');
      setTimeout(() => {
        setFrame('idle');
      }, 3000);
    }
    prevSuccessRef.current = successCount;
  }, [successCount]);

  // Interacción Mouse y Scroll
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mascotX = rect.left + rect.width / 2;
      
      // Orientar a Robocop
      if (e.clientX > mascotX + 50) setDirection('right');
      else if (e.clientX < mascotX - 50) setDirection('left');
    };

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Activar animación de caminar al hacer scroll
      if (frame !== 'shoot') {
        if (!walkIntervalRef.current) {
          let toggle = false;
          setFrame('walk1');
          walkIntervalRef.current = setInterval(() => {
            toggle = !toggle;
            setFrame(toggle ? 'walk2' : 'walk1');
          }, 150);
        }
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (walkIntervalRef.current) {
            clearInterval(walkIntervalRef.current);
            walkIntervalRef.current = null;
          }
          setFrame(prev => prev !== 'shoot' ? 'idle' : prev);
        }, 300);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
      clearTimeout(scrollTimeout);
    };
  }, [frame]);

  const currentGrid = FRAMES[frame] || FRAMES.idle;

  return (
      <div 
        ref={containerRef}
        className="relative group cursor-pointer ml-4 hidden sm:block select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
           setFrame('shoot');
           setTimeout(() => setFrame('idle'), 1000);
        }}
      >
        <div 
           className="w-[64px] h-[64px] items-center justify-center relative transition-transform duration-300 hover:scale-110"
           style={{ transform: `scaleX(${direction === 'left' ? -1 : 1})` }}
        >
            {/* Sombras y Luces */}
            {frame === 'shoot' && (
               <div className="absolute top-1/2 -right-6 w-12 h-12 bg-[#ff00aa] rounded-full blur-[20px] opacity-60 animate-pulse mix-blend-screen pointer-events-none"></div>
            )}
            
            {/* Grid Reactivo */}
            <div className="grid grid-rows-[16] grid-cols-[16] w-full h-full" style={{ gridTemplateColumns: 'repeat(16, 1fr)', gridTemplateRows: 'repeat(16, 1fr)' }}>
               {currentGrid.map((row, y) => 
                  row.split('').map((char, x) => (
                      <div 
                        key={`${x}-${y}`}
                        className={`w-full h-full ${char === 'r' ? 'animate-pulse' : ''}`}
                        style={{ 
                          backgroundColor: PALETTE[char],
                          boxShadow: char === 'r' ? '0 0 8px #ff00aa' : 'none'
                        }}
                      />
                  ))
               )}
            </div>
            
            {/* Suelo decorativo al hacer hover */}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/20 rounded-full blur-sm transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-50'}`}></div>
        </div>
      </div>
  );
}
