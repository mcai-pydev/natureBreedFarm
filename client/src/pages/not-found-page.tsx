import React from 'react';
import { Link } from 'wouter';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <Link href="/">
          <a className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
            Return Home
          </a>
        </Link>
      </div>
    </div>
  );
}