import React from 'react';
import { Button } from '../ui';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">管理控制台</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            歡迎，<span className="font-medium">{user?.username}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
          >
            登出
          </Button>
        </div>
      </div>
    </header>
  );
};