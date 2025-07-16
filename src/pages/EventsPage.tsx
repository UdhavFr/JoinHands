import React, { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { EventCard } from '../components/EventCard';
import type { Event } from '../types';

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<Map<string, 'pending' | 'confirmed' | 'cancelled'>>(new Map());

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      const formattedEvents = eventsData?.map((event) => ({
        ...event,
        image_url: event.image_url || undefined,
      })) || [];
      setEvents(formattedEvents);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: registrations, error: regError } = await supabase
          .from('event_registrations')
          .select('event_id, status')
          .eq('user_id', user.id);

        if (regError) throw regError;

        const registrationMap = new Map<string, 'pending' | 'confirmed' | 'cancelled'>();
        registrations?.forEach((reg) => registrationMap.set(reg.event_id, reg.status as 'pending' | 'confirmed' | 'cancelled'));
        setUserRegistrations(registrationMap);
      }
    } catch (error) {
      console.error('Failed to load events data:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const eventsChannel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchData()
      )
      .subscribe((status, err) => {
        if (err) console.error('Events channel subscription error:', err);
      });

    const registrationsChannel = supabase
      .channel('realtime-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations' },
        (payload) => {
          const newRow = (payload as any).new || {};
          const { event_id, status } = newRow;
          if (event_id && status) {
            setUserRegistrations((prev) => {
              const newMap = new Map(prev);
              newMap.set(event_id, status as 'pending' | 'confirmed' | 'cancelled');
              return newMap;
            });
          }
          fetchData();
        }
      )
      .subscribe((status, err) => {
        if (err) console.error('Registrations channel subscription error:', err);
      });

    return () => {
      eventsChannel.unsubscribe();
      registrationsChannel.unsubscribe();
    };
  }, []);

  const handleRegister = async (eventId: string) => {
    try {
      setRegistering(eventId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to register for events');
        return;
      }

      const existingStatus = userRegistrations.get(eventId);
      if (existingStatus) {
        toast.error(`Registration is ${existingStatus}. No further action needed.`);
        return;
      }

      const { error: registrationError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'pending',
        });

      if (registrationError) {
        if (registrationError.code === '23505') {
          throw new Error('Registration request already submitted');
        }
        throw registrationError;
      }

      setUserRegistrations((prev) => new Map(prev.set(eventId, 'pending')));
      toast.success('Registration request submitted for admin approval!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      );
    }
    if (events.length === 0) {
      return (
        <div id="events" className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
          <p className="text-gray-600">No events found.</p>
        </div>
      );
    }
    return (
      <div id="events" className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              isRegistering={registering === event.id}
              registrationStatus={
                userRegistrations.get(event.id) === 'cancelled'
                  ? undefined
                  : (userRegistrations.get(event.id) as 'pending' | 'confirmed' | undefined)
              }
              isDisabled={userRegistrations.has(event.id) && userRegistrations.get(event.id) !== 'cancelled'}
            />
          ))}
        </div>
      </div>
    );
  }, [loading, events, userRegistrations, registering]);

  return content;
}