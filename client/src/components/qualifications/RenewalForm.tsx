import React, { useState } from 'react';
import { AnnualQualification } from '../../types';
import { RenewalRequest } from '../../services/qualifications';
import { Button, Input, Card } from '../ui';

interface RenewalFormProps {
  qualification: AnnualQualification;
  onSubmit: (data: RenewalRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const RenewalForm: React.FC<RenewalFormProps> = ({
  qualification,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<RenewalRequest>({
    newValidTo: '',
    reason: '',
    approvedBy: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newValidTo) {
      newErrors.newValidTo = '請選擇新的到期日期';
    } else {
      const currentValidTo = new Date(qualification.validTo);
      const newValidTo = new Date(formData.newValidTo);
      
      if (newValidTo <= currentValidTo) {
        newErrors.newValidTo = '新的到期日期必須在當前到期日期之後';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = '請輸入展延原因';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = '展延原因至少需要10個字符';
    }

    if (!formData.approvedBy.trim()) {
      newErrors.approvedBy = '請輸入核准人';
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
      console.error('提交展延申請失敗:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">資格展延</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="font-medium text-gray-900 mb-2">資格資訊</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">資格類型：</span>
            <span className="font-medium">{qualification.qualificationType}</span>
          </div>
          <div>
            <span className="text-gray-600">當前到期日：</span>
            <span className="font-medium text-red-600">{formatDate(qualification.validTo)}</span>
          </div>
          <div>
            <span className="text-gray-600">人員：</span>
            <span className="font-medium">
              {qualification.person?.name || '未知'} 
              ({qualification.person?.employeeId || '未知'})
            </span>
          </div>
          <div>
            <span className="text-gray-600">當前狀態：</span>
            <span className={`font-medium ${
              qualification.status === 'VALID' ? 'text-green-600' : 
              qualification.status === 'EXPIRED' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {qualification.status === 'VALID' ? '有效' : 
               qualification.status === 'EXPIRED' ? '已過期' : 
               qualification.status === 'REVOKED' ? '已撤銷' : '未知'}
            </span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新的到期日期 *
          </label>
          <Input
            type="date"
            name="newValidTo"
            value={formData.newValidTo}
            onChange={handleChange}
            disabled={loading}
            className={errors.newValidTo ? 'border-red-500' : ''}
            min={new Date(qualification.validTo).toISOString().split('T')[0]}
          />
          {errors.newValidTo && (
            <p className="text-red-500 text-sm mt-1">{errors.newValidTo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            展延原因 *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            disabled={loading}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.reason ? 'border-red-500' : ''
            }`}
            rows={4}
            placeholder="請詳細說明資格展延的原因..."
          />
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            核准人 *
          </label>
          <Input
            type="text"
            name="approvedBy"
            value={formData.approvedBy}
            onChange={handleChange}
            placeholder="請輸入核准人姓名"
            disabled={loading}
            className={errors.approvedBy ? 'border-red-500' : ''}
          />
          {errors.approvedBy && (
            <p className="text-red-500 text-sm mt-1">{errors.approvedBy}</p>
          )}
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
            {loading ? '處理中...' : '確認展延'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RenewalForm;