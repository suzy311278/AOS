'use client';

import FilterSidebar from './FilterSidebar';
import type { FilterState } from './FilterSidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  facets: React.ComponentProps<typeof FilterSidebar>['facets'];
  state: FilterState;
  setState: (s: FilterState) => void;
}

export default function FilterDrawer({ open, onClose, facets, state, setState }: Props) {
  return (
    <div
      className={`fixed inset-0 z-40 lg:hidden transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl transition-transform overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <FilterSidebar facets={facets} state={state} setState={setState} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
