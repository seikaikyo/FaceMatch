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

export default router;