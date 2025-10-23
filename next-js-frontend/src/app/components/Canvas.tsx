// src/app/components/Canvas.tsx

"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaQuestionCircle } from "react-icons/fa";
import { motion } from "framer-motion";

type BrushType =
  | "Sky"
  | "Mountain"
  | "Water"
  | "Trees"
  | "Flowers"
  | "Boulders"
  | "Path"
  | "Grass"
  | "Dirt"
  | "Eraser";

// This color map perfectly matches the one in your Python server
const brushColors: Record<BrushType, string> = {
  Sky: "rgb(179,229,252)",
  Mountain: "rgb(97,115,97)",
  Water: "rgb(74,163,210)", // Backend knows as WATER_BODY
  Trees: "rgb(46,139,87)", // Backend knows as FOREST_TREES
  Flowers: "rgb(231,154,184)",
  Boulders: "rgb(164,159,154)", // Backend knows as BOULDERS_CLIFF
  Path: "rgb(191,168,147)", // Backend knows as PATH_ROAD
  Grass: "rgb(122,180,96)", // Backend knows as GRASS_FIELD
  Dirt: "rgb(137,115,96)", // Backend knows as EARTH_LAND
  Eraser: "rgb(179,229,252)", // Eraser paints the sky color
};

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // The stray <div> and comment that were here are now REMOVED
  const [isPainting, setIsPainting] = useState(false);
  const [brush, setBrush] = useState<BrushType>("Mountain");
  const [brushSize, setBrushSize] = useState(80);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = brushColors.Eraser;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  // ==========================================================
  // START: MODIFIED getCursorPosition
  // This is CRITICAL for a responsive canvas.
  // It scales your mouse click (e.g., at 200px) to the
  // canvas buffer (e.g., at 570px).
  // ==========================================================
  const getCursorPosition = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  // ==========================================================
  // END: MODIFIED getCursorPosition
  // ==========================================================

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    setIsPainting(true);
    setLastPos(getCursorPosition(e));
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isPainting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCursorPosition(e);
    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = brushSize;
      ctx.strokeStyle =
        brush === "Eraser" ? brushColors.Eraser : brushColors[brush];
      ctx.globalCompositeOperation = "source-over";
      ctx.stroke();
      ctx.closePath();
    }
    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsPainting(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = brushColors.Eraser;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitCanvas = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsLoading(true); 

      const sketchDataURL = canvas.toDataURL("image/png");
      sessionStorage.setItem('userSketch', sketchDataURL);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Error creating image file.");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", blob, "sketch.png");

        try {
          const response = await fetch("/api/search", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json(); // data is { results: [], debug_info: {} }
            
            // --- MODIFIED ---
            // Save both parts
            sessionStorage.setItem('searchResults', JSON.stringify(data.results)); 
            sessionStorage.setItem('debugInfo', JSON.stringify(data.debug_info)); // <-- NEW
            
            router.push('/results');
            
          } else {
            const errorData = await response.json();
            alert(`Failed to submit: ${errorData.detail || 'Unknown error'}`);
          }
        } catch (error) {
          console.error("Error submitting image:", error);
          alert("Error submitting image. Is the Python server running?");
        } finally {
          setIsLoading(false); 
        }
      }, "image/png");
    };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "painting.png";
    link.click();
  };

  return (
    // This container scrolls if content is taller than the screen
    <div className="flex flex-col items-center p-4 space-y-4 z-50 h-screen overflow-y-auto">
      {/* Toolbars remain the same */}
      <div className="flex flex-wrap justify-center gap-3 items-center z-50">
        {(Object.keys(brushColors) as BrushType[]).map((type) => (
          <button
            key={type}
            onClick={() => setBrush(type)}
            className={`px-4 py-2 rounded-2xl shadow-md font-semibold transition-all ${
              brush === type
                ? "bg-blue-500 text-white"
                : "bg-gray-600 hover:bg-gray-700 cursor-pointer"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 items-center mt-2 z-50">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Size:</label>
          <input
            type="range"
            min="10"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 cursor-pointer"
          />
        </div>

        <button
          onClick={clearCanvas}
          className="px-4 py-2 rounded-2xl bg-[rgb(223,84,86)] text-white font-semibold hover:bg-[rgb(187,58,61)] transition-all z-50 cursor-pointer"
        >
          Clear
        </button>

        <button
          onClick={submitCanvas}
          disabled={isLoading}
          className="px-4 py-2 rounded-2xl bg-[rgb(84,190,121)] text-white font-semibold hover:bg-[rgb(60,162,96)] transition-all z-50 cursor-pointer disabled:bg-gray-500"
        >
          {isLoading ? "Searching..." : "Submit"}
        </button>

        <button
          onClick={exportCanvas}
          className="px-4 py-2 rounded-2xl bg-[rgb(235,195,117)] text-white font-semibold hover:bg-[rgb(216,175,87)] transition-all z-50 cursor-pointer"
        >
          Export
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center justify-center text-white hover:text-gray-300 z-50 text-2xl"
          title="Help"
        >
          <FaQuestionCircle />
        </button>
      </div>

      {showHelp && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-100">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm text-center space-y-4">
            <h2 className="text-lg font-semibold text-blue-500">How to Use</h2>
            <p className="text-sm text-gray-700">
              Select a brush to paint different elements. Use the slider to
              change brush size, and paint out the scene in your dreams! You can
              be as detailed or as rough as you want. Click “Submit” to find
              your real-world location!
            </p>
            <button
              onClick={() => setShowHelp(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Removed 'absolute z-0' */}
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, type: "spring", stiffness: 50 }}
        className="w-full flex justify-center"
      >
        {/*
          - Added mt-8 for top margin as requested.
          - Kept max-w-[700px] and aspect-[7/9] for responsive ratio.
          - Kept flex container for centering.
          - Applied your max-h-[50vh] constraint.
        */}
        <div
          className="relative w-full max-w-[700px] aspect-[7/9] max-h-80vh] 
                     flex items-center justify-center mt-8"
        >
          {/*
            - Removed -mt-7 from easel.
            - It's absolute and will fill the parent container.
          */}
          <img
            src="/images/easel2.png"
            alt="Easel"
            className="absolute top-0 left-0 w-full h-full object-contain z-0"
          />

          {/*
            - Kept width/height attributes (for drawing buffer).
            - w-[calc(100%*57/70)] scales width relative to parent (570/700 = 81.4%).
            - aspect-square keeps canvas 1:1.
            - Replaced -mt-27 with -mt-[12%] (108px / 900px = 12%)
              This makes the negative margin responsive.
          */}
          <canvas
            ref={canvasRef}
            width={570}
            height={570}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair border-4 border-gray-400 rounded-lg z-10 drop-shadow-sm
                       w-[calc(100%*57/70)] aspect-square -mt-[12%]"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Canvas;