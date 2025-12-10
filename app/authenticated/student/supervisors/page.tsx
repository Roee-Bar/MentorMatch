import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import BrowseSupervisorsClient from './_components/BrowseSupervisorsClient';

export default function BrowseSupervisorsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading supervisors..." />}>
      <BrowseSupervisorsClient />
    </Suspense>
  );
}
