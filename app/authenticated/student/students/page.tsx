import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import BrowseStudentsClient from './_components/BrowseStudentsClient';

export default function BrowseStudentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading students..." />}>
      <BrowseStudentsClient />
    </Suspense>
  );
}

