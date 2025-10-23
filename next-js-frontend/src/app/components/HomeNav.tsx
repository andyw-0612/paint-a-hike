"use client";
import { useState } from "react";
import Link from "next/link";
import { FaHome, FaBookmark, FaUser, FaFeather } from "react-icons/fa";

export default function HomeNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="fixed top-4 left-4 z-50"
            onMouseEnter={() => {
                setIsOpen(true);
            }}
            onMouseLeave={() => {
                setIsOpen(false);
            }}
        >
            <button className="bg-[rgb(235,199,148)] text-[rgb(32,74,65)] p-3 rounded-full shadow-lg hover:bg-[rgb(106,132,146)] transition cursor-pointer">
                <Link href="/">
                    <FaHome size={24} />
                </Link>
            </button>
        </div>
    );
}