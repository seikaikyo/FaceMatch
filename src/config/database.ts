import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/facematch-cms';
    
    await mongoose.connect(mongoUri);
    
    logger.info(`MongoDB 連線成功: ${mongoUri}`);
  } catch (error) {
    logger.error('MongoDB 連線失敗:', error);
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB 連線錯誤:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB 連線中斷');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB 連線已關閉');
  process.exit(0);
});

export default connectDatabase;