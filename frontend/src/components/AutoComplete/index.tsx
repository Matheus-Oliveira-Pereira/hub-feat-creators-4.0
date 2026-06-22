import { useState, useEffect, useRef } from 'react';
import { AutoComplete as PrimeAutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

interface AutoCompleteOption {
  id: string;
  label: string;
}

interface AutoCompleteProps {
  value: AutoCompleteOption | null;
  onChange: (value: AutoCompleteOption | null) => void;
  searchFn: (query: string) => Promise<AutoCompleteOption[]>;
  placeholder?: string;
  className?: string;
  id?: string;
  delay?: number;
}

function AutoComplete({ value, onChange, searchFn, placeholder = 'Buscar...', className, id, delay = 300 }: AutoCompleteProps) {
  const [suggestions, setSuggestions] = useState<AutoCompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = (event: AutoCompleteCompleteEvent) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchFn(event.query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <PrimeAutoComplete
      id={id}
      value={value}
      suggestions={suggestions}
      completeMethod={search}
      onChange={(e) => onChange(e.value)}
      field="label"
      placeholder={placeholder}
      className={className}
      loading={loading}
      dropdown
    />
  );
}

export default AutoComplete;
