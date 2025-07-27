const API_BASE = 'http://localhost:5001/api';

async function testApprovalPermission() {
    console.log('🧪 測試簽核權限...\n');
    
    try {
        // 1. 管理員登入
        console.log('1️⃣ 管理員登入...');
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                useAD: false
            })
        });
        const loginResult = await loginResponse.json();
        
        if (!loginResult.success) {
            throw new Error('管理員登入失敗');
        }
        
        console.log('✅ 管理員登入成功');
        console.log('👤 用戶資訊:', loginResult.user);
        const sessionId = loginResult.sessionId;
        
        // 2. 查看待簽核清單
        console.log('\n2️⃣ 查看待簽核清單...');
        const approvalsResponse = await fetch(`${API_BASE}/work-orders/pending-approval`, {
            headers: { 'session-id': sessionId }
        });
        const approvalsResult = await approvalsResponse.json();
        
        if (approvalsResult.success) {
            console.log('✅ 待簽核清單載入成功');
            console.log(`📋 待簽核項目數量: ${approvalsResult.data.length}`);
            
            approvalsResult.data.forEach((order, index) => {
                console.log(`\n📄 施工單 ${index + 1}:`);
                console.log(`   編號: ${order.orderNumber}`);
                console.log(`   標題: ${order.title}`);
                console.log(`   狀態: ${order.status}`);
                console.log(`   目前簽核者: ${order.currentApprover}`);
                console.log(`   簽核層級: ${order.approvalLevel}/${order.totalLevels}`);
            });
        } else {
            console.log('❌ 待簽核清單載入失敗:', approvalsResult.message);
        }
        
        // 3. 測試權限邏輯
        console.log('\n3️⃣ 測試權限邏輯...');
        
        const testRoles = ['ADMIN', 'EHS', 'MANAGER'];
        const roleToApprover = {
            'ADMIN': '管理員',
            'EHS': '職環安',
            'MANAGER': '再生經理'
        };
        
        if (approvalsResult.success && approvalsResult.data.length > 0) {
            const testOrder = approvalsResult.data[0];
            
            testRoles.forEach(role => {
                const approverName = roleToApprover[role];
                const canApprove = role === 'ADMIN' || testOrder.currentApprover === approverName;
                
                console.log(`\n🔍 ${role} (${approverName}) 權限檢查:`);
                console.log(`   目前簽核者: ${testOrder.currentApprover}`);
                console.log(`   是否可簽核: ${canApprove ? '✅ 是' : '❌ 否'}`);
                console.log(`   檢查邏輯: ${role === 'ADMIN' ? 'ADMIN 權限' : `"${testOrder.currentApprover}" === "${approverName}"`}`);
            });
        }
        
        console.log('\n✅ 測試完成！');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testApprovalPermission();