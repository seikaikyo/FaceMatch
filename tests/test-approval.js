const API_BASE = 'http://localhost:5001/api';

async function testApprovalWorkflow() {
    console.log('🧪 開始測試簽核工作流程...\n');
    
    try {
        // 1. 測試獲取待簽核清單
        console.log('1️⃣ 測試獲取待簽核清單...');
        const pendingResponse = await fetch(`${API_BASE}/work-orders/pending-approval`);
        const pendingData = await pendingResponse.json();
        console.log('✅ 待簽核清單:', pendingData);
        
        if (pendingData.success && pendingData.data.length > 0) {
            const workOrderId = pendingData.data[0].id;
            console.log(`📝 使用施工單 ID: ${workOrderId} 進行簽核測試\n`);
            
            // 2. 測試獲取簽核歷史
            console.log('2️⃣ 測試獲取簽核歷史...');
            const historyResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/history`);
            const historyData = await historyResponse.json();
            console.log('✅ 簽核歷史:', historyData);
            
            // 3. 測試核准動作
            console.log('3️⃣ 測試核准動作...');
            const approveResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'APPROVED',
                    comment: '自動化測試核准',
                    approver: '測試管理員'
                })
            });
            const approveData = await approveResponse.json();
            console.log('✅ 核准結果:', approveData);
            
            // 4. 再次檢查簽核歷史
            console.log('4️⃣ 檢查更新後的簽核歷史...');
            const updatedHistoryResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}/history`);
            const updatedHistoryData = await updatedHistoryResponse.json();
            console.log('✅ 更新後簽核歷史:', updatedHistoryData);
            
            // 5. 檢查施工單狀態更新
            console.log('5️⃣ 檢查施工單狀態更新...');
            const workOrdersResponse = await fetch(`${API_BASE}/work-orders`);
            const workOrdersData = await workOrdersResponse.json();
            const updatedWorkOrder = workOrdersData.data.find(wo => wo.id === workOrderId);
            console.log('✅ 更新後施工單狀態:', updatedWorkOrder);
            
        } else {
            console.log('⚠️ 沒有待簽核的施工單，創建一個測試用施工單...');
            
            // 創建測試施工單
            const createResponse = await fetch(`${API_BASE}/work-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderNumber: 'TEST' + Date.now(),
                    title: '測試簽核施工單',
                    contractorId: 1,
                    location: '測試廠區',
                    submittedBy: '測試提交者'
                })
            });
            const createData = await createResponse.json();
            console.log('✅ 創建測試施工單:', createData);
            
            if (createData.success) {
                const newWorkOrderId = createData.data.id;
                console.log(`📝 使用新建施工單 ID: ${newWorkOrderId} 進行簽核測試\n`);
                
                // 重複測試步驟 2-5
                await testApprovalActions(newWorkOrderId);
            }
        }
        
        console.log('\n🎉 簽核工作流程測試完成！');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

async function testApprovalActions(workOrderId) {
    // 測試各種簽核動作
    const actions = [
        { action: 'APPROVED', comment: '第一層核准測試' },
        { action: 'REJECTED', comment: '駁回測試' },
        { action: 'RETURNED', comment: '退回修正測試' }
    ];
    
    for (const actionTest of actions) {
        console.log(`🔍 測試 ${actionTest.action} 動作...`);
        
        const response = await fetch(`${API_BASE}/work-orders/${workOrderId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...actionTest,
                approver: '測試簽核者'
            })
        });
        
        const data = await response.json();
        console.log(`✅ ${actionTest.action} 測試結果:`, data);
        
        // 短暫暫停，避免太快執行
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// 執行測試
testApprovalWorkflow();