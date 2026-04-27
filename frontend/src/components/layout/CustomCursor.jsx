import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[100] hidden md:block"
      animate={{ x: mousePosition.x, y: mousePosition.y }}
      transition={{ type: "spring", damping: 40, stiffness: 600, mass: 0.1 }}
    >
      <div className="relative w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute top-0 left-0 w-1 h-1 border-t-[1.5px] border-l-[1.5px] border-secondary rounded-tl-[2px] opacity-80" />
        <div className="absolute top-0 right-0 w-1 h-1 border-t-[1.5px] border-r-[1.5px] border-secondary rounded-tr-[2px] opacity-80" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-b-[1.5px] border-l-[1.5px] border-secondary rounded-bl-[2px] opacity-80" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-b-[1.5px] border-r-[1.5px] border-secondary rounded-br-[2px] opacity-80" />
      </div>
    </motion.div>
  );
}
