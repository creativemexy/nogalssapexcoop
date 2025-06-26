'use client';

import { useState } from 'react';
import Link from 'next/link';
import { states } from '@/lib/data';

export default function StatesPage() {
    const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const toggleState = (stateName: string) => {
        const newExpanded = new Set(expandedStates);
        if (newExpanded.has(stateName)) {
            newExpanded.delete(stateName);
        } else {
            newExpanded.add(stateName);
        }
        setExpandedStates(newExpanded);
    };

    const filteredStates = states.filter(state =>
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.lgas.some(lga => lga.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">States & LGAs</h1>
                <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">
                    &larr; Back to Dashboard
                </Link>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search states or LGAs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{states.length}</div>
                    <div className="text-sm text-gray-600">Total States</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                        {states.reduce((total, state) => total + state.lgas.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total LGAs</div>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                        {filteredStates.length}
                    </div>
                    <div className="text-sm text-gray-600">Filtered Results</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredStates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {filteredStates.map(state => (
                            <div key={state.name} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <div 
                                    className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors"
                                    onClick={() => toggleState(state.name)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-900">{state.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                {state.lgas.length} LGAs
                                            </span>
                                            <svg 
                                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                                    expandedStates.has(state.name) ? 'rotate-180' : ''
                                                }`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                {expandedStates.has(state.name) && (
                                    <div className="px-4 py-3 bg-white">
                                        <div className="grid grid-cols-1 gap-1">
                                            {state.lgas.map(lga => (
                                                <div key={lga} className="text-sm text-gray-600 py-1 px-2 hover:bg-green-50 rounded">
                                                    {lga}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? 'No states or LGAs found matching your search.' : 'No state and LGA data provided yet.'}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4">
                <button 
                    onClick={() => setExpandedStates(new Set(states.map(s => s.name)))}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                    Expand All
                </button>
                <button 
                    onClick={() => setExpandedStates(new Set())}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                    Collapse All
                </button>
                <button 
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                    Clear Search
                </button>
            </div>
        </div>
    );
} 