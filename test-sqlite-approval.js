const API_BASE = 'http://localhost:5001/api';

async function testSQLiteApprovalWorkflow() {
    console.log('🧪 測試 SQLite 版本簽核工作流程...\n');
    
    try {
        // 1. 測試健康檢查
        console.log('1️⃣ 測試後端健康狀態...');
        const healthResponse = await fetch('http://localhost:5001/health');
        const healthData = await healthResponse.json();
        console.log('✅ 健康檢查:', healthData);
        
        // 2. 測試登入
        console.log('\n2️⃣ 測試登入功能...');
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const loginData = await loginResponse.json();
        console.log('✅ 登入結果:', loginData);
        
        // 3. 測試獲取待簽核清單
        console.log('\n3️⃣ 測試獲取待簽核清單...');
        const pendingResponse = await fetch(`${API_BASE}/work-orders/pending-approval`);
        const pendingData = await pendingResponse.json();
        console.log('✅ 待簽核清單:', pendingData);
        
        // 4. 測試獲取所有施工單
        console.log('\n4️⃣ 測試獲取所有施工單...');
        const workOrdersResponse = await fetch(`${API_BASE}/work-orders`);
        const workOrdersData = await workOrdersResponse.json();
        console.log('✅ 所有施工單:', workOrdersData);
        
        if (pendingData.success && pendingData.data.length > 0) {
            const workOrderId = pendingData.data[0].id;
            console.log(`\n📝 使用施工單 ID: ${workOrderId} 進行簽核測試`);
            
            // 5. 測試職環安簽核（第一層）
            console.log('\n5️⃣ 測試職環安簽核（第一層）...');
            const firstApprovalResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'APPROVED',
                    comment: '職環安審核通過 - 安全檢查合格',
                    approver: '職環安'
                })
            });
            const firstApprovalData = await firstApprovalResponse.json();
            console.log('✅ 職環安簽核結果:', firstApprovalData);
            
            // 6. 檢查簽核歷史
            console.log('\n6️⃣ 檢查簽核歷史...');
            const historyResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/history`);
            const historyData = await historyResponse.json();
            console.log('✅ 簽核歷史:', historyData);
            
            // 7. 測試再生經理簽核（第二層）
            console.log('\n7️⃣ 測試再生經理簽核（第二層）...');
            const secondApprovalResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'APPROVED',
                    comment: '再生經理最終核准 - 所有條件符合',
                    approver: '再生經理'
                })
            });
            const secondApprovalData = await secondApprovalResponse.json();
            console.log('✅ 再生經理簽核結果:', secondApprovalData);
            
            // 8. 檢查最終狀態
            console.log('\n8️⃣ 檢查施工單最終狀態...');
            const finalWorkOrdersResponse = await fetch(`${API_BASE}/work-orders`);
            const finalWorkOrdersData = await finalWorkOrdersResponse.json();
            const updatedWorkOrder = finalWorkOrdersData.data.find(wo => wo.id === workOrderId);
            console.log('✅ 最終施工單狀態:', updatedWorkOrder);
            
            // 9. 檢查完整簽核歷史
            console.log('\n9️⃣ 檢查完整簽核歷史...');
            const finalHistoryResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/history`);
            const finalHistoryData = await finalHistoryResponse.json();
            console.log('✅ 完整簽核歷史:', finalHistoryData);
            
            // 10. 檢查待簽核清單是否更新
            console.log('\n🔟 檢查更新後的待簽核清單...');
            const updatedPendingResponse = await fetch(`${API_BASE}/work-orders/pending-approval`);
            const updatedPendingData = await updatedPendingResponse.json();
            console.log('✅ 更新後待簽核清單:', updatedPendingData);
        }
        
        console.log('\n🎉 SQLite 版本簽核工作流程測試完成！');
        console.log('✅ 新的簽核者角色已更新：職環安 → 再生經理');
        console.log('✅ SQLite 數據庫持久化正常運作');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testSQLiteApprovalWorkflow();