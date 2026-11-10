import React from 'react';

export type MascotMood = 'ramah' | 'semangat' | 'mikir' | 'reueus';

interface BabaturanMascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
}

export const BabaturanMascot: React.FC<BabaturanMascotProps> = ({
  mood = 'ramah',
  size = 'md',
  caption,
}) => {
  const dimensions =
    size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={`${dimensions} relative shrink-0 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shadow-xs`}
        aria-label={`Maskot BABATURAN ekspresi ${mood}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          role="img"
          aria-hidden="true"
        >
          {/* Priangan Mountain Backdrop Silhouette */}
          <path
            d="M10 85 L35 55 L60 85 Z"
            fill="#D1FAE5"
            opacity="0.6"
          />
          <path
            d="M45 85 L72 50 L92 85 Z"
            fill="#A7F3D0"
            opacity="0.5"
          />

          {/* Face Base */}
          <circle
            cx="50"
            cy="56"
            r="26"
            fill="#FDE68A"
            stroke="#065F46"
            strokeWidth="2.5"
          />

          {/* Traditional Sundanese Iket (Headband Totopong) */}
          <path
            d="M22 46 C24 28, 76 28, 78 46 L82 40 L74 32 L50 22 L26 32 L18 40 Z"
            fill="#065F46"
          />
          {/* Batik Geometric Accent on Iket */}
          <path
            d="M25 44 Q50 36 75 44"
            stroke="#D97706"
            strokeWidth="3"
            fill="none"
          />
          <polygon points="50,24 55,32 45,32" fill="#F59E0B" />

          {/* Eyes based on mood */}
          {mood === 'semangat' ? (
            <>
              <path
                d="M36 53 Q40 48 44 53"
                stroke="#0F172A"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M56 53 Q60 48 64 53"
                stroke="#0F172A"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : mood === 'mikir' ? (
            <>
              <circle cx="40" cy="52" r="3.2" fill="#0F172A" />
              <circle cx="60" cy="50" r="3.2" fill="#0F172A" />
              <path
                d="M35 46 L44 47"
                stroke="#065F46"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M55 44 Q60 41 65 45"
                stroke="#065F46"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              <circle cx="40" cy="53" r="3.2" fill="#0F172A" />
              <circle cx="60" cy="53" r="3.2" fill="#0F172A" />
              <circle cx="41" cy="51.8" r="1" fill="#FFFFFF" />
              <circle cx="61" cy="51.8" r="1" fill="#FFFFFF" />
            </>
          )}

          {/* Warm Cheeks */}
          <ellipse cx="33" cy="60" rx="4" ry="2.2" fill="#F59E0B" opacity="0.45" />
          <ellipse cx="67" cy="60" rx="4" ry="2.2" fill="#F59E0B" opacity="0.45" />

          {/* Smile / Mouth */}
          {mood === 'mikir' ? (
            <path
              d="M45 66 Q50 65 55 67"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : mood === 'reueus' ? (
            <path
              d="M39 63 Q50 74 61 63 Z"
              fill="#065F46"
            />
          ) : (
            <path
              d="M41 63 Q50 71 59 63"
              stroke="#0F172A"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Mini Angklung / Aksara Badge at bottom corner */}
          <rect
            x="68"
            y="68"
            width="20"
            height="20"
            rx="5"
            fill="#059669"
          />
          <text
            x="78"
            y="82"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontWeight="bold"
          >
            ᮞᮥ
          </text>
        </svg>
      </div>
      {caption && (
        <div className="text-xs text-slate-600 leading-relaxed max-w-xs">
          {caption}
        </div>
      )}
    </div>
  );
};
