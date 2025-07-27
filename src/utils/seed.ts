import { User, Contractor } from '../models';
import { config } from '../config';
import logger from './logger';
import bcrypt from 'bcryptjs';

export async function seedDatabase(): Promise<void> {
  try {
    // 檢查是否已經有管理員用戶
    const adminExists = await User.findOne({ where: { role: 'ADMIN' } });
    if (adminExists) {
      logger.info('管理員用戶已存在，跳過種子資料建立');
      return;
    }

    logger.info('開始建立種子資料...');

    // 建立預設管理員用戶
    const adminPassword = await bcrypt.hash(config.system.defaultAdminPassword, 12);
    const admin = await User.create({
      username: 'admin',
      email: config.system.defaultAdminEmail,
      passwordHash: adminPassword,
      displayName: '系統管理員',
      role: 'ADMIN',
      isActive: true,
      canApprove: true,
      approvalLevel: 3,
      authType: 'LOCAL'
    });
    logger.info('建立管理員用戶成功');

    // 建立 EHS 用戶
    const ehsPassword = await bcrypt.hash('ehs123', 12);
    const ehs = await User.create({
      username: 'ehs',
      email: 'ehs@facematch.local',
      passwordHash: ehsPassword,
      displayName: '職環安人員',
      role: 'EHS',
      isActive: true,
      canApprove: true,
      approvalLevel: 1,
      authType: 'LOCAL',
      jobTitle: '職環安工程師',
      department: '安全衛生處'
    });
    logger.info('建立 EHS 用戶成功');

    // 建立 MANAGER 用戶
    const managerPassword = await bcrypt.hash('manager123', 12);
    const manager = await User.create({
      username: 'manager',
      email: 'manager@facematch.local',
      passwordHash: managerPassword,
      displayName: '再生經理',
      role: 'MANAGER',
      isActive: true,
      canApprove: true,
      approvalLevel: 2,
      authType: 'LOCAL',
      jobTitle: '再生處經理',
      department: '再生處'
    });
    logger.info('建立 MANAGER 用戶成功');

    // 建立測試承攬商
    const testContractors = [
      {
        name: '台積電承攬商',
        contact: '張建明',
        phone: '02-2345-6789',
        email: 'contact@tsmc-contractor.com',
        address: '新竹科學園區',
        status: 'ACTIVE' as const
      },
      {
        name: '永豐營造股份有限公司',
        contact: '李永豐',
        phone: '04-2468-1357',
        email: 'contact@yungfeng.com',
        address: '台中市西屯區',
        status: 'ACTIVE' as const
      },
      {
        name: '中華機電工程公司',
        contact: '王機電',
        phone: '07-3691-2580',
        email: 'contact@china-electrical.com',
        address: '高雄市前鎮區',
        status: 'INACTIVE' as const
      }
    ];

    const savedContractors = [];
    for (const contractorData of testContractors) {
      const contractor = await Contractor.create(contractorData);
      savedContractors.push(contractor);
    }
    logger.info('建立測試承攬商成功');

    // 建立承攬商用戶
    const contractorPassword = await bcrypt.hash('contractor123', 12);
    const contractor = await User.create({
      username: 'contractor',
      email: 'contractor@test.com',
      passwordHash: contractorPassword,
      displayName: '承攬商用戶',
      role: 'CONTRACTOR',
      contractorId: savedContractors[0].id,
      isActive: true,
      canApprove: false,
      authType: 'LOCAL',
      jobTitle: '現場主管',
      department: '工程部'
    });
    logger.info('建立承攬商用戶成功');

    logger.info('種子資料建立完成！');
    logger.info('預設用戶帳號：');
    logger.info('  管理員: admin / admin123');
    logger.info('  職環安: ehs / ehs123');  
    logger.info('  經理: manager / manager123');
    logger.info('  承攬商: contractor / contractor123');

  } catch (error) {
    logger.error('種子資料建立失敗:', error);
    throw error;
  }
}