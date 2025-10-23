"use client"
import HomeNav from "../components/HomeNav"
import Canvas from "../components/Canvas"
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="w-full h-screen bg-cover bg-center" style={{ backgroundColor: "rgb(147,194,207)"}}>
      <HomeNav />

      <div className="flex flex-col items-center justify-center text-center pt-10 relative z-5 -translate-y-2">
        <div className="flex items-center justify-center mt-10 px-4">
            <h1 className="text-4xl text-bold text-white mr-2">Time to Paint!</h1>
        </div>
      </div>

      <div className="absolute w-full h-full bg-[rgb(147,194,207)]">
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.5, type: "spring", stiffness: 50 }}
          className="absolute left-[-5%] bottom-0 z-0"
        >
          <img
            src={"/images/mt1.png"}
            alt="Mountain"
            className="object-contain"
            style={{ maxWidth: "100%" }}
          />
        </motion.div>

        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 1.5, type: "spring", stiffness: 50 }}
          className="absolute left-[-5%] top-0 z-0"
        >
          {/* <img
            src={"/images/clouds.png"}
            alt="Clouds"
            className="object-contain"
            style={{ maxWidth: "100%" }}
          /> */}
        </motion.div>
      </div>

      <Canvas />

      <link rel="icon" href="/images/pah.png" type="image/png" sizes="any" />
    </div>
  )
}