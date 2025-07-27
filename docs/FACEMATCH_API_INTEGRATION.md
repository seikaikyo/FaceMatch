# FaceMatch API 整合指南

## 📖 概述

本文檔說明如何整合 FaceMatch 官方 API 到企業管理系統中。

**官方 API 文檔**: https://documenter.getpostman.com/view/1454150/U16qHi2T

## 🔧 配置設定

### 環境變數配置

```bash
# FaceMatch API 設定
FACEMATCH_API_URL=https://api.facematch.com
FACEMATCH_API_KEY=your_api_key_here
FACEMATCH_TIMEOUT=30000
FACEMATCH_RETRY_ATTEMPTS=3
```

### TypeScript 配置檔案

```typescript
// src/config/facematch.ts
export const FaceMatchConfig = {
  baseURL: process.env.FACEMATCH_API_URL || 'https://api.facematch.com',
  apiKey: process.env.FACEMATCH_API_KEY || '',
  timeout: parseInt(process.env.FACEMATCH_TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.FACEMATCH_RETRY_ATTEMPTS || '3')
};
```

## 🚀 API 服務使用

### 初始化服務

```typescript
import { getFaceMatchService } from '../services/FaceMatchAPIService';

// 初始化 FaceMatch 服務
const faceMatchService = getFaceMatchService({
  baseURL: 'https://api.facematch.com',
  apiKey: 'your_api_key_here',
  timeout: 30000,
  retryAttempts: 3
});
```

### 基本使用範例

```typescript
// 1. 註冊新人員
const registerResult = await faceMatchService.registerPerson({
  name: '張工程師',
  images: ['base64_image_data_1', 'base64_image_data_2'],
  metadata: {
    employeeId: 'EMP001',
    department: '工程部',
    contractorId: 123
  }
});

// 2. 人臉驗證
const verifyResult = await faceMatchService.verifyFace({
  personId: 'person_id_from_registration',
  image: 'base64_verification_image',
  threshold: 0.8
});

// 3. 人臉識別 (1:N 比對)
const identifyResult = await faceMatchService.identifyFace(
  'base64_unknown_face_image',
  0.7
);

// 4. 批量驗證
const batchResult = await faceMatchService.batchVerify([
  { personId: 'person1', image: 'image1', threshold: 0.8 },
  { personId: 'person2', image: 'image2', threshold: 0.8 }
]);
```

## 📋 核心 API 端點

### 人員管理

| 方法 | 端點 | 功能 | 參數 |
|------|------|------|------|
| POST | `/api/v1/persons` | 註冊人員 | `{ name, images, metadata }` |
| GET | `/api/v1/persons` | 取得人員列表 | `?page=1&limit=50` |
| GET | `/api/v1/persons/{id}` | 取得人員詳情 | - |
| PUT | `/api/v1/persons/{id}` | 更新人員資料 | `{ name?, images?, metadata? }` |
| DELETE | `/api/v1/persons/{id}` | 刪除人員 | - |

### 人臉比對

| 方法 | 端點 | 功能 | 參數 |
|------|------|------|------|
| POST | `/api/v1/verify` | 1:1 人臉驗證 | `{ person_id, image, threshold? }` |
| POST | `/api/v1/identify` | 1:N 人臉識別 | `{ image, threshold? }` |
| POST | `/api/v1/verify/batch` | 批量驗證 | `{ requests: [...] }` |

### 系統管理

| 方法 | 端點 | 功能 | 說明 |
|------|------|------|------|
| GET | `/api/v1/health` | 健康檢查 | 檢查 API 服務狀態 |

## 🔐 認證方式

### Bearer Token 認證

```typescript
// 所有請求都需要在 Header 中包含認證資訊
headers: {
  'Authorization': `Bearer ${your_api_key}`,
  'Content-Type': 'application/json'
}
```

### API 金鑰管理

```typescript
// 動態設定 API 金鑰
faceMatchService.setApiKey('new_api_key');

// 獲取當前配置
const config = faceMatchService.getConfig();
```

## 📊 回應格式

### 標準回應結構

```typescript
interface FaceMatchResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}
```

### 成功回應範例

```json
{
  "success": true,
  "data": {
    "personId": "person_12345",
    "confidence": 0.95,
    "matched": true
  },
  "message": "人臉驗證成功",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### 錯誤回應範例

```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "API 認證失敗",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

## 🔄 整合到企業系統

### 1. 承攬商人員註冊流程

```typescript
// 在新增承攬商人員時自動註冊到 FaceMatch
async function registerContractorPerson(personData: ContractorPerson) {
  try {
    // 1. 先在本地系統建立記錄
    const localPerson = await ContractorPerson.create(personData);
    
    // 2. 註冊到 FaceMatch
    const faceMatchResult = await faceMatchService.registerPerson({
      name: personData.name,
      images: personData.faceImages, // Base64 格式的人臉照片
      metadata: {
        localId: localPerson.id,
        contractorId: personData.contractorId,
        employeeId: personData.employeeId
      }
    });
    
    // 3. 更新本地記錄的 FaceMatch ID
    if (faceMatchResult.success) {
      await localPerson.update({
        faceMatchPersonId: faceMatchResult.data.personId
      });
      
      // 4. 記錄操作日誌
      await logOperation(req, 'CREATE', 'facematch', 'person', 
        faceMatchResult.data.personId, personData.name, 
        'FaceMatch 人員註冊成功', faceMatchResult.data);
    }
    
    return { localPerson, faceMatchResult };
  } catch (error) {
    await logOperation(req, 'CREATE', 'facematch', 'person', 
      null, personData.name, 'FaceMatch 人員註冊失敗', 
      { error: error.message }, 'ERROR', error.message);
    throw error;
  }
}
```

### 2. 施工現場人臉驗證

```typescript
// 在施工單簽到時進行人臉驗證
async function verifyWorkerEntry(workOrderId: number, personId: string, faceImage: string) {
  try {
    // 1. 取得人員的 FaceMatch ID
    const person = await ContractorPerson.findOne({
      where: { id: personId },
      include: [{ model: Contractor }]
    });
    
    if (!person?.faceMatchPersonId) {
      throw new Error('該人員尚未註冊 FaceMatch 系統');
    }
    
    // 2. 執行人臉驗證
    const verifyResult = await faceMatchService.verifyFace({
      personId: person.faceMatchPersonId,
      image: faceImage,
      threshold: 0.8
    });
    
    // 3. 記錄驗證結果
    await FaceMatchRecord.create({
      workOrderId,
      personId,
      personName: person.name,
      contractorName: person.Contractor?.name,
      verificationResult: verifyResult.data?.matched ? 'SUCCESS' : 'FAILED',
      confidence: verifyResult.data?.confidence,
      verifiedAt: new Date(),
      faceImage: faceImage // 儲存驗證時的照片
    });
    
    // 4. 記錄操作日誌
    await logOperation(req, 'VERIFY', 'facematch', 'verification', 
      workOrderId, `${person.name} 人臉驗證`, 
      `工單 ${workOrderId} 人員 ${person.name} 人臉驗證${verifyResult.data?.matched ? '成功' : '失敗'}`, 
      verifyResult.data);
    
    return verifyResult;
  } catch (error) {
    await logOperation(req, 'VERIFY', 'facematch', 'verification', 
      workOrderId, '人臉驗證', '人臉驗證過程發生錯誤', 
      { error: error.message }, 'ERROR', error.message);
    throw error;
  }
}
```

### 3. 批量同步功能

```typescript
// 定期同步本地人員到 FaceMatch
async function syncAllPersonsToFaceMatch() {
  try {
    const unSyncedPersons = await ContractorPerson.findAll({
      where: { faceMatchPersonId: null },
      include: [{ model: Contractor }]
    });
    
    console.log(`開始同步 ${unSyncedPersons.length} 個人員到 FaceMatch...`);
    
    for (const person of unSyncedPersons) {
      try {
        const result = await faceMatchService.registerPerson({
          name: person.name,
          images: person.faceImages || [],
          metadata: {
            localId: person.id,
            contractorId: person.contractorId,
            employeeId: person.employeeId
          }
        });
        
        if (result.success) {
          await person.update({
            faceMatchPersonId: result.data.personId,
            lastSyncAt: new Date()
          });
          console.log(`✅ ${person.name} 同步成功`);
        } else {
          console.log(`❌ ${person.name} 同步失敗: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${person.name} 同步錯誤: ${error.message}`);
      }
    }
    
    console.log('同步完成');
  } catch (error) {
    console.error('批量同步失敗:', error);
  }
}
```

## 🛡️ 錯誤處理

### 常見錯誤及處理

```typescript
// 錯誤處理包裝器
async function safeApiCall<T>(
  operation: () => Promise<FaceMatchResponse<T>>,
  fallbackMessage: string
): Promise<FaceMatchResponse<T>> {
  try {
    return await operation();
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'API 認證失敗，請檢查 API 金鑰',
        message: fallbackMessage,
        timestamp: new Date().toISOString()
      };
    } else if (error.response?.status === 429) {
      return {
        success: false,
        error: 'API 請求頻率過高，請稍後再試',
        message: fallbackMessage,
        timestamp: new Date().toISOString()
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'FaceMatch API 服務無法連接',
        message: fallbackMessage,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: error.message || '未知錯誤',
        message: fallbackMessage,
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

### 重試機制

```typescript
// 自動重試配置 (已內建在 FaceMatchAPIService 中)
const service = new FaceMatchAPIService({
  baseURL: 'https://api.facematch.com',
  apiKey: 'your_key',
  retryAttempts: 3, // 失敗時自動重試 3 次
  timeout: 30000    // 30 秒超時
});
```

## 📈 監控與日誌

### 性能監控

```typescript
// API 呼叫性能監控
async function monitoredApiCall<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${operationName} 完成 (${duration}ms)`);
    
    // 記錄性能指標
    await logOperation(req, 'API_CALL', 'facematch', 'performance', 
      null, operationName, `API 呼叫成功`, 
      { duration, operationName }, 'SUCCESS');
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`❌ ${operationName} 失敗 (${duration}ms): ${error.message}`);
    
    await logOperation(req, 'API_CALL', 'facematch', 'performance', 
      null, operationName, `API 呼叫失敗`, 
      { duration, operationName, error: error.message }, 'ERROR', error.message);
    
    throw error;
  }
}
```

### 使用範例

```typescript
// 監控包裝的 API 呼叫
const result = await monitoredApiCall(
  () => faceMatchService.verifyFace({
    personId: 'person_123',
    image: 'base64_image',
    threshold: 0.8
  }),
  'FaceMatch 人臉驗證'
);
```

## 🔄 定期維護

### 清理舊記錄

```typescript
// 定期清理 FaceMatch 記錄
async function cleanupOldFaceMatchRecords() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 保留 6 個月
    
    const deletedCount = await FaceMatchRecord.destroy({
      where: {
        createdAt: { [Op.lt]: cutoffDate }
      }
    });
    
    console.log(`清理了 ${deletedCount} 條舊的 FaceMatch 記錄`);
  } catch (error) {
    console.error('清理 FaceMatch 記錄失敗:', error);
  }
}
```

### 健康檢查

```typescript
// 定期健康檢查
async function performHealthCheck() {
  try {
    const healthResult = await faceMatchService.healthCheck();
    
    if (healthResult.success) {
      console.log('✅ FaceMatch API 服務正常');
    } else {
      console.log('❌ FaceMatch API 服務異常:', healthResult.error);
    }
    
    return healthResult;
  } catch (error) {
    console.error('❌ FaceMatch API 健康檢查失敗:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'API 健康檢查失敗',
      timestamp: new Date().toISOString()
    };
  }
}
```

## 🚀 部署建議

### 生產環境配置

```bash
# 生產環境變數
FACEMATCH_API_URL=https://api.facematch.com
FACEMATCH_API_KEY=prod_api_key_here
FACEMATCH_TIMEOUT=60000
FACEMATCH_RETRY_ATTEMPTS=5

# 開發環境
FACEMATCH_API_URL=https://dev-api.facematch.com
FACEMATCH_API_KEY=dev_api_key_here
FACEMATCH_TIMEOUT=30000
FACEMATCH_RETRY_ATTEMPTS=3
```

### Docker 配置

```dockerfile
# 在 Dockerfile 中設定環境變數
ENV FACEMATCH_API_URL=https://api.facematch.com
ENV FACEMATCH_TIMEOUT=30000
ENV FACEMATCH_RETRY_ATTEMPTS=3
```

## 📝 總結

FaceMatch API 整合提供了完整的人臉識別功能，包括：

- ✅ **人員註冊管理** - 支援批量註冊和更新
- ✅ **人臉驗證** - 1:1 比對驗證
- ✅ **人臉識別** - 1:N 搜尋識別
- ✅ **批量處理** - 支援大量驗證請求
- ✅ **錯誤處理** - 完善的重試和錯誤恢復機制
- ✅ **性能監控** - 完整的操作日誌和性能追蹤
- ✅ **企業整合** - 與現有系統無縫整合

透過這套整合方案，企業可以輕鬆實現人臉識別功能，提升安全管理效率。