import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logAgencyAction } from '@/features/agency/lib/audit';

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
  const { user } = useAuth();
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
          .select('booking_date, participants, status, departure_id')
          .eq('package_id', packageId),
      ]);
      if (depErr) throw depErr;

      // Count by departure_id, mirroring the DB capacity trigger (AGY-18).
      // Legacy free-date bookings (null departure_id) fall back to the date
      // match so they aren't double-counted against linked bookings.
      const bookedById = new Map<string, number>();
      const legacyByDate = new Map<string, number>();
      (bookings || []).forEach((b) => {
        if (b.status === 'cancelled') return;
        if (b.departure_id) {
          bookedById.set(b.departure_id, (bookedById.get(b.departure_id) || 0) + (b.participants || 0));
        } else {
          legacyByDate.set(b.booking_date, (legacyByDate.get(b.booking_date) || 0) + (b.participants || 0));
        }
      });

      setDepartures(
        (deps || []).map((d) => {
          const booked = (bookedById.get(d.id) || 0) + (legacyByDate.get(d.departure_date) || 0);
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
    if (!error) {
      void logAgencyAction(user?.id, {
        actionType: 'departure_added',
        description: `Departure ${input.departure_date} added to package ${packageId}`,
        entityType: 'package',
        entityId: packageId,
      });
      await fetchDepartures();
    }
    return { error };
  };

  const updateDeparture = async (id: string, updates: Partial<NewDeparture & { status: string }>) => {
    const { error } = await supabase.from('package_departures').update(updates).eq('id', id);
    if (!error) {
      void logAgencyAction(user?.id, {
        actionType: updates.status === 'cancelled' ? 'departure_cancelled' : 'departure_updated',
        description: `Departure ${id} ${updates.status === 'cancelled' ? 'cancelled' : 'updated'}`,
        entityType: 'departure',
        entityId: id,
      });
      await fetchDepartures();
    }
    return { error };
  };

  const deleteDeparture = async (id: string) => {
    const { error } = await supabase.from('package_departures').delete().eq('id', id);
    if (!error) {
      void logAgencyAction(user?.id, {
        actionType: 'departure_deleted',
        description: `Departure ${id} deleted`,
        entityType: 'departure',
        entityId: id,
      });
      await fetchDepartures();
    }
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
