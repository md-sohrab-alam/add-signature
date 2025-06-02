'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Redirect to the main app
    window.location.href = '/add-signature/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the Digital Signature App</p>
      </div>
    </div>
  );
} 