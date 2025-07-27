import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';
import { config } from './config';
// import connectDatabase from './config/database';
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

// Swagger API 文檔設定
const swaggerSpec = YAML.load(path.join(__dirname, 'docs', 'openapi.yml'));

// Swagger UI 設定
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; border: 1px solid #e2e8f0; }
  `,
  customSiteTitle: 'FaceMatch API 文檔',
  customfavIcon: '/favicon.ico'
};

// API 文檔路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: config.system.siteVersion,
    docs: '/api-docs'
  });
});

// API 文檔 JSON 端點
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API 路由
import apiRoutes from './routes/api';
import { errorHandler, notFound } from './middleware/error';
// import { seedDatabase } from './utils/seed';
app.use('/api', apiRoutes);

// 404 處理
app.use('*', notFound);

// 全域錯誤處理
app.use(errorHandler);

const startServer = async () => {
  try {
    // 直接啟動伺服器，暫時跳過資料庫連接
    logger.info('🚀 啟動 TypeScript 後端服務 (含 API 端點)');
    
    // 啟動伺服器
    app.listen(config.port, 'localhost', () => {
      logger.info(`🚀 伺服器已啟動在 http://localhost:${config.port}`);
      logger.info(`📝 環境: ${config.nodeEnv}`);
      logger.info(`🏢 系統: ${config.system.siteName} v${config.system.siteVersion}`);
      logger.info(`🔗 本機存取: http://localhost:${config.port}/health`);
      logger.info(`📖 API 文檔: http://localhost:${config.port}/api-docs`);
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