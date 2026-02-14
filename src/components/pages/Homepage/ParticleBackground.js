// components/pages/Homepage/components/ParticleBackground.js
import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    contextRef.current = ctx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial resize
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Create particles with depth layers for 3D effect
    const createParticles = () => {
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 20000);
      particlesRef.current = [];

      for (let i = 0; i < numberOfParticles; i++) {
        // depth: 0 = far background, 1 = close foreground
        const depth = Math.random();

        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          depth,
          // Closer particles are larger (0.5 → 2.2)
          radius: 0.5 + depth * 1.7,
          // Closer particles move faster (parallax)
          speedX: (Math.random() * 0.5 - 0.25) * (0.3 + depth * 0.7),
          speedY: (Math.random() * 0.5 - 0.25) * (0.3 + depth * 0.7),
          // Closer particles are brighter (0.04 → 0.14)
          opacity: 0.04 + depth * 0.10,
        });
      }
    };

    createParticles();

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap particles around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle — opacity varies by depth
        ctx.fillStyle = `rgba(0, 198, 224, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections — only between particles at similar depths
        particlesRef.current.forEach((other, otherIndex) => {
          if (index >= otherIndex) return;

          // Only connect particles within 0.3 depth of each other
          if (Math.abs(particle.depth - other.depth) > 0.3) return;

          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Connection range scales with average depth (closer = longer reach)
          const avgDepth = (particle.depth + other.depth) / 2;
          const maxDist = 60 + avgDepth * 80;

          if (distance < maxDist) {
            const lineOpacity = (1 - distance / maxDist) * (0.06 + avgDepth * 0.12);
            ctx.strokeStyle = `rgba(0, 198, 224, ${lineOpacity})`;
            ctx.lineWidth = 0.3 + avgDepth * 0.7;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      pointerEvents="none"
    />
  );
};

export default ParticleBackground;
