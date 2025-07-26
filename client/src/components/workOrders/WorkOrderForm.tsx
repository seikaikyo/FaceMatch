import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Modal } from '../ui';
import { useContractors } from '../../hooks/useContractors';
import { WorkOrderForm as WorkOrderFormData } from '../../types';

interface WorkOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkOrderFormData) => void;
  initialData?: Partial<WorkOrderFormData>;
  loading?: boolean;
  title?: string;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title = '新增施工單',
}) => {
  const { data: contractorsData } = useContractors({ limit: 1000 });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<WorkOrderFormData>({
    defaultValues: {
      safetyRequirements: [],
      ...initialData,
    },
  });

  const safetyRequirements = watch('safetyRequirements') || [];

  React.useEffect(() => {
    if (initialData) {
      reset({
        safetyRequirements: [],
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: WorkOrderFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addSafetyRequirement = () => {
    const input = document.getElementById('newSafetyRequirement') as HTMLInputElement;
    if (input && input.value.trim()) {
      const newRequirements = [...safetyRequirements, input.value.trim()];
      setValue('safetyRequirements', newRequirements);
      input.value = '';
    }
  };

  const removeSafetyRequirement = (index: number) => {
    const newRequirements = safetyRequirements.filter((_, i) => i !== index);
    setValue('safetyRequirements', newRequirements);
  };

  const contractorOptions = contractorsData?.data?.map(contractor => ({
    value: contractor._id,
    label: contractor.name,
  })) || [];

  const riskLevelOptions = [
    { value: 'LOW', label: '低風險' },
    { value: 'MEDIUM', label: '中風險' },
    { value: 'HIGH', label: '高風險' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="施工單號"
            {...register('orderNumber', { required: '請輸入施工單號' })}
            error={errors.orderNumber?.message}
          />

          <Select
            label="承攬商"
            options={contractorOptions}
            placeholder="請選擇承攬商"
            {...register('contractorId', { required: '請選擇承攬商' })}
            error={errors.contractorId?.message}
          />
        </div>

        <Input
          label="施工名稱"
          {...register('title', { required: '請輸入施工名稱' })}
          error={errors.title?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="施工地點"
            {...register('siteLocation', { required: '請輸入施工地點' })}
            error={errors.siteLocation?.message}
          />

          <Input
            label="作業類型"
            {...register('workType', { required: '請輸入作業類型' })}
            error={errors.workType?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="風險等級"
            options={riskLevelOptions}
            placeholder="請選擇風險等級"
            {...register('riskLevel', { required: '請選擇風險等級' })}
            error={errors.riskLevel?.message}
          />

          <Input
            label="緊急聯絡人"
            {...register('emergencyContact', { required: '請輸入緊急聯絡人' })}
            error={errors.emergencyContact?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="預計開始時間"
            type="datetime-local"
            {...register('plannedStartTime', { required: '請選擇預計開始時間' })}
            error={errors.plannedStartTime?.message}
          />

          <Input
            label="預計結束時間"
            type="datetime-local"
            {...register('plannedEndTime', { required: '請選擇預計結束時間' })}
            error={errors.plannedEndTime?.message}
          />
        </div>

        <div>
          <label className="form-label">施工描述</label>
          <textarea
            {...register('description')}
            className="form-input h-20 resize-none"
            placeholder="請輸入施工描述..."
          />
        </div>

        <div>
          <label className="form-label">安全要求</label>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                id="newSafetyRequirement"
                type="text"
                className="form-input flex-1"
                placeholder="輸入安全要求..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSafetyRequirement();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addSafetyRequirement}
              >
                新增
              </Button>
            </div>
            
            {safetyRequirements.length > 0 && (
              <div className="space-y-1">
                {safetyRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => removeSafetyRequirement(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {initialData ? '更新' : '建立'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};