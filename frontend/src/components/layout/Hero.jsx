import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="text-center max-w-4xl w-full mb-16 mt-8">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-tertiary uppercase"
      >
        Vietnamese Tuong Masks
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-lg md:text-xl text-tertiary/70 font-normal"
      >
        A curated exhibition of traditional theatrical masks, meticulously preserved and digitized.
      </motion.p>
    </section>
  );
}
