// src/components/NGOCard.tsx
import { Globe, Heart, Loader2 } from 'lucide-react';
import type { NGOProfile } from '../types';

interface NGOCardProps {
  ngo: NGOProfile;
  onEnroll: (ngoId: string) => Promise<void>;
  isEnrolling: boolean;
  enrollmentStatus?: 'pending' | 'confirmed' | 'rejected';
}

export function NGOCard({ ngo, onEnroll, isEnrolling, enrollmentStatus }: NGOCardProps) {
  const buttonText = isEnrolling
    ? 'Enrolling...'
    : enrollmentStatus === 'pending'
    ? 'Enrollment Pending'
    : enrollmentStatus === 'confirmed'
    ? 'Enrolled'
    : 'Join Organization';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="relative h-48">
        <img
          src={ngo.logo_url || 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'}
          alt={ngo.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{ngo.name}</h3>
        <p className="mt-2 text-gray-600 line-clamp-3">{ngo.description}</p>
        <div className="mt-4 space-y-2">
          {ngo.website && (
            <a
              href={ngo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-500 hover:text-rose-600 transition-colors"
            >
              <Globe className="h-5 w-5 mr-2" />
              <span>Visit Website</span>
            </a>
          )}
          <div className="flex items-center text-gray-500">
            <Heart className="h-5 w-5 mr-2" />
            <span>{ngo.cause_areas.join(', ')}</span>
          </div>
        </div>
        <button
          onClick={() => onEnroll(ngo.id)}
          disabled={isEnrolling || enrollmentStatus === 'pending' || enrollmentStatus === 'confirmed'}
          className={`mt-6 w-full py-2 px-4 rounded-md text-white font-medium transition-colors flex items-center justify-center
            ${isEnrolling || enrollmentStatus === 'pending' || enrollmentStatus === 'confirmed' ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
        >
          {isEnrolling ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              {buttonText}
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </div>
  );
}