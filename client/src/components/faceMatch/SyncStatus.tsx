import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { StatusBadge } from '../ui/StatusBadge';

interface SyncStatusInfo {
  workOrderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING';
  lastSyncAt: string;
  syncDetails: {
    totalPersons: number;
    syncedPersons: number;
    failedPersons: number;
  };
  errorMessage?: string;
}

export const SyncStatus: React.FC = () => {
  const [workOrderId, setWorkOrderId] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const handleCheckStatus = async () => {
    if (!workOrderId.trim()) {
      alert('請輸入施工單 ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/face-match/sync-status/${workOrderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      } else {
        const error = await response.json();
        alert(`查詢失敗: ${error.message}`);
        setSyncStatus(null);
      }
    } catch (error) {
      alert('查詢失敗: 網路錯誤');
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/face-match/test-connection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.data.connected);
        if (data.data.connected) {
          alert('FaceMatch 連線正常');
        } else {
          alert('FaceMatch 連線失敗');
        }
      } else {
        const error = await response.json();
        alert(`連線測試失敗: ${error.message}`);
        setIsConnected(false);
      }
    } catch (error) {
      alert('連線測試失敗: 網路錯誤');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'danger';
      case 'PARTIAL':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'info';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'SUCCESS':
        return '同步成功';
      case 'FAILED':
        return '同步失敗';
      case 'PARTIAL':
        return '部分成功';
      case 'PENDING':
        return '待處理';
      default:
        return '未知狀態';
    }
  };

  return (
    <div className="space-y-6">
      {/* 連線狀態 */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">FaceMatch 連線狀態</h2>
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              {isLoading ? '測試中...' : '測試連線'}
            </Button>
          </div>
          
          {isConnected !== null && (
            <div className="flex items-center space-x-2">
              <StatusBadge variant={isConnected ? 'success' : 'danger'}>
                {isConnected ? '連線正常' : '連線失敗'}
              </StatusBadge>
              <span className="text-sm text-gray-500">
                最後檢查: {new Date().toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* 同步狀態查詢 */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">同步狀態查詢</h2>
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="text"
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                placeholder="請輸入施工單 ID"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckStatus();
                  }
                }}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleCheckStatus}
              disabled={isLoading || !workOrderId.trim()}
            >
              {isLoading ? '查詢中...' : '查詢狀態'}
            </Button>
          </div>

          {syncStatus && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">施工單: {syncStatus.workOrderId}</h3>
                  <p className="text-sm text-gray-500">
                    最後同步: {syncStatus.lastSyncAt}
                  </p>
                </div>
                <StatusBadge variant={getStatusVariant(syncStatus.status)}>
                  {getStatusText(syncStatus.status)}
                </StatusBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-2xl font-semibold text-gray-900">
                    {syncStatus.syncDetails.totalPersons}
                  </p>
                  <p className="text-sm text-gray-500">總人數</p>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-2xl font-semibold text-green-600">
                    {syncStatus.syncDetails.syncedPersons}
                  </p>
                  <p className="text-sm text-gray-500">已同步</p>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <p className="text-2xl font-semibold text-red-600">
                    {syncStatus.syncDetails.failedPersons}
                  </p>
                  <p className="text-sm text-gray-500">失敗</p>
                </div>
              </div>

              {syncStatus.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <svg className="flex-shrink-0 h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">錯誤訊息</h3>
                      <p className="text-sm text-red-700 mt-1">{syncStatus.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: 重新同步
                    alert('重新同步功能開發中');
                  }}
                  disabled={syncStatus.status === 'PENDING'}
                >
                  重新同步
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 系統狀態監控 */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">系統狀態監控</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">API 服務</p>
                  <p className="text-xs text-green-600">正常運行</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">資料庫</p>
                  <p className="text-xs text-green-600">連線正常</p>
                </div>
              </div>
            </div>

            <div className={`${isConnected === null ? 'bg-gray-50' : isConnected ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    isConnected === null ? 'bg-gray-400' : 
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isConnected === null ? 'text-gray-800' : 
                    isConnected ? 'text-green-800' : 'text-red-800'
                  }`}>
                    FaceMatch
                  </p>
                  <p className={`text-xs ${
                    isConnected === null ? 'text-gray-600' : 
                    isConnected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isConnected === null ? '未測試' : isConnected ? '連線正常' : '連線失敗'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">同步服務</p>
                  <p className="text-xs text-blue-600">待機中</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};