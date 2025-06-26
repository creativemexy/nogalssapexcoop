'use client';

import React from 'react';

const RegistrationTypeButton = ({ type, onClick }) => {
  const isCooperative = type === 'cooperative';
  const Icon = isCooperative ? (
    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ) : (
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const title = isCooperative ? 'Register as Cooperative' : 'Register as Member';
  const description = isCooperative ? 'Create a new cooperative organization' : 'Join an existing cooperative';
  const hoverBorder = isCooperative ? 'hover:border-orange-500' : 'hover:border-blue-500';
  const iconBg = isCooperative ? 'bg-orange-100 group-hover:bg-orange-200' : 'bg-blue-100 group-hover:bg-blue-200';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-xl border border-gray-200 p-6 text-center transition-all duration-300 ${hoverBorder} hover:shadow-lg`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${iconBg}`}>
        {Icon}
      </div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
};

export const RegistrationTypeSelector = ({ setRegistrationType }) => (
  <div>
    <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
      Select Registration Type
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <RegistrationTypeButton type="cooperative" onClick={() => setRegistrationType('cooperative')} />
      <RegistrationTypeButton type="member" onClick={() => setRegistrationType('member')} />
    </div>
  </div>
); 