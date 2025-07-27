const API_BASE = 'http://localhost:5001/api';

async function testAuthenticationFix() {
    console.log('🧪 測試認證系統修復...\n');
    
    try {
        // 1. 測試管理員登入
        console.log('1️⃣ 測試管理員登入...');
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
        console.log('✅ 管理員登入結果:', loginResult.success ? '成功' : '失敗');
        
        if (!loginResult.success) {
            console.log('❌ 登入失敗，無法繼續測試');
            return;
        }
        
        const sessionId = loginResult.sessionId;
        console.log('📋 會話ID:', sessionId);
        console.log('👤 用戶資訊:', loginResult.user);
        
        // 2. 使用會話創建施工單
        console.log('\n2️⃣ 使用認證會話創建施工單...');
        
        // 先創建承攬商
        const contractorResponse = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                name: '認證測試承攬商',
                code: 'AUTH_TEST_' + Date.now(),
                contact: '測試聯絡人',
                phone: '02-1234-5678',
                status: 'ACTIVE'
            })
        });
        const contractorResult = await contractorResponse.json();
        console.log('✅ 承攬商創建:', contractorResult.success ? '成功' : '失敗');
        
        if (!contractorResult.success) {
            console.log('❌ 承攬商創建失敗:', contractorResult.message);
            return;
        }
        
        const contractorId = contractorResult.data.id;
        
        // 創建施工單
        const workOrderResponse = await fetch(`${API_BASE}/work-orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                orderNumber: 'WO_AUTH_' + Date.now(),
                title: '認證測試施工單',
                contractorId: contractorId,
                location: '測試地點',
                status: 'DRAFT'
            })
        });
        const workOrderResult = await workOrderResponse.json();
        console.log('✅ 施工單創建:', workOrderResult.success ? '成功' : '失敗');
        
        if (!workOrderResult.success) {
            console.log('❌ 施工單創建失敗:', workOrderResult.message);
            return;
        }
        
        const workOrderId = workOrderResult.data.id;
        console.log('📋 施工單ID:', workOrderId);
        
        // 3. 測試簽核權限
        console.log('\n3️⃣ 測試簽核權限...');
        
        // 設置施工單為待簽核狀態
        await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                status: 'PENDING_EHS',
                currentApprover: '職環安',
                approvalLevel: 1
            })
        });
        
        // 測試職環安簽核（管理員應該有權限）
        const ehsApprovalResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '管理員代理職環安核准'
            })
        });
        const ehsApprovalResult = await ehsApprovalResponse.json();
        console.log('✅ 職環安簽核權限測試:', ehsApprovalResult.success ? '成功' : '失敗');
        
        if (!ehsApprovalResult.success) {
            console.log('❌ 簽核失敗:', ehsApprovalResult.message);
        }
        
        // 4. 測試經理駁回選擇權限
        console.log('\n4️⃣ 測試經理駁回選擇權限...');
        
        const managerRejectResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': sessionId
            },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '測試經理駁回選擇功能',
                rejectTo: 'PREVIOUS_LEVEL'
            })
        });
        const managerRejectResult = await managerRejectResponse.json();
        console.log('✅ 經理駁回選擇權限:', managerRejectResult.success ? '成功' : '失敗');
        
        // 5. 清理測試資料
        console.log('\n5️⃣ 清理測試資料...');
        await fetch(`${API_BASE}/work-orders/${workOrderId}`, { 
            method: 'DELETE',
            headers: { 'session-id': sessionId }
        });
        await fetch(`${API_BASE}/contractors/${contractorId}`, { 
            method: 'DELETE',
            headers: { 'session-id': sessionId }
        });
        console.log('✅ 清理完成');
        
        console.log('\n🎉 認證系統修復測試完成！');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testAuthenticationFix();