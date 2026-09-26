'use client';

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

interface SearchContextValue {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within a SearchProvider');
  return context;
}