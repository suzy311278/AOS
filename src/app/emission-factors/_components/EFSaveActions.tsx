'use client';

/**
 * EFSaveActions
 *
 * Save-star button + "Add to cite list" dropdown for the single-factor page.
 * Hidden for signed-out users (a sign-in prompt shows instead).
 * Signed-in state is passed as a prop (resolved server-side) to avoid a
 * fetch on first render; toggles optimistically and reconciles via the API.
 */

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Star, Plus, FileStack, Check, LogIn } from 'lucide-react';
import Link from 'next/link';

interface CiteList {
  id: string;
  name: string;
}

export function EFSaveActions({
  factorId,
  initialSaved = false,
}: {
  factorId: string;
  initialSaved?: boolean;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [lists, setLists] = useState<CiteList[] | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addedTo, setAddedTo] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    if (lists === null) {
      fetch('/api/emission-factors/cite-lists')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ok) setLists(d.lists ?? []);
        })
        .catch(() => {});
    }
    fetch('/api/emission-factors/saved')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.ok) return;
        const rows: Array<{ factorId: string }> = d.saved ?? [];
        if (rows.some((s) => s.factorId === factorId)) setSaved(true);
      })
      .catch(() => {});
  }, [isSignedIn, lists, factorId]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold text-gt-text-muted hover:border-[#95D5B2] hover:text-[#2D6A4F]"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        Sign in to save
      </Link>
    );
  }

  async function handleToggleSave() {
    if (pending) return;
    setPending(true);
    const prev = saved;
    setSaved(!prev);
    try {
      const res = await fetch('/api/emission-factors/saved', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ factorId }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setSaved(Boolean(data.saved));
      } else {
        setSaved(prev);
      }
    } catch {
      setSaved(prev);
    } finally {
      setPending(false);
    }
  }

  async function handleAddToList(listId: string) {
    try {
      const res = await fetch(
        `/api/emission-factors/cite-lists/${listId}/items`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ factorId }),
        },
      );
      if (res.ok) {
        setAddedTo(listId);
        setTimeout(() => {
          setAddedTo(null);
          setDropdownOpen(false);
        }, 1200);
      }
    } catch {
      /* ignore */
    }
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/emission-factors/cite-lists', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.id) {
        setLists((curr) => [...(curr ?? []), { id: data.id, name }]);
        setNewListName('');
        await handleAddToList(data.id);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 relative">
      <button
        type="button"
        onClick={handleToggleSave}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          saved
            ? 'border-[#2D6A4F] bg-[#DCEEE4] text-[#2D6A4F]'
            : 'border-gt-border-light bg-white text-gt-text-muted hover:border-[#95D5B2] hover:text-[#2D6A4F]'
        }`}
      >
        <Star
          className={`h-3.5 w-3.5 ${saved ? 'fill-[#2D6A4F]' : ''}`}
          aria-hidden
        />
        {saved ? 'Saved' : 'Save'}
      </button>

      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-gt-border-light bg-white px-3 py-1.5 text-xs font-semibold text-gt-text-muted hover:border-[#95D5B2] hover:text-[#2D6A4F]"
      >
        <FileStack className="h-3.5 w-3.5" aria-hidden />
        Add to cite list
      </button>

      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-gt-border-light bg-white shadow-gt-card-lg p-3 z-30">
          <div className="text-xs uppercase tracking-[0.08em] text-gt-text-dim mb-2">
            Your lists
          </div>
          {lists === null && (
            <div className="text-xs text-gt-text-muted">Loading.</div>
          )}
          {lists && lists.length === 0 && (
            <div className="text-xs text-gt-text-muted">
              No lists yet. Create one below.
            </div>
          )}
          {lists?.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => handleAddToList(l.id)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm text-gt-text hover:bg-gt-pale"
            >
              <span className="truncate">{l.name}</span>
              {addedTo === l.id ? (
                <Check className="h-3.5 w-3.5 text-[#2D6A4F]" aria-hidden />
              ) : (
                <Plus className="h-3.5 w-3.5 text-gt-text-dim" aria-hidden />
              )}
            </button>
          ))}

          <form
            onSubmit={handleCreateList}
            className="mt-3 pt-3 border-t border-gt-border-light flex items-center gap-2"
          >
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name"
              className="flex-1 rounded-md border border-gt-border-light bg-white px-2 py-1.5 text-xs text-gt-text outline-none focus:border-[#2D6A4F]"
            />
            <button
              type="submit"
              disabled={creating || !newListName.trim()}
              className="rounded-md bg-[#2D6A4F] text-white text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
            >
              Create
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
