import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { debounce } from '../../utils/debounce';
import { GeocodeSuggestion, searchAddresses } from '../../utils/osmGeocoding';

interface PickupLocationSearchProps {
  onSelect: (suggestion: GeocodeSuggestion) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PickupLocationSearch({
  onSelect,
  disabled = false,
  placeholder = 'Type pickup address (e.g. Madjaas Payatas, Quezon City)',
  className = '',
}: PickupLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(
    debounce(async (text: string) => {
      if (text.trim().length < 2) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchAddresses(text);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSearchError('Address search failed. Try a shorter query.');
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350),
    []
  );

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    runSearch(value);
  };

  const handleSelect = (item: GeocodeSuggestion) => {
    setQuery(item.label);
    setOpen(false);
    setSuggestions([]);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-xl border border-pink-200 bg-white py-3 pl-10 pr-3 text-sm shadow-sm outline-none ring-pink-200 focus:ring-2 disabled:opacity-60"
        />
      </div>
      {isSearching && (
        <p className="mt-1 text-xs text-gray-500">Searching addresses…</p>
      )}
      {searchError && <p className="mt-1 text-xs text-red-600">{searchError}</p>}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-[1200] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-pink-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                <span className="text-gray-800">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
