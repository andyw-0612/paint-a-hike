"use client"
import HomeNav from "./components/HomeNav"
import Background from "./components/Background"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[rgb(147,194,207)]">
      <HomeNav />
      <Background />

      <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-30 text-center z-10 px-4">
        <motion.h1
          className="text-6xl md:text-7xl font-bold text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Paint-a-Hike
        </motion.h1>

        <motion.h3
          className="mt-4 text-2xl md:text-3xl text-gray-200 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Bring your dream scenery to life!
        </motion.h3>

        <motion.div
          className="mt-10 z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Link href="/paint">
            <button className="bg-[rgb(76,101,112)] hover:bg-[rgb(106,132,146)] text-white text-xl font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 cursor-pointer">
              Start Painting
            </button>
          </Link>
        </motion.div>
      </div>

      <link rel="icon" href="/images/mt.png" type="image/png" sizes="any" />
    </div>
  )
}
