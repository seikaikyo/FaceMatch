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
import { WorkOrderForm } from '../components/workOrders/WorkOrderForm';
import { 
  useWorkOrders, 
  useCreateWorkOrder, 
  useUpdateWorkOrder, 
  useDeleteWorkOrder 
} from '../hooks/useWorkOrders';
import { useContractors } from '../hooks/useContractors';
import { WorkOrder, WorkOrderForm as WorkOrderFormData } from '../types';

export const WorkOrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [contractorFilter, setContractorFilter] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    ...(statusFilter && { status: statusFilter }),
    ...(contractorFilter && { contractorId: contractorFilter }),
  }), [page, pageSize, statusFilter, contractorFilter]);

  const { data, isLoading, error } = useWorkOrders(queryParams);
  const { data: contractorsData } = useContractors({ limit: 1000 });
  
  // Debug logging
  console.log('WorkOrdersPage data:', data);
  console.log('WorkOrdersPage contractorsData:', contractorsData);
  console.log('WorkOrdersPage isLoading:', isLoading);
  console.log('WorkOrdersPage error:', error);
  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();
  const deleteMutation = useDeleteWorkOrder();

  const handleCreate = async (formData: WorkOrderFormData) => {
    try {
      await createMutation.mutateAsync(formData);
      setIsFormOpen(false);
    } catch (error) {
      console.error('建立施工單失敗:', error);
    }
  };

  const handleUpdate = async (formData: WorkOrderFormData) => {
    if (!editingWorkOrder) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingWorkOrder._id,
        data: formData,
      });
      setEditingWorkOrder(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('更新施工單失敗:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除此施工單嗎？此操作無法撤銷。')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('刪除施工單失敗:', error);
      }
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWorkOrder(null);
  };

  const columns = [
    {
      key: 'index',
      title: '序號',
      width: '60px',
      align: 'center' as const,
    },
    {
      key: 'orderNumber',
      title: '施工單號',
    },
    {
      key: 'title',
      title: '施工名稱',
    },
    {
      key: 'contractor',
      title: '承攬商',
      render: (_: any, record: WorkOrder) => record.contractor?.name || '-',
    },
    {
      key: 'siteLocation',
      title: '施工地點',
    },
    {
      key: 'riskLevel',
      title: '風險等級',
      render: (riskLevel: string) => <StatusBadge status={riskLevel} />,
    },
    {
      key: 'status',
      title: '狀態',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      key: 'plannedStartTime',
      title: '預計開始時間',
      render: (date: string) => format(new Date(date), 'yyyy-MM-dd HH:mm'),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: WorkOrder) => (
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
    { value: 'DRAFT', label: '草稿' },
    { value: 'SUBMITTED', label: '已提交' },
    { value: 'APPROVED', label: '已核准' },
    { value: 'IN_PROGRESS', label: '進行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'CANCELLED', label: '已取消' },
  ];

  const contractorOptions = [
    { value: '', label: '全部承攬商' },
    ...(contractorsData?.data?.map(contractor => ({
      value: contractor._id,
      label: contractor.name,
    })) || []),
  ];

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">載入施工單資料時發生錯誤</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">施工單管理</h1>
        <p className="text-gray-600 mt-1">管理施工申請單與進度追蹤</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32"
              />
              <Select
                options={contractorOptions}
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              新增施工單
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <Table
            data={data?.data || []}
            columns={columns}
            loading={isLoading}
            emptyText="暫無施工單資料"
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

      <WorkOrderForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingWorkOrder ? handleUpdate : handleCreate}
        initialData={editingWorkOrder ? {
          orderNumber: editingWorkOrder.orderNumber,
          title: editingWorkOrder.title,
          description: editingWorkOrder.description,
          contractorId: editingWorkOrder.contractorId,
          siteLocation: editingWorkOrder.siteLocation,
          workType: editingWorkOrder.workType,
          riskLevel: editingWorkOrder.riskLevel,
          plannedStartTime: editingWorkOrder.plannedStartTime.slice(0, 16),
          plannedEndTime: editingWorkOrder.plannedEndTime.slice(0, 16),
          safetyRequirements: editingWorkOrder.safetyRequirements,
          emergencyContact: editingWorkOrder.emergencyContact,
        } : undefined}
        loading={createMutation.isPending || updateMutation.isPending}
        title={editingWorkOrder ? '編輯施工單' : '新增施工單'}
      />
    </div>
  );
};