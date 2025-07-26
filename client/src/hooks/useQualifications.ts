import { useState, useEffect } from 'react';
import { 
  AnnualQualification, 
  QualificationForm,
  ApiResponse,
  PaginatedResponse 
} from '../types';
import { 
  qualificationService, 
  QualificationQuery, 
  RenewalRequest,
  BatchCheckRequest,
  BatchCheckResponse
} from '../services/qualifications';

export const useQualifications = (initialQuery?: QualificationQuery) => {
  const [qualifications, setQualifications] = useState<AnnualQualification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchQualifications = async (query?: QualificationQuery) => {
    try {
      setLoading(true);
      setError(null);
      const response = await qualificationService.getQualifications({
        ...initialQuery,
        ...query
      });
      
      if (response.success && response.data) {
        setQualifications(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError(response.message || '獲取資格列表失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('獲取資格列表失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const createQualification = async (data: QualificationForm & { personId: string }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await qualificationService.createQualification(data);
      
      if (response.success) {
        await fetchQualifications(); // 重新獲取列表
        return true;
      } else {
        setError(response.message || '建立資格失敗');
        return false;
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('建立資格失敗:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQualification = async (id: string, data: Partial<QualificationForm>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await qualificationService.updateQualification(id, data);
      
      if (response.success) {
        await fetchQualifications(); // 重新獲取列表
        return true;
      } else {
        setError(response.message || '更新資格失敗');
        return false;
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('更新資格失敗:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteQualification = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await qualificationService.deleteQualification(id);
      
      if (response.success) {
        await fetchQualifications(); // 重新獲取列表
        return true;
      } else {
        setError(response.message || '刪除資格失敗');
        return false;
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('刪除資格失敗:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const renewQualification = async (id: string, data: RenewalRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await qualificationService.renewQualification(id, data);
      
      if (response.success) {
        await fetchQualifications(); // 重新獲取列表
        return true;
      } else {
        setError(response.message || '資格展延失敗');
        return false;
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('資格展延失敗:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, []);

  return {
    qualifications,
    loading,
    error,
    pagination,
    fetchQualifications,
    createQualification,
    updateQualification,
    deleteQualification,
    renewQualification,
    setError
  };
};

export const useQualification = (id: string) => {
  const [qualification, setQualification] = useState<AnnualQualification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQualification = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await qualificationService.getQualification(id);
      
      if (response.success && response.data) {
        setQualification(response.data);
      } else {
        setError(response.message || '獲取資格詳情失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('獲取資格詳情失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualification();
  }, [id]);

  return {
    qualification,
    loading,
    error,
    refetch: fetchQualification
  };
};

export const useBatchQualificationCheck = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchCheckResponse | null>(null);

  const checkQualifications = async (data: BatchCheckRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const response = await qualificationService.batchCheckQualifications(data);
      
      if (response.success && response.data) {
        setResult(response.data);
        return true;
      } else {
        setError(response.message || '批次檢核失敗');
        return false;
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('批次檢核失敗:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    checkQualifications,
    clearResult: () => setResult(null),
    setError
  };
};

export const useQualificationStats = () => {
  const [stats, setStats] = useState<{
    total: number;
    valid: number;
    expired: number;
    expiringSoon: number;
    byType: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await qualificationService.getQualificationStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || '獲取統計資料失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('獲取統計資料失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};