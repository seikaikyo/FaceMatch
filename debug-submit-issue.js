const API_BASE = 'http://localhost:5001/api';

async function debugSubmitIssue() {
    console.log('🔍 調試提交申請問題...\n');
    
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
            console.log('❌ 登入失敗:', loginResult.message);
            return;
        }
        
        console.log('✅ 登入成功');
        console.log('📋 SessionId:', loginResult.sessionId);
        console.log('👤 用戶資訊:', JSON.stringify(loginResult.user, null, 2));
        
        const sessionId = loginResult.sessionId;
        
        // 2. 查看現有施工單
        console.log('\n2️⃣ 查看現有施工單...');
        const workOrdersResponse = await fetch(`${API_BASE}/work-orders`, {
            headers: { 'session-id': sessionId }
        });
        const workOrdersResult = await workOrdersResponse.json();
        
        if (workOrdersResult.success) {
            console.log('✅ 施工單清單載入成功');
            console.log(`📋 施工單數量: ${workOrdersResult.data.length}`);
            
            workOrdersResult.data.forEach((wo, index) => {
                console.log(`\n施工單 ${index + 1}:`);
                console.log(`  ID: ${wo.id}`);
                console.log(`  編號: ${wo.orderNumber}`);
                console.log(`  狀態: ${wo.status}`);
                console.log(`  目前簽核者: ${wo.currentApprover || '無'}`);
                console.log(`  簽核層級: ${wo.approvalLevel || 0}`);
            });
            
            // 找一個 DRAFT 狀態的施工單來測試
            const draftOrder = workOrdersResult.data.find(wo => wo.status === 'DRAFT');
            
            if (draftOrder) {
                console.log(`\n🎯 找到 DRAFT 施工單進行測試: ${draftOrder.id}`);
                
                // 3. 測試提交申請
                console.log('\n3️⃣ 測試提交申請...');
                const submitResponse = await fetch(`${API_BASE}/approvals/${draftOrder.id}/submit`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'session-id': sessionId
                    }
                });
                
                console.log('📋 提交響應狀態:', submitResponse.status);
                console.log('📋 提交響應標頭:', Object.fromEntries(submitResponse.headers.entries()));
                
                const submitResult = await submitResponse.json();
                console.log('📋 提交結果:', JSON.stringify(submitResult, null, 2));
                
                if (submitResult.success) {
                    console.log('✅ 提交成功！');
                    
                    // 4. 重新查看施工單狀態
                    console.log('\n4️⃣ 檢查更新後的狀態...');
                    const updatedResponse = await fetch(`${API_BASE}/work-orders`, {
                        headers: { 'session-id': sessionId }
                    });
                    const updatedResult = await updatedResponse.json();
                    
                    const updatedOrder = updatedResult.data.find(wo => wo.id === draftOrder.id);
                    if (updatedOrder) {
                        console.log('📋 更新後狀態:');
                        console.log(`  狀態: ${updatedOrder.status}`);
                        console.log(`  目前簽核者: ${updatedOrder.currentApprover}`);
                        console.log(`  簽核層級: ${updatedOrder.approvalLevel}`);
                    }
                } else {
                    console.log('❌ 提交失敗:', submitResult.message);
                }
            } else {
                console.log('⚠️ 沒有找到 DRAFT 狀態的施工單');
                console.log('💡 創建新的 DRAFT 施工單...');
                
                // 先創建承攬商
                const contractorResponse = await fetch(`${API_BASE}/contractors`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'session-id': sessionId
                    },
                    body: JSON.stringify({
                        name: '調試測試承攬商',
                        code: 'DEBUG_' + Date.now(),
                        contact: '測試聯絡人',
                        phone: '02-1234-5678',
                        status: 'ACTIVE'
                    })
                });
                const contractorResult = await contractorResponse.json();
                
                if (contractorResult.success) {
                    // 創建 DRAFT 施工單
                    const newWorkOrderResponse = await fetch(`${API_BASE}/work-orders`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'session-id': sessionId
                        },
                        body: JSON.stringify({
                            orderNumber: 'WO_DEBUG_' + Date.now(),
                            title: '調試測試施工單',
                            contractorId: contractorResult.data.id,
                            location: '測試地點',
                            status: 'DRAFT'
                        })
                    });
                    const newWorkOrderResult = await newWorkOrderResponse.json();
                    
                    console.log('📋 新施工單創建結果:', JSON.stringify(newWorkOrderResult, null, 2));
                    
                    if (newWorkOrderResult.success) {
                        const newOrderId = newWorkOrderResult.data.id;
                        console.log(`✅ 新 DRAFT 施工單創建成功: ${newOrderId}`);
                        
                        // 再次測試提交
                        const submitResponse = await fetch(`${API_BASE}/approvals/${newOrderId}/submit`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'session-id': sessionId
                            }
                        });
                        const submitResult = await submitResponse.json();
                        
                        console.log('\n📋 重新提交結果:', JSON.stringify(submitResult, null, 2));
                    }
                }
            }
        } else {
            console.log('❌ 施工單清單載入失敗:', workOrdersResult.message);
        }
        
    } catch (error) {
        console.error('❌ 調試過程中發生錯誤:', error.message);
        console.error('📋 錯誤堆棧:', error.stack);
    }
}

// 執行調試
debugSubmitIssue();