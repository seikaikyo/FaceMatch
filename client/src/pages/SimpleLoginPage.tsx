import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody } from '../components/ui';
import { useAuthStore } from '../store/authStore';

export const SimpleLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('請輸入使用者名稱');
      return;
    }
    
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    try {
      console.log('Login attempt:', { username, password });
      setError('');
      setIsLoading(true);
      
      await login(username, password);
      
      console.log('Login successful, navigating...');
      navigate('/contractors');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || '登入失敗，請檢查帳號密碼');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            FaceMatch 承攬商管理系統
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            請登入您的帳號以繼續
          </p>
        </div>
        
        <Card>
          <CardBody>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  使用者名稱
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入使用者名稱"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="輸入密碼"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? '登入中...' : '登入'}
              </Button>
            </form>
            
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>測試帳號: admin</p>
              <p>測試密碼: admin123</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};