import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PhotoManagement } from '../components/faceMatch/PhotoManagement';
import { SyncStatistics } from '../components/faceMatch/SyncStatistics';
import { SyncStatus } from '../components/faceMatch/SyncStatus';
import { BatchSync } from '../components/faceMatch/BatchSync';
import { PhotoComparison } from '../components/faceMatch/PhotoComparison';

type TabType = 'photos' | 'sync' | 'statistics' | 'comparison';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'photos',
    label: '照片管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'sync',
    label: '同步管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'statistics',
    label: '統計報表',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'comparison',
    label: '照片比對',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export const FaceMatchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('photos');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'photos':
        return <PhotoManagement />;
      case 'sync':
        return (
          <div className="space-y-6">
            <SyncStatus />
            <BatchSync />
          </div>
        );
      case 'statistics':
        return <SyncStatistics />;
      case 'comparison':
        return <PhotoComparison />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FaceMatch 整合管理</h1>
          <p className="mt-2 text-gray-600">
            人臉辨識系統整合、照片管理和同步監控
          </p>
        </div>
        <StatusBadge variant="success" size="sm">
          系統運行中
        </StatusBadge>
      </div>

      {/* 頁籤導航 */}
      <Card>
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </Card>

      {/* 頁籤內容 */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FaceMatchPage;