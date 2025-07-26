import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import connectDatabase from './config/database';
import logger from './utils/logger';

const app = express();

// 安全中介軟體
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// 請求日誌
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// 速率限制
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: { error: '請求過於頻繁，請稍後再試' }
});
app.use('/api', limiter);

// 解析請求
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: config.system.siteVersion
  });
});

// API 路由
import apiRoutes from './routes/api';
import { errorHandler, notFound } from './middleware/error';
import { seedDatabase } from './utils/seed';
app.use('/api', apiRoutes);

// 404 處理
app.use('*', notFound);

// 全域錯誤處理
app.use(errorHandler);

const startServer = async () => {
  try {
    // 嘗試連接資料庫，如果失敗則使用模擬資料
    try {
      await connectDatabase();
      logger.info('🗄️ 使用 MongoDB 資料庫');
      
      // 建立種子資料
      await seedDatabase();
    } catch (dbError) {
      logger.warn('⚠️ 無法連接資料庫，使用模擬資料模式');
      logger.warn('📊 所有 CRUD 操作將使用記憶體內模擬資料');
    }
    
    // 啟動伺服器
    app.listen(config.port, 'localhost', () => {
      logger.info(`🚀 伺服器已啟動在 http://localhost:${config.port}`);
      logger.info(`📝 環境: ${config.nodeEnv}`);
      logger.info(`🏢 系統: ${config.system.siteName} v${config.system.siteVersion}`);
      logger.info(`🔗 本機存取: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('伺服器啟動失敗:', error);
    process.exit(1);
  }
};

// 優雅關閉
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信號，正在關閉伺服器...');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

export default app;