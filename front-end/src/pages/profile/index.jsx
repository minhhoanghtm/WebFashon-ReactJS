import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/user.api';

const Profile = () => {
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await userApi.getMe();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center text-red-600">
        <h3>Failed to load profile. Please sign in again.</h3>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm mt-12">
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <img
          src={userProfile.avatar_url || 'https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg'}
          alt={userProfile.fullName}
          className="h-20 w-20 rounded-full object-cover border border-gray-200"
        />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{userProfile.fullName}</h2>
          <span className="inline-block mt-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 border border-indigo-100">
            Role: {userProfile.role}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase">Email Address</h4>
          <p className="mt-1 text-sm font-semibold text-gray-800">{userProfile.email}</p>
        </div>
        {userProfile.birthday && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase">Birthday</h4>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {new Date(userProfile.birthday).toLocaleDateString()}
            </p>
          </div>
        )}
        {userProfile.sex && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase">Gender</h4>
            <p className="mt-1 text-sm font-semibold text-gray-800 capitalize">{userProfile.sex}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
