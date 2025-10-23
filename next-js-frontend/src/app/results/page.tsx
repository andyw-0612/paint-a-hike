"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowDown, FaArrowLeft } from "react-icons/fa";
import HomeNav from "../components/HomeNav";

// This is now the one and only "source of truth"
// It perfectly matches the JSON from your Python server
interface SearchResult {
  id: string;
  original_image_url: string;
  elevation: number;
  trail_length: number;
  distance: number; // This is faked by the server
  difficulty: string;
  desc: string;
  region: string; // This is the Hike Name
  trailhead: string; // This is "via [Trail Head Name]"
  latitude: number;
  longitude: number;
}

// --- Helper Component for Stats (WHITE text) ---
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-200 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-xl font-semibold text-white">{value}</span>
  </div>
);

export default function ResultsPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSketch, setUserSketch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref for scroll throttling
  const lastScrollTimeRef = useRef(0);
  const throttleDuration = 800;

  // ==========================================================
  // START: SIMPLIFIED DATA LOADING EFFECT
  // ==========================================================
  useEffect(() => {
    setIsLoading(true);

    const storedResultsJSON = sessionStorage.getItem("searchResults");
    const storedSketch = sessionStorage.getItem("userSketch");
    
    setUserSketch(storedSketch);

    if (storedResultsJSON) {
      // Parse the JSON. It's already in the correct format!
      const realResults: SearchResult[] = JSON.parse(storedResultsJSON);
      
      // No more mapping/faking needed. Just set the state.
      setResults(realResults);
    } else {
      setResults([]);
    }

    setIsLoading(false);
  }, []); // Empty dependency array ensures this runs only once on mount
  // ==========================================================
  // END: SIMPLIFIED DATA LOADING EFFECT
  // ==========================================================


  // --- Scroll Navigation Effect (Throttled) ---
  useEffect(() => {
    // ... (this function is unchanged)
    const handleScroll = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTimeRef.current < throttleDuration) {
        return;
      }
      let direction = 0;
      if (e.deltaY > 10) direction = 1;
      else if (e.deltaY < -10) direction = -1;
      if (direction !== 0) {
        setCurrentIndex((prev) => (prev + direction + results.length) % results.length);
        lastScrollTimeRef.current = now;
      }
    };
    window.addEventListener("wheel", handleScroll, { passive: true });
    return () => window.removeEventListener("wheel", handleScroll);
  }, [results.length]);

  // --- Effect to lock body scroll ---
  useEffect(() => {
    // ... (this function is unchanged)
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // --- Render Logic ---

  if (isLoading) {
    // ... (this render block is unchanged)
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0a0e1a]">
        <p className="text-white text-center text-xl">Loading results...</p>
      </div>
    );
  }

  if (results.length === 0) {
    // ... (this render block is unchanged)
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0e1a] text-center">
        <p className="text-white text-2xl mb-6">No results found.</p>
        <Link href="/paint">
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-full shadow-lg transition-all">
            Try Painting Again
          </button>
        </Link>
      </div>
    );
  }

  const currentHike = results[currentIndex];
  const textShadow = "[text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]";

  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      {/* --- Animated Background Image (Blurred) --- */}
      <AnimatePresence>
        <motion.div
          key={`${currentHike.id}-bg`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
        >
          <Image
            src={currentHike.original_image_url}
            alt={currentHike.region}
            fill
            className="object-cover blur-2xl scale-110" // BLURRED background
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* --- UI Layer --- */}
      <div className="relative z-10 w-full h-full">
        {/* --- Navigation --- */}
        <HomeNav />
        <div className="fixed top-16 left-32 z-50">
          <Link href="/paint">
            <button className="flex items-center justify-center text-white/80 hover:text-white text-md font-medium py-2 px-4 rounded-full transition-all cursor-pointer bg-black/20 hover:bg-black/40 backdrop-blur-sm">
              <FaArrowLeft className="mr-2" />
              Back to Painting
            </button>
          </Link>
        </div>

        {/* --- Centered Title (Above columns) --- */}
        <motion.div
          key={`${currentHike.id}-main-title`}
          className={`absolute top-20 left-0 right-0 z-20 flex flex-col items-center text-white ${textShadow}`}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <h1 className="text-5xl font-bold text-white">
            Your Imagination Comes to Life...
          </h1>
          <h3 className="mt-1 text-lg text-gray-200 font-semibold tracking-wide">
            📍 {currentHike.latitude.toFixed(4)}, {currentHike.longitude.toFixed(4)} 📍
          </h3>
        </motion.div>

        {/* --- Main Content Layout (2-Column) --- */}
        <div className="absolute inset-0 px-38 pb-32 pt-55 flex gap-24">
          
          {/* --- Left Pane: CLEAR Image --- */}
          <motion.div
            key={`${currentHike.id}-image-pane`}
            className="w-3/5 h-full bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <div className="relative w-full h-full">
              <Image
                src={currentHike.original_image_url}
                alt={currentHike.region}
                fill
                className="object-cover" // UN-BLURRED image
                priority
              />
            </div>
          </motion.div>

          {/* --- Right Column (Info + Sketch) --- */}
          <div className="w-2/5 h-full flex flex-col gap-6">
            
            {/* --- Top Right: Info (NO PANE) --- */}
            <motion.div
              key={`${currentHike.id}-info`}
              className={`flex-shrink-0 text-white ${textShadow}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              {/* --- HIKE INFO (NOW REAL) --- */}
              <p className="text-sm text-gray-200 uppercase tracking-wide">
                {currentHike.trailhead} 
              </p>
              <h1 className="text-4xl font-bold text-white mb-4">
                {currentHike.region}
              </h1>

              <div className="flex justify-between items-center my-4 pr-10">
                <StatCard
                  label="Highest Point"
                  value={`${currentHike.elevation.toLocaleString()} ft`}
                />
                <StatCard
                  label="Distance"
                  value={`${currentHike.trail_length} miles`}
                />
                {/* Time is still hardcoded, as it's not in your CSV */}
                <StatCard label="Difficulty" value={`${currentHike.difficulty}`} /> 
              </div>

              <div className="my-6 h-px bg-white/30" />

              {/* Description is also faked for now, but you could add it to the CSV! */}
              <p className="text-gray-100 text-lg">
                {currentHike.desc}
              </p>
            </motion.div>

            {/* --- Bottom Right: User Sketch (NO PANE) --- */}
            {userSketch && (
              <motion.div
                key={`${currentHike.id}-sketch`}
                className="flex-grow flex flex-col justify-end" // Pushes to bottom
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <div className="w-64 h-64 mx-auto relative rounded-2xl border-4 border-white/50 overflow-hidden shadow-xl">
                  <img
                    src={userSketch}
                    alt="User's sketch"
                    className="object-contain w-full h-full"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* --- Scrolling indicator --- */}
        <motion.div
          // ... (this is unchanged)
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <FaArrowDown className="text-2xl animate-bounce" />
        </motion.div>
      </div>
    </div>
  );
}