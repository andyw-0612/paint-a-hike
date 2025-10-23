"use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Background() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX - innerWidth / 2) / innerWidth) * -30;
      const y = ((e.clientY - innerHeight / 2) / innerHeight) * -30;
      setOffset({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const parallaxStyle = (xFactor: number, yFactor: number) => ({
    transform: `translate(${offset.x * xFactor}px, ${offset.y * yFactor}px)`,
  });

  return (
    <div className="absolute w-full h-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 2 }}
        className="absolute left-0 top-0"
      >
        <div style={parallaxStyle(0.5, 0.4)}>
          <img
            src={"/images/clouds.png"}
            alt="Clouds"
            className="object-contain"
            style={{ maxWidth: "100vw" }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.5, type: "spring", stiffness: 50 }}
        className="absolute left-[-5%] bottom-0"
      >
        <div style={parallaxStyle(0.5, 0.4)}>
          <img
            src={"/images/mt3.png"}
            alt="Mountain"
            className="object-contain"
            style={{ maxWidth: "100%" }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 250, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 1.5, type: "spring", stiffness: 50 }}
        className="absolute left-[-5%] bottom-[-2%]"
      >
        <div style={parallaxStyle(0.8, 0.7)}>
          <img
            src={"/images/mt2-2.png"}
            alt="Mountain"
            className="object-contain"
            style={{ maxWidth: "110%" }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 1.5, type: "spring", stiffness: 50 }}
        className="absolute left-[-5%] bottom-[-2%]"
      >
        <div style={parallaxStyle(1.5, 1.0)}>
          <img
            src={"/images/mt1.png"}
            alt="Mountain"
            className="object-contain"
            style={{ maxWidth: "110%" }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 1.2, type: "spring", stiffness: 100 }}
        className="absolute left-[-5%] bottom-[-2%]"
      >
        <div style={parallaxStyle(1.0, 1.0)}>
          <img
            src={"/images/trees.png"}
            alt="Trees"
            className="object-contain"
            style={{ maxWidth: "105%" }}
          />
        </div>
      </motion.div>
    </div>
  );
}