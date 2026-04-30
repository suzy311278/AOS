'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const STORAGE_KEY = 'sustainability_academy';
const MIGRATED_KEY = 'sa_cloud_migrated';

export default function MigrationBanner() {
  const { isSignedIn, isLoaded } = useAuth();
  const [show, setShow] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (typeof window === 'undefined') return;

    // Already migrated this browser
    if (localStorage.getItem(MIGRATED_KEY)) return;

    // Check for local progress
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed.courses || Object.keys(parsed.courses).length === 0) return;

      // Check if cloud already has data
      fetch('/api/progress')
        .then(r => r.json())
        .then((rows: any[]) => {
          if (rows.length === 0) setShow(true);
        })
        .catch(() => {});
    } catch {}
  }, [isSignedIn, isLoaded]);

  async function handleMigrate() {
    setMigrating(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const res = await fetch('/api/progress/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: parsed.courses }),
      });

      if (res.ok) {
        localStorage.setItem(MIGRATED_KEY, '1');
        setResult('Progress imported successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult('Import failed. Please try again.');
        setMigrating(false);
      }
    } catch {
      setResult('Import failed. Please try again.');
      setMigrating(false);
    }
  }

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-blue-800">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {result ?? 'We found learning progress from a previous session. Import it to your account?'}
          </span>
        </div>
        {!result && (
          <div className="flex gap-2">
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="text-sm font-semibold px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {migrating ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={() => {
                localStorage.setItem(MIGRATED_KEY, '1');
                setShow(false);
              }}
              className="text-sm font-medium px-3 py-1.5 text-blue-600 hover:text-blue-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
