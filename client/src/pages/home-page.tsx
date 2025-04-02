import React from 'react';
import { Link } from 'wouter';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">Nature Breed Farm</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your comprehensive farm management solution
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/shop">
            <div className="bg-primary text-white p-6 rounded-lg shadow-md hover:bg-primary/90 transition-colors cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">Shop</h2>
              <p>Browse our selection of farm products</p>
            </div>
          </Link>
          <Link href="/orders">
            <div className="bg-secondary text-secondary-foreground p-6 rounded-lg shadow-md hover:bg-secondary/90 transition-colors cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">Order History</h2>
              <p>View your past orders and track shipments</p>
            </div>
          </Link>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">About Nature Breed Farm</h2>
          <p className="text-gray-700 mb-4">
            Nature Breed Farm is a comprehensive farm management platform designed to empower farmers 
            with cutting-edge digital tools for optimizing agricultural operations, enhancing productivity, 
            and promoting sustainable farming practices.
          </p>
          <p className="text-gray-700">
            Our platform includes tools for animal breeding tracking, inventory management, 
            order processing, and data analytics to help you make informed decisions 
            about your farming operations.
          </p>
        </div>
      </div>
    </div>
  );
}