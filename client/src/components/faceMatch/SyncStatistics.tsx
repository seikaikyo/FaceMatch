import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';

interface SyncStats {
  total: number;
  success: number;
  failed: number;
  partial: number;
  pending: number;
}

export const SyncStatistics: React.FC = () => {
  const [stats, setStats] = useState<SyncStats>({
    total: 0,
    success: 0,
    failed: 0,
    partial: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/face-match/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setLastUpdated(new Date().toLocaleString());
      } else {
        console.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // 每 30 秒自動刷新統計資料
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSuccessRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.success / stats.total) * 100);
  };

  const getStatusColor = (type: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (type) {
      case 'success':
        return 'success';
      case 'failed':
        return 'danger';
      case 'partial':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">同步統計</h2>
            <div className="text-sm text-gray-500">
              最後更新: {lastUpdated}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* 總計 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">總計</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            {/* 成功 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">成功</p>
                  <p className="text-2xl font-semibold text-green-900">{stats.success}</p>
                </div>
              </div>
            </div>

            {/* 失敗 */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">失敗</p>
                  <p className="text-2xl font-semibold text-red-900">{stats.failed}</p>
                </div>
              </div>
            </div>

            {/* 部分成功 */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">部分成功</p>
                  <p className="text-2xl font-semibold text-yellow-900">{stats.partial}</p>
                </div>
              </div>
            </div>

            {/* 待處理 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">待處理</p>
                  <p className="text-2xl font-semibold text-blue-900">{stats.pending}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 成功率指標 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">同步成功率</h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${getSuccessRate()}%` }}
                ></div>
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {getSuccessRate()}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <StatusBadge variant="success" size="sm">
                成功: {stats.success}
              </StatusBadge>
            </div>
            <div className="text-center">
              <StatusBadge variant="danger" size="sm">
                失敗: {stats.failed}
              </StatusBadge>
            </div>
            <div className="text-center">
              <StatusBadge variant="warning" size="sm">
                部分: {stats.partial}
              </StatusBadge>
            </div>
            <div className="text-center">
              <StatusBadge variant="info" size="sm">
                待處理: {stats.pending}
              </StatusBadge>
            </div>
          </div>
        </div>
      </Card>

      {/* 詳細分析 */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">詳細分析</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">總同步次數</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">成功率</span>
              <span className={`font-medium ${getSuccessRate() >= 90 ? 'text-green-600' : getSuccessRate() >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                {getSuccessRate()}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">失敗率</span>
              <span className="font-medium text-red-600">
                {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">待處理數量</span>
              <span className={`font-medium ${stats.pending > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                {stats.pending}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};