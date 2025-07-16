import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { NGOCard } from '../components/NGOCard';
import type { NGOProfile } from '../types';

export function NGOsPage() {
  const [ngos, setNgos] = useState<NGOProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<Map<string, 'pending' | 'confirmed' | 'rejected'>>(new Map());

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const { data: ngoData, error: ngoError } = await supabase
        .from('ngo_profiles')
        .select('*')
        .order('name');

      if (ngoError) throw ngoError;

      const formattedData = ngoData.map((ngo) => ({
        ...ngo,
        logo_url: ngo.logo_url ?? undefined,
        website: ngo.website ?? undefined,
        created_at: ngo.created_at ?? '',
        updated_at: ngo.updated_at ?? '',
      }));
      setNgos(formattedData);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollments, error: enrollError } = await supabase
          .from('ngo_enrollments')
          .select('ngo_id, status')
          .eq('user_id', user.id);

        if (enrollError) throw enrollError;
        const enrollmentMap = new Map(enrollments.map((e) => [e.ngo_id, e.status as 'pending' | 'confirmed' | 'rejected']));
        setUserEnrollments(enrollmentMap);
      }
    } catch (error) {
      console.error('Error fetching NGOs or enrollments:', error);
      toast.error('Failed to load NGOs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOs();

    const ngoChannel = supabase
      .channel('realtime-ngos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_profiles' }, () => fetchNGOs())
      .subscribe();

    const enrollmentChannel = supabase
      .channel('realtime-enrollments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ngo_enrollments' }, () => {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) fetchNGOs();
        });
      })
      .subscribe();

    return () => {
      ngoChannel.unsubscribe();
      enrollmentChannel.unsubscribe();
    };
  }, []);

  const handleEnroll = async (ngoId: string) => {
    try {
      setEnrolling(ngoId);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please sign in to enroll in NGOs');
        return;
      }

      const existingStatus = userEnrollments.get(ngoId);
      if (existingStatus) {
        toast.error(`Enrollment is ${existingStatus}. No further action needed.`);
        return;
      }

      const { error } = await supabase
        .from('ngo_enrollments')
        .upsert([{ user_id: user.id, ngo_id: ngoId, status: 'pending' }], { onConflict: 'user_id,ngo_id' });

      if (error) throw error;

      setUserEnrollments(new Map(userEnrollments.set(ngoId, 'pending')));
      toast.success('Enrollment request sent successfully!');
    } catch (error: any) {
      console.error('Error enrolling in NGO:', error);
      toast.error(error.message || 'Failed to enroll in NGO');
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div id="ngos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Partner NGOs</h2>
          <p className="mt-2 text-lg text-gray-600">
            Join hands with these amazing organizations making a difference in our community.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {ngos.map((ngo) => (
            <NGOCard
              key={ngo.id}
              ngo={ngo}
              onEnroll={handleEnroll}
              isEnrolling={enrolling === ngo.id}
              enrollmentStatus={userEnrollments.get(ngo.id)}
            />
          ))}
        </div>
        {ngos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No NGOs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}