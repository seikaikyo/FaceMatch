import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Button, 
  Table, 
  StatusBadge, 
  Input, 
  Select, 
  Pagination,
  Card,
  CardHeader,
  CardBody
} from '../components/ui';
import { ContractorForm } from '../components/contractors/ContractorForm';
import { 
  useContractors, 
  useCreateContractor, 
  useUpdateContractor, 
  useDeleteContractor 
} from '../hooks/useContractors';
import { Contractor, ContractorForm as ContractorFormData } from '../types';

export const ContractorsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  }), [page, pageSize, search, statusFilter]);

  const { data, isLoading, error } = useContractors(queryParams);
  
  // Debug logging
  console.log('ContractorsPage data:', data);
  console.log('ContractorsPage isLoading:', isLoading);
  console.log('ContractorsPage error:', error);
  const createMutation = useCreateContractor();
  const updateMutation = useUpdateContractor();
  const deleteMutation = useDeleteContractor();

  const handleCreate = async (formData: ContractorFormData) => {
    try {
      await createMutation.mutateAsync(formData);
      setIsFormOpen(false);
    } catch (error) {
      console.error('建立承攬商失敗:', error);
    }
  };

  const handleUpdate = async (formData: ContractorFormData) => {
    if (!editingContractor) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingContractor._id,
        data: formData,
      });
      setEditingContractor(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('更新承攬商失敗:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除此承攬商嗎？此操作無法撤銷。')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('刪除承攬商失敗:', error);
      }
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContractor(null);
  };

  const columns = [
    {
      key: 'index',
      title: '序號',
      width: '60px',
      align: 'center' as const,
    },
    {
      key: 'name',
      title: '承攬商名稱',
    },
    {
      key: 'code',
      title: '承攬商編號',
    },
    {
      key: 'contactPerson',
      title: '聯絡人',
    },
    {
      key: 'contactPhone',
      title: '聯絡電話',
    },
    {
      key: 'status',
      title: '狀態',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      key: 'contractValidTo',
      title: '合約到期日',
      render: (date: string) => format(new Date(date), 'yyyy-MM-dd'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Contractor) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(record._id)}
            loading={deleteMutation.isPending}
          >
            刪除
          </Button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部狀態' },
    { value: 'ACTIVE', label: '啟用' },
    { value: 'SUSPENDED', label: '暫停' },
    { value: 'TERMINATED', label: '終止' },
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">載入承攬商資料時發生錯誤</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">承攬商管理</h1>
        <p className="text-gray-600 mt-1">管理承攬商基本資料與合約狀態</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Input
                placeholder="搜尋承攬商名稱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32"
              />
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              新增承攬商
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <Table
            data={data?.data || []}
            columns={columns}
            loading={isLoading}
            emptyText="暫無承攬商資料"
          />

          {data?.pagination?.totalPages && data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
                showSizeChanger
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardBody>
      </Card>

      <ContractorForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingContractor ? handleUpdate : handleCreate}
        initialData={editingContractor ? {
          name: editingContractor.name,
          code: editingContractor.code,
          contactPerson: editingContractor.contactPerson,
          contactPhone: editingContractor.contactPhone,
          contractValidFrom: editingContractor.contractValidFrom.split('T')[0],
          contractValidTo: editingContractor.contractValidTo.split('T')[0],
        } : undefined}
        loading={createMutation.isPending || updateMutation.isPending}
        title={editingContractor ? '編輯承攬商' : '新增承攬商'}
      />
    </div>
  );
};