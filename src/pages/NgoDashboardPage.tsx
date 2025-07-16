// src/pages/NgoDashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { NGOProfile, Event, EventRegistration } from '../types';

interface NGOEnrollment {
  id: string;
  user_id: string;
  ngo_id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function NgoDashboardPage() {
  const [profile, setProfile] = useState<NGOProfile | null>(null);
  const [eventRegs, setEventRegs] = useState<(EventRegistration & { event: Event })[]>([]);
  const [ngoEnrolls, setNgoEnrolls] = useState<NGOEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: ngoProfile, error: profileError } = await supabase
        .from('ngo_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileError || !ngoProfile) {
        console.error('Error fetching NGO profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile({
        id: ngoProfile.id,
        user_id: ngoProfile.user_id,
        name: ngoProfile.name,
        description: ngoProfile.description,
        cause_areas: ngoProfile.cause_areas,
        logo_url: ngoProfile.logo_url ?? undefined,
        website: ngoProfile.website ?? undefined,
        created_at: ngoProfile.created_at ?? '',
      });

      const { data: eventIdsData } = await supabase
        .from('events')
        .select('id')
        .eq('ngo_id', ngoProfile.id);
      const eventIds = eventIdsData?.map(e => e.id) ?? [];

      const { data: regs, error: regsError } = await supabase
        .from('event_registrations')
        .select('*, event: events(*)')
        .in('event_id', eventIds);
      if (regsError) console.error('Error fetching registrations:', regsError);
      else if (regs) setEventRegs(regs as (EventRegistration & { event: Event })[]);

      const { data: enrolls, error: enrollError } = await supabase
        .from('ngo_enrollments')
        .select('*, users(id, full_name, avatar_url)')
        .eq('ngo_id', ngoProfile.id);
      if (enrollError) console.error('Error fetching enrollments:', enrollError);
      else if (enrolls) setNgoEnrolls(enrolls as NGOEnrollment[]);

      setLoading(false);
    }

    loadData();
  }, []);

  async function handleApprove(enrollmentId: string) {
    try {
      const { error } = await supabase
        .from('ngo_enrollments')
        .update({ status: 'confirmed' })
        .eq('id', enrollmentId);

      if (error) throw error;

      setNgoEnrolls(ngoEnrolls.map(enroll =>
        enroll.id === enrollmentId ? { ...enroll, status: 'confirmed' } : enroll
      ));
      toast.success('Enrollment approved');
    } catch (error) {
      console.error('Error approving enrollment:', error);
      toast.error('Failed to approve enrollment');
    }
  }

  async function handleReject(enrollmentId: string) {
    try {
      const { error } = await supabase
        .from('ngo_enrollments')
        .update({ status: 'rejected' })
        .eq('id', enrollmentId);

      if (error) throw error;

      setNgoEnrolls(ngoEnrolls.map(enroll =>
        enroll.id === enrollmentId ? { ...enroll, status: 'rejected' } : enroll
      ));
      toast.success('Enrollment rejected');
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      toast.error('Failed to reject enrollment');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">
        {profile ? `${profile.name} Dashboard` : 'NGO Dashboard'}
      </h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Your Events' Registrations</h2>
        {eventRegs.length === 0 ? (
          <p className="text-gray-600">No registrations found for your events.</p>
        ) : (
          <div className="space-y-4">
            {eventRegs.map(reg => (
              <div key={reg.id} className="p-4 bg-white rounded-lg shadow-sm">
                <p><span className="font-medium">Event:</span> {reg.event.title}</p>
                <p><span className="font-medium">User ID:</span> {reg.user_id}</p>
                <p><span className="font-medium">Status:</span> {reg.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Volunteer Enrollments</h2>
        {ngoEnrolls.length === 0 ? (
          <p className="text-gray-600">No volunteers have enrolled yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ngoEnrolls.map(enroll => (
              <div key={enroll.id} className="p-4 bg-white rounded-lg shadow-sm flex items-center space-x-4">
                {enroll.users.avatar_url && (
                  <img
                    src={enroll.users.avatar_url}
                    alt={enroll.users.full_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{enroll.users.full_name}</p>
                  <p className="text-gray-500">Status: {enroll.status}</p>
                  {enroll.status === 'pending' && (
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => handleApprove(enroll.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(enroll.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}