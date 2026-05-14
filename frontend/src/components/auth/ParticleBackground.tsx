'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
}

const round = (n: number, decimals = 2) =>
  Number(n.toFixed(decimals));

function seeded(seed: number) {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const buildParticles = (): Particle[] =>
  Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: round(seeded(i * 4 + 1) * 100),
    y: round(seeded(i * 4 + 2) * 100),
    size: round(seeded(i * 4 + 3) * 4 + 1, 1),
    duration: round(seeded(i * 4 + 4) * 20 + 10, 1),
    delay: round(seeded(i * 4 + 5) * 5, 1),
    driftX: round(seeded(i * 4 + 6) * 20 - 10, 1),
  }));

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(buildParticles());
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background:
              p.id % 3 === 0
                ? 'rgba(244, 114, 182, 0.5)'
                : p.id % 3 === 1
                ? 'rgba(192, 132, 252, 0.45)'
                : 'rgba(255, 255, 255, 0.25)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.driftX, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <motion.div
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)' }}
        animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" aria-hidden>
        <defs>
          <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>
    </div>
  );
}
