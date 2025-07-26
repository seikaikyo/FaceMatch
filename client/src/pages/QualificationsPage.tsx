import React, { useState, useEffect } from 'react';
import { useQualifications, useBatchQualificationCheck } from '../hooks/useQualifications';
import { ContractorPerson, AnnualQualification } from '../types';
import { qualificationService, QualificationQuery } from '../services/qualifications';
import QualificationForm from '../components/qualifications/QualificationForm';
import RenewalForm from '../components/qualifications/RenewalForm';
import BatchCheckForm from '../components/qualifications/BatchCheckForm';
import { Button, Modal, Pagination, StatusBadge, Card } from '../components/ui';

const QualificationsPage: React.FC = () => {
  const {
    qualifications,
    pagination,
    loading,
    error,
    fetchQualifications,
    createQualification,
    updateQualification,
    deleteQualification
  } = useQualifications();

  const {
    result: batchCheckResult,
    loading: batchLoading,
    error: batchError,
    checkQualifications
  } = useBatchQualificationCheck();

  // 狀態管理
  const [activeTab, setActiveTab] = useState<'list' | 'batch'>('list');
  const [showForm, setShowForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<AnnualQualification | null>(null);
  const [persons, setPersons] = useState<ContractorPerson[]>([]);
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    status: '',
    qualificationType: '',
    search: ''
  });

  // 載入人員列表（模擬資料）
  useEffect(() => {
    setPersons([
      {
        _id: 'P001',
        name: '張工程師',
        employeeId: 'EMP001',
        contractor: { _id: '1', name: '台積電承攬商' }
      } as ContractorPerson,
      {
        _id: 'P002',
        name: '李技師',
        employeeId: 'EMP002',
        contractor: { _id: '1', name: '台積電承攬商' }
      } as ContractorPerson,
      {
        _id: 'P003',
        name: '陳主任',
        employeeId: 'EMP003',
        contractor: { _id: '2', name: '聯發科承攬商' }
      } as ContractorPerson
    ]);
  }, []);

  // 初始載入
  useEffect(() => {
    fetchQualifications();
  }, [fetchQualifications]);

  // 篩選處理
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const query: QualificationQuery = {
      page: 1,
      status: filters.status as 'VALID' | 'EXPIRED' | 'REVOKED' | undefined,
      qualificationType: filters.qualificationType,
      search: filters.search
    };
    
    // 移除空值
    Object.keys(query).forEach(key => {
      if (!query[key as keyof QualificationQuery]) {
        delete query[key as keyof QualificationQuery];
      }
    });
    
    fetchQualifications(query);
  };

  const handlePageChange = (page: number) => {
    const query: QualificationQuery = {
      page,
      status: filters.status as 'VALID' | 'EXPIRED' | 'REVOKED' | undefined,
      qualificationType: filters.qualificationType,
      search: filters.search
    };
    
    // 移除空值
    Object.keys(query).forEach(key => {
      if (!query[key as keyof QualificationQuery]) {
        delete query[key as keyof QualificationQuery];
      }
    });
    
    fetchQualifications(query);
  };

  const getStatusColor = (qualification: AnnualQualification) => {
    const validTo = new Date(qualification.validTo);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (qualification.status !== 'VALID') {
      return 'error';
    }

    if (validTo < now) {
      return 'error';
    }

    if (validTo <= thirtyDaysFromNow) {
      return 'warning';
    }

    return 'success';
  };

  const getStatusText = (qualification: AnnualQualification) => {
    const validTo = new Date(qualification.validTo);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    if (qualification.status !== 'VALID') {
      return '無效';
    }

    if (validTo < now) {
      return '已過期';
    }

    if (validTo <= thirtyDaysFromNow) {
      return '即將到期';
    }

    return '有效';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const handleCreateQualification = async (data: any) => {
    try {
      await createQualification(data);
      setShowForm(false);
      fetchQualifications();
    } catch (error) {
      console.error('Failed to create qualification:', error);
    }
  };

  const handleUpdateQualification = async (data: any) => {
    if (!selectedQualification) return;
    
    try {
      await updateQualification(selectedQualification._id, data);
      setShowForm(false);
      setSelectedQualification(null);
      fetchQualifications();
    } catch (error) {
      console.error('Failed to update qualification:', error);
    }
  };

  const handleDeleteQualification = async (id: string) => {
    if (!window.confirm('確定要刪除此資格記錄嗎？')) return;
    
    try {
      await deleteQualification(id);
      fetchQualifications();
    } catch (error) {
      console.error('Failed to delete qualification:', error);
    }
  };

  const handleEdit = (qualification: AnnualQualification) => {
    setSelectedQualification(qualification);
    setShowForm(true);
  };

  const handleRenew = (qualification: AnnualQualification) => {
    setSelectedQualification(qualification);
    setShowRenewalForm(true);
  };

  const handleBatchCheck = async (data: any) => {
    try {
      await checkQualifications(data);
    } catch (error) {
      console.error('Failed to perform batch check:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">年度資格管理</h1>
        <Button onClick={() => setShowForm(true)}>
          新增資格
        </Button>
      </div>

      {/* 標籤頁 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            資格列表
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'batch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            批次檢核
          </button>
        </nav>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* 篩選條件 */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  狀態
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部狀態</option>
                  <option value="VALID">有效</option>
                  <option value="EXPIRED">已過期</option>
                  <option value="REVOKED">已撤銷</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  資格類型
                </label>
                <select
                  value={filters.qualificationType}
                  onChange={(e) => handleFilterChange('qualificationType', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部類型</option>
                  <option value="SAFETY">安全資格</option>
                  <option value="TECHNICAL">技術資格</option>
                  <option value="MANAGEMENT">管理資格</option>
                  <option value="ENVIRONMENTAL">環境資格</option>
                  <option value="QUALITY">品質資格</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  搜尋
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="搜尋人員或資格名稱"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  搜尋
                </Button>
              </div>
            </div>
          </Card>

          {/* 資格列表 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">人員</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資格類型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資格名稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">訓練日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">到期日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">證書編號</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        載入中...
                      </td>
                    </tr>
                  ) : qualifications.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        暫無資格記錄
                      </td>
                    </tr>
                  ) : (
                    qualifications.map((qualification) => (
                      <tr key={qualification._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {qualification.personName || '未知'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {qualification.qualificationType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {qualification.qualificationName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(qualification.trainingDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(qualification.validFrom)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(qualification.validTo)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{qualification.certificateNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge variant={getStatusColor(qualification) as any}>
                            {getStatusText(qualification)}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(qualification)}
                            >
                              編輯
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(qualification)}
                            >
                              展延
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteQualification(qualification._id)}
                            >
                              刪除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Pagination
                currentPage={pagination?.page || 1}
                totalPages={pagination?.totalPages || 1}
                onPageChange={handlePageChange}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'batch' && (
        <BatchCheckForm
          persons={persons}
          onSubmit={handleBatchCheck}
          result={batchCheckResult}
          loading={batchLoading}
        />
      )}

      {/* 資格表單模態框 */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedQualification(null);
        }}
        title={selectedQualification ? '編輯資格' : '新增資格'}
      >
        <QualificationForm
          qualification={selectedQualification}
          persons={persons}
          onSubmit={selectedQualification ? handleUpdateQualification : handleCreateQualification}
          onCancel={() => {
            setShowForm(false);
            setSelectedQualification(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* 展延表單模態框 */}
      <Modal
        isOpen={showRenewalForm}
        onClose={() => {
          setShowRenewalForm(false);
          setSelectedQualification(null);
        }}
        title="資格展延"
      >
        {selectedQualification && (
          <RenewalForm
            qualification={selectedQualification}
            onSubmit={async (data) => {
              try {
                await qualificationService.renewQualification(selectedQualification._id, data);
                setShowRenewalForm(false);
                setSelectedQualification(null);
                fetchQualifications();
              } catch (error) {
                console.error('Failed to renew qualification:', error);
              }
            }}
            onCancel={() => {
              setShowRenewalForm(false);
              setSelectedQualification(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default QualificationsPage;