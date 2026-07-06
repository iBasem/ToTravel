import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DepartureRow {
  id: string;
  package_id: string;
  departure_date: string;
  return_date: string | null;
  total_seats: number;
  price_override: number | null;
  status: string;
  booked: number;
  seats_remaining: number;
}

export interface NewDeparture {
  departure_date: string;
  total_seats: number;
  price_override: number | null;
  return_date?: string | null;
}

/**
 * Agency-facing CRUD for a package's real departures (package_departures).
 * RLS enforces that only the owning agency (or an admin) can write. Seats
 * booked / remaining are derived from bookings at read time.
 */
export function useDepartures(packageId: string | undefined) {
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartures = useCallback(async () => {
    if (!packageId) {
      setDepartures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [{ data: deps, error: depErr }, { data: bookings }] = await Promise.all([
        supabase
          .from('package_departures')
          .select('*')
          .eq('package_id', packageId)
          .order('departure_date', { ascending: true }),
        supabase
          .from('package_bookings')
          .select('booking_date, participants, status')
          .eq('package_id', packageId),
      ]);
      if (depErr) throw depErr;

      const bookedByDate = new Map<string, number>();
      (bookings || []).forEach((b) => {
        if (b.status === 'cancelled') return;
        bookedByDate.set(b.booking_date, (bookedByDate.get(b.booking_date) || 0) + (b.participants || 0));
      });

      setDepartures(
        (deps || []).map((d) => {
          const booked = bookedByDate.get(d.departure_date) || 0;
          return { ...d, booked, seats_remaining: Math.max(0, d.total_seats - booked) };
        })
      );
    } catch (err) {
      console.error('Error loading departures:', err);
      setError('Failed to load departures');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  const addDeparture = async (input: NewDeparture) => {
    if (!packageId) return { error: 'No package' };
    const { error } = await supabase
      .from('package_departures')
      .insert({ package_id: packageId, ...input });
    if (!error) await fetchDepartures();
    return { error };
  };

  const updateDeparture = async (id: string, updates: Partial<NewDeparture & { status: string }>) => {
    const { error } = await supabase.from('package_departures').update(updates).eq('id', id);
    if (!error) await fetchDepartures();
    return { error };
  };

  const deleteDeparture = async (id: string) => {
    const { error } = await supabase.from('package_departures').delete().eq('id', id);
    if (!error) await fetchDepartures();
    return { error };
  };

  return {
    departures,
    loading,
    error,
    refetch: fetchDepartures,
    addDeparture,
    updateDeparture,
    deleteDeparture,
  };
}
