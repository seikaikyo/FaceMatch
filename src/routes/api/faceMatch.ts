import { Router } from 'express';
import { FaceMatchController } from '../../controllers/faceMatchController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// 所有路由都需要認證
router.use(authenticateToken);

// 同步單一施工單到 FaceMatch
router.post('/sync/:workOrderId', FaceMatchController.syncWorkOrder);

// 批次同步多個施工單
router.post('/batch-sync', FaceMatchController.batchSyncWorkOrders);

// 檢查施工單同步狀態
router.get('/sync-status/:workOrderId', FaceMatchController.getSyncStatus);

// 獲取同步統計資料
router.get('/statistics', FaceMatchController.getSyncStatistics);

// 緊急撤銷人員 FaceMatch 權限
router.post('/emergency-revoke/:personId', FaceMatchController.emergencyRevokeAccess);

// 測試 FaceMatch 連線 (僅限 ADMIN)
router.get('/test-connection', FaceMatchController.testConnection);

// 照片管理端點
// 上傳人員照片
router.post('/photos/:personId', 
  FaceMatchController.getUploadMiddleware(), 
  FaceMatchController.uploadPersonPhoto
);

// 批次上傳照片
router.post('/photos/batch', 
  FaceMatchController.getBatchUploadMiddleware(), 
  FaceMatchController.batchUploadPhotos
);

// 更新人員照片
router.put('/photos/:personId', 
  FaceMatchController.getUploadMiddleware(), 
  FaceMatchController.updatePersonPhoto
);

// 刪除人員照片
router.delete('/photos/:personId', FaceMatchController.deletePersonPhoto);

// 獲取人員照片列表
router.get('/photos/:personId', FaceMatchController.getPersonPhotos);

// 照片比對
router.post('/compare/:targetPersonId', 
  FaceMatchController.getUploadMiddleware(), 
  FaceMatchController.comparePhotos
);

// 批次照片比對
router.post('/compare/batch', 
  FaceMatchController.getBatchUploadMiddleware(), 
  FaceMatchController.batchComparePhotos
);

export default router;