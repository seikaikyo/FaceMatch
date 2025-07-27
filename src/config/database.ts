import { Sequelize } from 'sequelize';
import path from 'path';
import logger from '../utils/logger';

// SQLite 配置
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'facematch.sqlite'),
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: false,
  },
});

const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ SQLite 資料庫連線成功');
    
    // 同步資料庫結構 (開發環境)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('📊 資料庫結構同步完成');
    }
  } catch (error) {
    logger.error('❌ SQLite 資料庫連線失敗:', error);
    throw error; // 不強制退出，讓應用程式決定如何處理
  }
};

// 優雅關閉
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    logger.info('📴 SQLite 資料庫連線已關閉');
    process.exit(0);
  } catch (error) {
    logger.error('關閉資料庫連線時發生錯誤:', error);
    process.exit(1);
  }
});

export { sequelize };
export default connectDatabase;