import React, { useState, useEffect } from 'react';
import { AnnualQualification, QualificationForm as IQualificationForm, ContractorPerson } from '../../types';
import { Button, Input, Card } from '../ui';

interface QualificationFormProps {
  qualification?: AnnualQualification;
  persons: ContractorPerson[];
  onSubmit: (data: IQualificationForm & { personId: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const QUALIFICATION_TYPES = [
  '安全衛生教育訓練',
  '危險性工作場所安全衛生教育訓練',
  '高空作業安全訓練',
  '密閉空間作業安全訓練',
  '化學品安全訓練',
  '堆高機操作證',
  '起重機操作證',
  '電氣安全訓練',
  '防火安全訓練',
  '急救訓練',
  '職業安全衛生管理員',
  '職業安全衛生業務主管',
  '其他'
];

const QualificationForm: React.FC<QualificationFormProps> = ({
  qualification,
  persons,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<IQualificationForm & { personId: string }>({
    personId: qualification?.personId || '',
    qualificationType: qualification?.qualificationType || '',
    trainingDate: qualification?.trainingDate ? qualification.trainingDate.split('T')[0] : '',
    certificationDate: qualification?.certificationDate ? qualification.certificationDate.split('T')[0] : '',
    validFrom: qualification?.validFrom ? qualification.validFrom.split('T')[0] : '',
    validTo: qualification?.validTo ? qualification.validTo.split('T')[0] : '',
    certificateNumber: qualification?.certificateNumber || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.personId) {
      newErrors.personId = '請選擇人員';
    }

    if (!formData.qualificationType) {
      newErrors.qualificationType = '請選擇資格類型';
    }

    if (!formData.trainingDate) {
      newErrors.trainingDate = '請選擇訓練日期';
    }

    if (!formData.certificationDate) {
      newErrors.certificationDate = '請選擇認證日期';
    }

    if (!formData.validFrom) {
      newErrors.validFrom = '請選擇生效日期';
    }

    if (!formData.validTo) {
      newErrors.validTo = '請選擇到期日期';
    }

    // 驗證日期邏輯
    if (formData.validFrom && formData.validTo) {
      const validFrom = new Date(formData.validFrom);
      const validTo = new Date(formData.validTo);
      
      if (validTo <= validFrom) {
        newErrors.validTo = '到期日期必須在生效日期之後';
      }
    }

    if (formData.trainingDate && formData.certificationDate) {
      const trainingDate = new Date(formData.trainingDate);
      const certificationDate = new Date(formData.certificationDate);
      
      if (certificationDate < trainingDate) {
        newErrors.certificationDate = '認證日期不能早於訓練日期';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('提交表單失敗:', error);
    }
  };

  // 自動設定預設值
  useEffect(() => {
    if (formData.trainingDate && !formData.certificationDate) {
      setFormData(prev => ({ 
        ...prev, 
        certificationDate: prev.trainingDate 
      }));
    }
  }, [formData.trainingDate]);

  useEffect(() => {
    if (formData.certificationDate && !formData.validFrom) {
      setFormData(prev => ({ 
        ...prev, 
        validFrom: prev.certificationDate 
      }));
    }
  }, [formData.certificationDate]);

  useEffect(() => {
    if (formData.validFrom && !formData.validTo) {
      const validFrom = new Date(formData.validFrom);
      validFrom.setFullYear(validFrom.getFullYear() + 1); // 預設一年有效期
      setFormData(prev => ({ 
        ...prev, 
        validTo: validFrom.toISOString().split('T')[0] 
      }));
    }
  }, [formData.validFrom]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {qualification ? '編輯資格' : '新增資格'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              人員 *
            </label>
            <select
              name="personId"
              value={formData.personId}
              onChange={handleChange}
              disabled={!!qualification || loading}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.personId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">請選擇人員</option>
              {persons.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name} ({person.employeeId})
                  {person.contractor && ` - ${person.contractor.name}`}
                </option>
              ))}
            </select>
            {errors.personId && (
              <p className="text-red-500 text-sm mt-1">{errors.personId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              資格類型 *
            </label>
            <select
              name="qualificationType"
              value={formData.qualificationType}
              onChange={handleChange}
              disabled={loading}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.qualificationType ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">請選擇資格類型</option>
              {QUALIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.qualificationType && (
              <p className="text-red-500 text-sm mt-1">{errors.qualificationType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              訓練日期 *
            </label>
            <Input
              type="date"
              name="trainingDate"
              value={formData.trainingDate}
              onChange={handleChange}
              disabled={loading}
              className={errors.trainingDate ? 'border-red-500' : ''}
            />
            {errors.trainingDate && (
              <p className="text-red-500 text-sm mt-1">{errors.trainingDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              認證日期 *
            </label>
            <Input
              type="date"
              name="certificationDate"
              value={formData.certificationDate}
              onChange={handleChange}
              disabled={loading}
              className={errors.certificationDate ? 'border-red-500' : ''}
            />
            {errors.certificationDate && (
              <p className="text-red-500 text-sm mt-1">{errors.certificationDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生效日期 *
            </label>
            <Input
              type="date"
              name="validFrom"
              value={formData.validFrom}
              onChange={handleChange}
              disabled={loading}
              className={errors.validFrom ? 'border-red-500' : ''}
            />
            {errors.validFrom && (
              <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              到期日期 *
            </label>
            <Input
              type="date"
              name="validTo"
              value={formData.validTo}
              onChange={handleChange}
              disabled={loading}
              className={errors.validTo ? 'border-red-500' : ''}
            />
            {errors.validTo && (
              <p className="text-red-500 text-sm mt-1">{errors.validTo}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              證書編號
            </label>
            <Input
              type="text"
              name="certificateNumber"
              value={formData.certificateNumber}
              onChange={handleChange}
              placeholder="請輸入證書編號"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? '處理中...' : (qualification ? '更新' : '建立')}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default QualificationForm;