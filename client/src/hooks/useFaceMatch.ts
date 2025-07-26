import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaceMatchService } from '../services/faceMatch';
import type {
  FaceMatchSyncStatistics,
  FaceMatchSyncStatus,
  FaceMatchPersonPhoto,
  FaceMatchPhotoCompareResult,
  FaceMatchConnectionStatus,
  FaceMatchBatchSyncRequest,
  FaceMatchBatchSyncResult,
} from '../types';

// FaceMatch 同步統計 Hook
export const useFaceMatchStatistics = () => {
  return useQuery({
    queryKey: ['faceMatch', 'statistics'],
    queryFn: FaceMatchService.getSyncStatistics,
    refetchInterval: 30000, // 每 30 秒刷新一次
    retry: 2,
  });
};

// FaceMatch 同步狀態 Hook
export const useFaceMatchSyncStatus = (workOrderId: string | null) => {
  return useQuery({
    queryKey: ['faceMatch', 'syncStatus', workOrderId],
    queryFn: () => workOrderId ? FaceMatchService.getSyncStatus(workOrderId) : null,
    enabled: !!workOrderId,
    retry: 1,
  });
};

// FaceMatch 連線測試 Hook
export const useFaceMatchConnection = () => {
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const query = useQuery({
    queryKey: ['faceMatch', 'connection'],
    queryFn: FaceMatchService.testConnection,
    enabled: false, // 手動觸發
    retry: 1,
  });

  const testConnection = useCallback(async () => {
    const result = await query.refetch();
    setLastChecked(new Date());
    return result;
  }, [query]);

  return {
    ...query,
    testConnection,
    lastChecked,
  };
};

// FaceMatch 照片管理 Hook
export const useFaceMatchPhotos = (personId: string | null) => {
  return useQuery({
    queryKey: ['faceMatch', 'photos', personId],
    queryFn: () => personId ? FaceMatchService.getPersonPhotos(personId) : [],
    enabled: !!personId,
  });
};

// FaceMatch 批次同步 Hook
export const useFaceMatchBatchSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FaceMatchBatchSyncRequest) => 
      FaceMatchService.batchSyncWorkOrders(data),
    onSuccess: () => {
      // 刷新統計資料
      queryClient.invalidateQueries({ queryKey: ['faceMatch', 'statistics'] });
    },
  });
};

// FaceMatch 照片上傳 Hook
export const useFaceMatchPhotoUpload = () => {
  const queryClient = useQueryClient();

  const uploadSingle = useMutation({
    mutationFn: ({ personId, photo }: { personId: string; photo: File }) =>
      FaceMatchService.uploadPersonPhoto(personId, photo),
    onSuccess: (_, { personId }) => {
      // 刷新該人員的照片列表
      queryClient.invalidateQueries({ queryKey: ['faceMatch', 'photos', personId] });
    },
  });

  const uploadBatch = useMutation({
    mutationFn: (photos: Array<{ photo: File; personId: string }>) =>
      FaceMatchService.batchUploadPhotos(photos),
    onSuccess: () => {
      // 刷新所有照片相關的查詢
      queryClient.invalidateQueries({ queryKey: ['faceMatch', 'photos'] });
    },
  });

  return {
    uploadSingle,
    uploadBatch,
  };
};

// FaceMatch 照片比對 Hook
export const useFaceMatchPhotoCompare = () => {
  const [compareHistory, setCompareHistory] = useState<Array<{
    id: string;
    timestamp: Date;
    result: FaceMatchPhotoCompareResult;
    targetPersonId: string;
    sourceFileName: string;
  }>>([]);

  const compareSingle = useMutation({
    mutationFn: ({ targetPersonId, sourcePhoto }: { targetPersonId: string; sourcePhoto: File }) =>
      FaceMatchService.comparePhoto(targetPersonId, sourcePhoto),
    onSuccess: (result, { targetPersonId, sourcePhoto }) => {
      // 將結果添加到歷史記錄
      const historyItem = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        result,
        targetPersonId,
        sourceFileName: sourcePhoto.name,
      };
      setCompareHistory(prev => [historyItem, ...prev.slice(0, 19)]); // 保留最近 20 次比對記錄
    },
  });

  const compareBatch = useMutation({
    mutationFn: (comparisons: Array<{ photo: File; targetPersonId: string }>) =>
      FaceMatchService.batchComparePhotos(comparisons),
    onSuccess: (results, comparisons) => {
      // 將批次結果添加到歷史記錄
      const historyItems = results.map((result, index) => ({
        id: `${Date.now()}-${index}-${Math.random()}`,
        timestamp: new Date(),
        result,
        targetPersonId: comparisons[index].targetPersonId,
        sourceFileName: comparisons[index].photo.name,
      }));
      setCompareHistory(prev => [...historyItems, ...prev].slice(0, 20));
    },
  });

  const clearHistory = useCallback(() => {
    setCompareHistory([]);
  }, []);

  return {
    compareSingle,
    compareBatch,
    compareHistory,
    clearHistory,
  };
};

// FaceMatch 人員照片刪除 Hook
export const useFaceMatchPhotoDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, photoId }: { personId: string; photoId?: string }) =>
      FaceMatchService.deletePersonPhoto(personId, photoId),
    onSuccess: (_, { personId }) => {
      // 刷新該人員的照片列表
      queryClient.invalidateQueries({ queryKey: ['faceMatch', 'photos', personId] });
    },
  });
};

// FaceMatch 緊急撤銷 Hook
export const useFaceMatchEmergencyRevoke = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, reason }: { personId: string; reason: string }) =>
      FaceMatchService.emergencyRevokeAccess(personId, reason),
    onSuccess: () => {
      // 刷新統計資料
      queryClient.invalidateQueries({ queryKey: ['faceMatch', 'statistics'] });
    },
  });
};

// FaceMatch 綜合狀態 Hook
export const useFaceMatchOverview = () => {
  const statistics = useFaceMatchStatistics();
  const connection = useFaceMatchConnection();
  
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  useEffect(() => {
    if (connection.data?.connected === false) {
      setSystemStatus('error');
    } else if (statistics.data && statistics.data.failed > statistics.data.success * 0.1) {
      setSystemStatus('warning');
    } else {
      setSystemStatus('healthy');
    }
  }, [connection.data, statistics.data]);

  return {
    statistics,
    connection,
    systemStatus,
    isLoading: statistics.isLoading || connection.isLoading,
    error: statistics.error || connection.error,
  };
};

// FaceMatch 檔案驗證 Hook
export const useFaceMatchFileValidation = () => {
  const validateFile = useCallback((file: File) => {
    return FaceMatchService.validateImageFile(file);
  }, []);

  const validateFiles = useCallback((files: File[]) => {
    return FaceMatchService.validateImageFiles(files);
  }, []);

  return {
    validateFile,
    validateFiles,
  };
};