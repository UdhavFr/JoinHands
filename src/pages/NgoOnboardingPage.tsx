// src/pages/NgoOnboardingPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { RequireAuth } from '../components/RequireAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function NgoOnboardingPageInner() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [causeAreas, setCauseAreas] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ngo_profiles')
        .insert([{
          user_id: user.id,
          name,
          description,
          website,
          cause_areas: causeAreas.split(',').map(s => s.trim()),
        }]);

      if (error) throw error;
      toast.success('NGO profile created! Redirecting to dashboard...');
      navigate('/ngo/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">NGO Onboarding</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* name, description, website, causeAreas fields */}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="NGO Name" required className="w-full px-3 py-2 border rounded" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required className="w-full px-3 py-2 border rounded" />
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" className="w-full px-3 py-2 border rounded" />
        <input value={causeAreas} onChange={e => setCauseAreas(e.target.value)} placeholder="Cause areas (comma‑separated)" className="w-full px-3 py-2 border rounded" />
        <button type="submit" disabled={loading} className="w-full bg-rose-600 text-white py-2 rounded">
          {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}

export function NgoOnboardingPage() {
  return (
    <RequireAuth role="ngo">
      <NgoOnboardingPageInner />
    </RequireAuth>
  );
}
