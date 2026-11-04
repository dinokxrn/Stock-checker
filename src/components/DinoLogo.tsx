import React from "react";
import Image from "next/image";

interface DinoLogoProps {
  size?: number;
  className?: string;
  useImage?: boolean;
}

export function DinoLogo({ size = 48, className = "", useImage = true }: DinoLogoProps) {
  if (useImage) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-xs shrink-0 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/dino-logo.jpg"
          alt="Dino Stock Checker Mascot"
          width={size}
          height={size}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    );
  }

  // Fallback vector SVG
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Background circle badge */}
      <circle cx="50" cy="50" r="48" fill="#ECFDF5" stroke="#10B981" strokeWidth="3" />

      {/* Dinosaur tail */}
      <path
        d="M26 65C18 64 12 58 10 52C16 54 22 58 26 62Z"
        fill="#10B981"
      />

      {/* Dinosaur Body */}
      <ellipse cx="44" cy="58" rx="22" ry="20" fill="#10B981" />
      {/* Yellow Belly */}
      <ellipse cx="46" cy="62" rx="14" ry="13" fill="#FDE047" />

      {/* Back Spines */}
      <polygon points="26,45 20,40 24,50" fill="#059669" />
      <polygon points="32,35 28,28 32,40" fill="#059669" />
      <polygon points="42,28 40,20 46,30" fill="#059669" />

      {/* Dinosaur Head */}
      <circle cx="54" cy="34" r="17" fill="#10B981" />
      {/* Cute Snout */}
      <ellipse cx="64" cy="37" rx="9" ry="8" fill="#10B981" />
      <circle cx="68" cy="36" r="1.5" fill="#065F46" />

      {/* Cheerful Eye */}
      <circle cx="56" cy="30" r="5" fill="#1E293B" />
      <circle cx="58" cy="28" r="1.8" fill="#FFFFFF" />
      <circle cx="55" cy="32" r="0.8" fill="#FFFFFF" />

      {/* Blushing Cheek */}
      <ellipse cx="60" cy="40" rx="3" ry="2" fill="#F472B6" opacity="0.8" />

      {/* Smiling Mouth */}
      <path
        d="M62 42C65 44 68 42 69 40"
        stroke="#065F46"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Dinosaur Feet */}
      <ellipse cx="36" cy="77" rx="7" ry="5" fill="#059669" />
      <ellipse cx="52" cy="77" rx="7" ry="5" fill="#059669" />

      {/* Delivery Cardboard Box held in hands */}
      <rect x="52" y="48" width="30" height="24" rx="4" fill="#D97706" stroke="#92400E" strokeWidth="2" />
      {/* Box Tape */}
      <rect x="64" y="48" width="6" height="24" fill="#FDE68A" />
      {/* Box grocery item sticking out */}
      <circle cx="59" cy="46" r="4" fill="#EF4444" /> {/* Apple */}
      <rect x="68" y="42" width="7" height="9" rx="1.5" fill="#3B82F6" /> {/* Milk bottle */}

      {/* Cute Dinosaur Little Arms holding the box */}
      <path
        d="M48 54C52 54 55 56 56 60"
        stroke="#10B981"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
