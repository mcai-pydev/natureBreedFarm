// client/src/pages/rabbit-breeding-page.tsx

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PawPrint } from "lucide-react";

interface Animal {
  id: number;
  animalId: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  notes?: string;
  parentMaleId?: number | null;
  parentFemaleId?: number | null;
}

export default function RabbitBreedingPage() {
  const { data: animals, isLoading, error } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
    select: (data) => data.filter(animal => animal.type === 'rabbit')
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Error Loading Rabbits</h1>
        <p className="mt-2 text-gray-600">
          {(error as Error).message || "Failed to load rabbit data"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <PawPrint className="h-8 w-8 mr-2 text-primary" />
        <h1 className="text-2xl font-bold">Rabbit Breeding Dashboard</h1>
      </div>
      
      <div className="stats bg-primary/10 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat">
          <div className="stat-title text-gray-600">Total Rabbits</div>
          <div className="stat-value text-primary">{animals?.length || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title text-gray-600">Males</div>
          <div className="stat-value text-blue-500">{animals?.filter(a => a.gender === 'male').length || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title text-gray-600">Females</div>
          <div className="stat-value text-pink-500">{animals?.filter(a => a.gender === 'female').length || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title text-gray-600">Active</div>
          <div className="stat-value text-green-500">{animals?.filter(a => a.status === 'active').length || 0}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {animals && animals.map((rabbit) => (
              <tr key={rabbit.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rabbit.animalId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{rabbit.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{rabbit.breed}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${rabbit.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                    {rabbit.gender}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getAge(rabbit.dateOfBirth)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${rabbit.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {rabbit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{rabbit.notes || "-"}</td>
              </tr>
            ))}
            {animals && animals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No rabbits found in the system
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
