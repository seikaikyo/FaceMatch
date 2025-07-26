export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 資料庫
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/facematch-cms',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // FaceMatch API
  faceMatch: {
    host: process.env.FACEMATCH_HOST || '10.6.116.200',
    port: parseInt(process.env.FACEMATCH_PORT || '80'),
    username: process.env.FACEMATCH_USERNAME || 'Admin',
    password: process.env.FACEMATCH_PASSWORD || 'password',
    protocol: process.env.FACEMATCH_PROTOCOL || 'http',
    timeout: parseInt(process.env.FACEMATCH_TIMEOUT || '30000'),
  },
  
  // 上傳設定
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png'],
  },
  
  // 安全設定
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // 系統設定
  system: {
    siteName: process.env.SITE_NAME || 'FaceMatch 承攬商管理系統',
    siteVersion: process.env.SITE_VERSION || '1.0.0',
    defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@facematch.local',
    defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },
  
  // 日誌設定
  logLevel: process.env.LOG_LEVEL || 'info',
};