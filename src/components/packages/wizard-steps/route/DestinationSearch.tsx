import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFzb29vbSIsImEiOiJjbWp5bmQwNzIxaGt0M2VzOWhnbGQwbzhvIn0.B__V-cVYI0fJZ6Fc9YtD-w';

interface SearchResult {
  id: string;
  name: string;
  placeName: string;
  latitude: number;
  longitude: number;
}

interface DestinationSearchProps {
  onSelect: (result: SearchResult) => void;
  isRTL?: boolean;
}

export function DestinationSearch({ onSelect, isRTL = false }: DestinationSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region,country&limit=5`
      );
      const data = await response.json();
      
      const searchResults: SearchResult[] = data.features.map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        placeName: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0]
      }));
      
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    searchPlaces(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            type="text"
            placeholder={t('packageWizard.searchDestination', 'Search for a destination...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading} variant="secondary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`w-full p-3 hover:bg-muted flex items-center gap-3 text-left border-b last:border-b-0 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.name}</p>
                <p className="text-sm text-muted-foreground truncate">{result.placeName}</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {showResults && query && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          {t('packageWizard.noResultsFound', 'No destinations found')}
        </div>
      )}
    </div>
  );
}
