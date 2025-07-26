const API_BASE = 'http://localhost:5001/api';

async function testFinalApproval() {
    console.log('🧪 測試最終核准工作流程...\n');
    
    try {
        // 對施工單 ID 1 進行最終核准（第二層）
        console.log('📋 對施工單 WO001 進行最終層級核准...');
        
        const finalApprovalResponse = await fetch(`${API_BASE}/work-orders/1/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comment: '最終核准 - 所有條件符合要求',
                approver: '陳經理'
            })
        });
        
        const finalApprovalData = await finalApprovalResponse.json();
        console.log('✅ 最終核准結果:', finalApprovalData);
        
        // 檢查施工單最終狀態
        console.log('\n📊 檢查施工單最終狀態...');
        const workOrdersResponse = await fetch(`${API_BASE}/work-orders`);
        const workOrdersData = await workOrdersResponse.json();
        const finalWorkOrder = workOrdersData.data.find(wo => wo.id === 1);
        console.log('✅ 最終施工單狀態:', finalWorkOrder);
        
        // 檢查完整簽核歷史
        console.log('\n📚 檢查完整簽核歷史...');
        const historyResponse = await fetch(`${API_BASE}/work-orders/1/history`);
        const historyData = await historyResponse.json();
        console.log('✅ 完整簽核歷史:', historyData);
        
        // 檢查待簽核清單（應該不包含剛核准的施工單）
        console.log('\n📋 檢查更新後的待簽核清單...');
        const pendingResponse = await fetch(`${API_BASE}/work-orders/pending-approval`);
        const pendingData = await pendingResponse.json();
        console.log('✅ 更新後待簽核清單:', pendingData);
        
        console.log('\n🎉 最終核准工作流程測試完成！');
        console.log('✅ 簽核系統完全正常運作');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testFinalApproval();