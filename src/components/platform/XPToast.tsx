'use client';

import { useEffect, useState } from 'react';

interface Props {
  xp: number;
  visible: boolean;
  onDone: () => void;
}

export default function XPToast({ xp, visible, onDone }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible || xp <= 0) return;
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [visible, xp, onDone]);

  if (!visible && !show) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/25 font-semibold text-sm">
        <span className="text-base">+{xp}</span>
        <span>XP earned!</span>
      </div>
    </div>
  );
}
