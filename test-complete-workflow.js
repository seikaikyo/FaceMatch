const API_BASE = 'http://localhost:5001/api';

async function testCompleteWorkflow() {
    console.log('🧪 完整簽核流程測試...\n');
    
    let adminSessionId = null;
    let ehsSessionId = null;
    let managerSessionId = null;
    let workOrderId = null;
    let contractorId = null;
    
    try {
        // 1. 測試所有用戶登入
        console.log('1️⃣ 測試用戶登入...');
        
        // 管理員登入
        const adminLogin = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                useAD: false
            })
        });
        const adminResult = await adminLogin.json();
        console.log('✅ 管理員登入:', adminResult.success ? '成功' : '失敗');
        
        if (!adminResult.success) {
            console.log('❌ 管理員登入失敗:', adminResult.message);
            return;
        }
        adminSessionId = adminResult.sessionId;
        
        // 職環安登入
        const ehsLogin = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'safety',
                password: 'safety123',
                useAD: false
            })
        });
        const ehsResult = await ehsLogin.json();
        console.log('✅ 職環安登入:', ehsResult.success ? '成功' : '失敗');
        ehsSessionId = ehsResult.sessionId;
        
        // 再生經理登入
        const managerLogin = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'manager',
                password: 'manager123',
                useAD: false
            })
        });
        const managerResult = await managerLogin.json();
        console.log('✅ 再生經理登入:', managerResult.success ? '成功' : '失敗');
        managerSessionId = managerResult.sessionId;
        
        // 2. 創建測試資料
        console.log('\n2️⃣ 創建測試資料...');
        
        // 創建承攬商
        const contractorResponse = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            },
            body: JSON.stringify({
                name: '完整流程測試承攬商',
                code: 'WORKFLOW_TEST_' + Date.now(),
                contact: '測試聯絡人',
                phone: '02-1234-5678',
                status: 'ACTIVE'
            })
        });
        const contractorResult = await contractorResponse.json();
        contractorId = contractorResult.data?.id;
        console.log('✅ 承攬商創建:', contractorResult.success ? '成功' : '失敗');
        
        // 創建施工單
        const workOrderResponse = await fetch(`${API_BASE}/work-orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            },
            body: JSON.stringify({
                orderNumber: 'WO_WORKFLOW_' + Date.now(),
                title: '完整流程測試施工單',
                contractorId: contractorId,
                location: '測試地點',
                status: 'DRAFT'
            })
        });
        const workOrderResult = await workOrderResponse.json();
        workOrderId = workOrderResult.data?.id;
        console.log('✅ 施工單創建:', workOrderResult.success ? '成功' : '失敗');
        
        // 3. 提交申請
        console.log('\n3️⃣ 提交施工單申請...');
        const submitResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            }
        });
        const submitResult = await submitResponse.json();
        console.log('✅ 提交申請:', submitResult.success ? '成功' : '失敗');
        
        // 4. 職環安簽核測試
        console.log('\n4️⃣ 職環安簽核測試...');
        
        // 職環安核准
        const ehsApprovalResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': ehsSessionId
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '職環安核准 - 安全資料齊全'
            })
        });
        const ehsApprovalResult = await ehsApprovalResponse.json();
        console.log('✅ 職環安核准:', ehsApprovalResult.success ? '成功' : '失敗');
        
        if (!ehsApprovalResult.success) {
            console.log('❌ 職環安核准失敗:', ehsApprovalResult.message);
        }
        
        // 5. 再生經理駁回測試（選擇駁回給上一層）
        console.log('\n5️⃣ 再生經理駁回測試...');
        
        const managerRejectResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': managerSessionId
            },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '經理要求職環安重新審核安全措施',
                rejectTo: 'PREVIOUS_LEVEL'
            })
        });
        const managerRejectResult = await managerRejectResponse.json();
        console.log('✅ 經理駁回給職環安:', managerRejectResult.success ? '成功' : '失敗');
        
        if (!managerRejectResult.success) {
            console.log('❌ 經理駁回失敗:', managerRejectResult.message);
            console.log('📋 錯誤詳情:', JSON.stringify(managerRejectResult, null, 2));
        }
        
        // 6. 職環安重新核准
        console.log('\n6️⃣ 職環安重新核准...');
        
        const ehsReapprovalResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': ehsSessionId
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '職環安重新審核後核准'
            })
        });
        const ehsReapprovalResult = await ehsReapprovalResponse.json();
        console.log('✅ 職環安重新核准:', ehsReapprovalResult.success ? '成功' : '失敗');
        
        // 7. 再生經理最終核准
        console.log('\n7️⃣ 再生經理最終核准...');
        
        const managerApprovalResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': managerSessionId
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '經理最終核准'
            })
        });
        const managerApprovalResult = await managerApprovalResponse.json();
        console.log('✅ 經理最終核准:', managerApprovalResult.success ? '成功' : '失敗');
        
        // 8. 查看最終狀態
        console.log('\n8️⃣ 查看最終狀態...');
        
        const finalStatusResponse = await fetch(`${API_BASE}/work-orders`, {
            headers: { 'session-id': adminSessionId }
        });
        const finalStatusResult = await finalStatusResponse.json();
        
        if (finalStatusResult.success) {
            const testOrder = finalStatusResult.data.find(wo => wo.id == workOrderId);
            console.log('📋 最終施工單狀態:', testOrder?.status);
            console.log('📋 目前簽核者:', testOrder?.currentApprover);
            console.log('📋 簽核層級:', testOrder?.approvalLevel);
        }
        
        // 9. 查看簽核歷史
        console.log('\n9️⃣ 查看簽核歷史...');
        
        const historyResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/history`, {
            headers: { 'session-id': adminSessionId }
        });
        const historyResult = await historyResponse.json();
        
        if (historyResult.success) {
            console.log('📊 完整簽核歷史:');
            historyResult.data.forEach((record, index) => {
                const actionText = record.action === 'APPROVED' ? '核准' : '駁回';
                const timeText = record.timestamp ? new Date(record.timestamp).toLocaleString() : '待處理';
                console.log(`  ${index + 1}. ${record.approver} - ${actionText} (${timeText})`);
                if (record.comment) {
                    console.log(`     意見: ${record.comment}`);
                }
            });
        }
        
        // 10. 清理測試資料
        console.log('\n🧹 清理測試資料...');
        
        if (workOrderId) {
            await fetch(`${API_BASE}/work-orders/${workOrderId}`, { 
                method: 'DELETE',
                headers: { 'session-id': adminSessionId }
            });
            console.log('✅ 清理測試施工單');
        }
        
        if (contractorId) {
            await fetch(`${API_BASE}/contractors/${contractorId}`, { 
                method: 'DELETE',
                headers: { 'session-id': adminSessionId }
            });
            console.log('✅ 清理測試承攬商');
        }
        
        console.log('\n🎉 完整流程測試完成！');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        console.error('📋 錯誤堆棧:', error.stack);
    }
}

// 執行測試
testCompleteWorkflow();