import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select, Modal } from '../ui';
import { ContractorForm as ContractorFormData } from '../../types';

interface ContractorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContractorFormData) => void;
  initialData?: Partial<ContractorFormData>;
  loading?: boolean;
  title?: string;
}

export const ContractorForm: React.FC<ContractorFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
  title = '新增承攬商',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContractorFormData>({
    defaultValues: initialData,
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: ContractorFormData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="承攬商名稱"
          {...register('name', { required: '請輸入承攬商名稱' })}
          error={errors.name?.message}
        />

        <Input
          label="承攬商編號"
          {...register('code', { required: '請輸入承攬商編號' })}
          error={errors.code?.message}
        />

        <Input
          label="聯絡人"
          {...register('contactPerson', { required: '請輸入聯絡人' })}
          error={errors.contactPerson?.message}
        />

        <Input
          label="聯絡電話"
          {...register('contactPhone', { required: '請輸入聯絡電話' })}
          error={errors.contactPhone?.message}
        />

        <Input
          label="合約生效日"
          type="date"
          {...register('contractValidFrom', { required: '請選擇合約生效日' })}
          error={errors.contractValidFrom?.message}
        />

        <Input
          label="合約到期日"
          type="date"
          {...register('contractValidTo', { required: '請選擇合約到期日' })}
          error={errors.contractValidTo?.message}
        />

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