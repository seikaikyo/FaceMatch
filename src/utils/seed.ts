import { User, Contractor } from '../models';
import { AuthService } from './auth';
import { config } from '../config';
import logger from './logger';

export async function seedDatabase(): Promise<void> {
  try {
    // 檢查是否已經有管理員用戶
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      logger.info('管理員用戶已存在，跳過種子資料建立');
      return;
    }

    logger.info('開始建立種子資料...');

    // 建立預設管理員用戶
    const adminPassword = await AuthService.hashPassword(config.system.defaultAdminPassword);
    const admin = new User({
      username: 'admin',
      email: config.system.defaultAdminEmail,
      passwordHash: adminPassword,
      name: '系統管理員',
      role: 'ADMIN',
      permissions: ['*'],
      isActive: true
    });
    await admin.save();
    logger.info('建立管理員用戶成功');

    // 建立 EHS 用戶
    const ehsPassword = await AuthService.hashPassword('ehs123');
    const ehs = new User({
      username: 'ehs',
      email: 'ehs@facematch.local',
      passwordHash: ehsPassword,
      name: '職環安人員',
      role: 'EHS',
      permissions: ['qualification:*', 'work-order:approve'],
      isActive: true
    });
    await ehs.save();
    logger.info('建立 EHS 用戶成功');

    // 建立 MANAGER 用戶
    const managerPassword = await AuthService.hashPassword('manager123');
    const manager = new User({
      username: 'manager',
      email: 'manager@facematch.local',
      passwordHash: managerPassword,
      name: '再生經理',
      role: 'MANAGER',
      permissions: ['work-order:approve', 'report:*'],
      isActive: true
    });
    await manager.save();
    logger.info('建立 MANAGER 用戶成功');

    // 建立測試承攬商
    const testContractors = [
      {
        name: '台灣建設工程有限公司',
        code: 'TWC001',
        status: 'ACTIVE',
        contactPerson: '張建明',
        contactPhone: '02-2345-6789',
        contractValidFrom: new Date(),
        contractValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        name: '永豐營造股份有限公司',
        code: 'YFC002',
        status: 'ACTIVE',
        contactPerson: '李永豐',
        contactPhone: '04-2468-1357',
        contractValidFrom: new Date(),
        contractValidTo: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
      },
      {
        name: '中華機電工程公司',
        code: 'CHE003',
        status: 'SUSPENDED',
        contactPerson: '王機電',
        contactPhone: '07-3691-2580',
        contractValidFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        contractValidTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      }
    ];

    const savedContractors = [];
    for (const contractorData of testContractors) {
      const contractor = new Contractor(contractorData);
      await contractor.save();
      savedContractors.push(contractor);
    }
    logger.info('建立測試承攬商成功');

    // 建立承攬商用戶
    const contractorPassword = await AuthService.hashPassword('contractor123');
    const contractor = new User({
      username: 'contractor',
      email: 'contractor@test.com',
      passwordHash: contractorPassword,
      name: '承攬商用戶',
      role: 'CONTRACTOR',
      contractorId: savedContractors[0]._id,
      permissions: ['person:*', 'work-order:create'],
      isActive: true
    });
    await contractor.save();
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