import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Table } from '../ui/Table';
import { StatusBadge } from '../ui/StatusBadge';

interface BatchSyncResult {
  totalWorkOrders: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    workOrderId: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    message: string;
    syncDetails?: {
      totalPersons: number;
      syncedPersons: number;
      failedPersons: number;
    };
  }>;
}

export const BatchSync: React.FC = () => {
  const [workOrderIds, setWorkOrderIds] = useState('');
  const [forceSync, setForceSync] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<BatchSyncResult | null>(null);

  const handleBatchSync = async () => {
    const ids = workOrderIds
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (ids.length === 0) {
      alert('請輸入至少一個施工單 ID');
      return;
    }

    if (ids.length > 20) {
      alert('一次最多只能同步 20 個施工單');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/face-match/batch-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          workOrderIds: ids,
          forceSync,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSyncResult(data.data);
        alert(`批次同步完成：成功 ${data.data.successCount}，失敗 ${data.data.failedCount}`);
      } else {
        const error = await response.json();
        alert(`批次同步失敗: ${error.message}`);
      }
    } catch (error) {
      alert('批次同步失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleSync = async (workOrderId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/face-match/sync/${workOrderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          forceSync,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`施工單 ${workOrderId} 同步成功`);
        // 刷新結果顯示
        if (syncResult) {
          const updatedResults = syncResult.results.map(result => 
            result.workOrderId === workOrderId 
              ? { ...result, status: data.data.status as any, message: data.message }
              : result
          );
          setSyncResult({
            ...syncResult,
            results: updatedResults
          });
        }
      } else {
        const error = await response.json();
        alert(`同步失敗: ${error.message}`);
      }
    } catch (error) {
      alert('同步失敗: 網路錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'danger';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'SUCCESS':
        return '同步成功';
      case 'PARTIAL':
        return '部分成功';
      case 'FAILED':
        return '同步失敗';
      default:
        return '未知狀態';
    }
  };

  const columns = [
    {
      key: 'workOrderId',
      title: '施工單 ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'status',
      title: '狀態',
      render: (value: string) => (
        <StatusBadge variant={getStatusVariant(value)} size="sm">
          {getStatusText(value)}
        </StatusBadge>
      )
    },
    {
      key: 'syncDetails',
      title: '同步詳情',
      render: (value: any) => {
        if (!value) return <span className="text-gray-400">-</span>;
        return (
          <div className="text-sm">
            <span className="text-gray-600">總計: {value.totalPersons}</span>
            <span className="mx-2">|</span>
            <span className="text-green-600">成功: {value.syncedPersons}</span>
            <span className="mx-2">|</span>
            <span className="text-red-600">失敗: {value.failedPersons}</span>
          </div>
        );
      }
    },
    {
      key: 'message',
      title: '訊息',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: any) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleSingleSync(record.workOrderId)}
          disabled={isLoading}
        >
          重新同步
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 批次同步設定 */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">批次同步</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                施工單 ID 列表
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 resize-none"
                value={workOrderIds}
                onChange={(e) => setWorkOrderIds(e.target.value)}
                placeholder="請輸入施工單 ID，每行一個&#10;例如：&#10;WO001&#10;WO002&#10;WO003"
              />
              <p className="text-xs text-gray-500 mt-1">
                每行輸入一個施工單 ID，最多支援 20 個
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="forceSync"
                checked={forceSync}
                onChange={(e) => setForceSync(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="forceSync" className="text-sm text-gray-700">
                強制同步（覆蓋已存在的資料）
              </label>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleBatchSync}
                disabled={isLoading || !workOrderIds.trim()}
              >
                {isLoading ? '同步中...' : '開始批次同步'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 同步結果 */}
      {syncResult && (
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium text-gray-900">同步結果</h3>
              <div className="flex space-x-4 text-sm">
                <span className="text-gray-600">
                  總計: {syncResult.totalWorkOrders}
                </span>
                <span className="text-green-600">
                  成功: {syncResult.successCount}
                </span>
                <span className="text-red-600">
                  失敗: {syncResult.failedCount}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {syncResult.totalWorkOrders}
                  </p>
                  <p className="text-sm text-gray-500">總施工單數</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">
                    {syncResult.successCount}
                  </p>
                  <p className="text-sm text-gray-500">同步成功</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">
                    {syncResult.failedCount}
                  </p>
                  <p className="text-sm text-gray-500">同步失敗</p>
                </div>
              </div>
            </div>

            <Table
              columns={columns}
              data={syncResult.results}
              loading={false}
            />
          </div>
        </Card>
      )}

      {/* 操作提示 */}
      <Card>
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-900">操作說明</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 每行輸入一個施工單 ID，系統會自動過濾空行</li>
            <li>• 一次最多支援 20 個施工單的批次同步</li>
            <li>• 強制同步會覆蓋 FaceMatch 中已存在的資料</li>
            <li>• 同步過程中請勿關閉瀏覽器或重新整理頁面</li>
            <li>• 如有部分施工單同步失敗，可以使用重新同步功能</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};