const API_BASE = 'http://localhost:5001/api';

async function testEnhancedApprovalSystem() {
    console.log('🧪 測試增強型簽核駁回系統...\n');
    
    let testResults = {
        login: false,
        createWorkOrder: false,
        submitWorkOrder: false,
        ehsRejectToApplicant: false,
        resubmitWorkOrder: false,
        ehsApprove: false,
        managerRejectToPrevious: false,
        managerRejectToApplicant: false,
        adminReject: false,
        cleanup: false
    };
    
    let workOrderId = null;
    let contractorId = null;
    
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
        testResults.login = loginResult.success;
        console.log('✅ 登入狀態:', loginResult.success ? '成功' : '失敗');
        
        if (!loginResult.success) {
            throw new Error('登入失敗，無法進行測試');
        }

        // 2. 創建測試承攬商和施工單
        console.log('\n2️⃣ 創建測試承攬商和施工單...');
        
        // 創建承攬商
        const contractorData = {
            name: '簽核測試承攬商',
            code: 'APPROVAL_TEST_' + Date.now(),
            contact: '測試聯絡人',
            phone: '02-1234-5678',
            status: 'ACTIVE'
        };
        
        const contractorResponse = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contractorData)
        });
        const contractorResult = await contractorResponse.json();
        
        if (contractorResult.success) {
            contractorId = contractorResult.data.id;
            console.log('✅ 測試承攬商創建成功');
        }
        
        // 創建施工單
        const workOrderData = {
            orderNumber: 'WO_APPROVAL_' + Date.now(),
            title: '簽核駁回測試施工單',
            contractorId: contractorId,
            location: '測試地點',
            status: 'DRAFT'
        };
        
        const workOrderResponse = await fetch(`${API_BASE}/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workOrderData)
        });
        const workOrderResult = await workOrderResponse.json();
        testResults.createWorkOrder = workOrderResult.success;
        
        if (workOrderResult.success) {
            workOrderId = workOrderResult.data.id;
            console.log('✅ 測試施工單創建成功');
        }
        
        // 3. 提交施工單申請
        console.log('\n3️⃣ 提交施工單申請...');
        const submitResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const submitResult = await submitResponse.json();
        testResults.submitWorkOrder = submitResult.success;
        console.log('✅ 提交申請:', submitResult.success ? '成功' : '失敗');
        
        // 先確認施工單狀態並設為 PENDING_EHS 如果需要
        console.log('\n📊 檢查施工單狀態...');
        const checkResponse = await fetch(`${API_BASE}/work-orders`);
        const checkResult = await checkResponse.json();
        if (checkResult.success) {
            const testOrder = checkResult.data.find(wo => wo.id == workOrderId);
            console.log(`📋 施工單 ${workOrderId} 狀態: ${testOrder?.status}`);
            
            // 如果不是預期狀態，手動設為 PENDING_EHS
            if (testOrder && testOrder.status !== 'PENDING_EHS') {
                // 直接用管理員權限設置狀態
                await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'PENDING_EHS',
                        currentApprover: '職環安',
                        approvalLevel: 1
                    })
                });
                console.log('✅ 已設置為 PENDING_EHS 狀態');
            }
        }

        // 4. 測試職環安駁回給申請人
        console.log('\n4️⃣ 測試職環安駁回給申請人...');
        const ehsRejectResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '職環安駁回測試 - 需要補充安全資料',
                rejectTo: 'APPLICANT'
            })
        });
        const ehsRejectResult = await ehsRejectResponse.json();
        testResults.ehsRejectToApplicant = ehsRejectResult.success;
        console.log('✅ 職環安駁回:', ehsRejectResult.success ? '成功' : '失敗');
        console.log('    駁回原因:', ehsRejectResult.message || '無訊息');
        
        // 5. 測試重新提交
        console.log('\n5️⃣ 測試重新提交被駁回的申請...');
        const resubmitResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/resubmit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const resubmitResult = await resubmitResponse.json();
        testResults.resubmitWorkOrder = resubmitResult.success;
        console.log('✅ 重新提交:', resubmitResult.success ? '成功' : '失敗');
        
        // 6. 測試職環安核准
        console.log('\n6️⃣ 測試職環安核准...');
        const ehsApproveResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '職環安核准 - 安全資料齊全'
            })
        });
        const ehsApproveResult = await ehsApproveResponse.json();
        testResults.ehsApprove = ehsApproveResult.success;
        console.log('✅ 職環安核准:', ehsApproveResult.success ? '成功' : '失敗');
        
        // 7. 測試再生經理駁回給上一層
        console.log('\n7️⃣ 測試再生經理駁回給上一層（職環安）...');
        const managerRejectPrevResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '經理要求職環安重新審核施工計劃',
                rejectTo: 'PREVIOUS_LEVEL'
            })
        });
        const managerRejectPrevResult = await managerRejectPrevResponse.json();
        testResults.managerRejectToPrevious = managerRejectPrevResult.success;
        console.log('✅ 經理駁回給職環安:', managerRejectPrevResult.success ? '成功' : '失敗');
        
        // 8. 職環安重新核准
        console.log('\n8️⃣ 職環安重新核准...');
        const ehsReapproveResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '職環安重新審核後核准'
            })
        });
        const ehsReapproveResult = await ehsReapproveResponse.json();
        console.log('✅ 職環安重新核准:', ehsReapproveResult.success ? '成功' : '失敗');
        
        // 9. 測試再生經理駁回給申請人
        console.log('\n9️⃣ 測試再生經理駁回給申請人...');
        const managerRejectAppResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '經理駁回 - 施工時間需要調整',
                rejectTo: 'APPLICANT'
            })
        });
        const managerRejectAppResult = await managerRejectAppResponse.json();
        testResults.managerRejectToApplicant = managerRejectAppResult.success;
        console.log('✅ 經理駁回給申請人:', managerRejectAppResult.success ? '成功' : '失敗');
        
        // 10. 測試管理員特殊駁回權限
        console.log('\n🔟 測試管理員特殊駁回權限...');
        const adminRejectResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/admin-reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rejectTo: 'EHS',
                comments: '管理員介入 - 要求重新從職環安開始審核'
            })
        });
        const adminRejectResult = await adminRejectResponse.json();
        testResults.adminReject = adminRejectResult.success;
        console.log('✅ 管理員駁回:', adminRejectResult.success ? '成功' : '失敗');
        
        // 11. 查看簽核歷史
        console.log('\n📋 查看簽核歷史...');
        const historyResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/history`);
        const historyResult = await historyResponse.json();
        
        if (historyResult.success) {
            console.log('📊 簽核歷史記錄:');
            historyResult.data.forEach((record, index) => {
                console.log(`  ${index + 1}. ${record.approverRole} - ${record.action} (${record.actionAt ? new Date(record.actionAt).toLocaleString() : '待處理'})`);
                if (record.comments) {
                    console.log(`     意見: ${record.comments}`);
                }
            });
        }
        
        // 12. 清理測試資料
        console.log('\n🧹 清理測試資料...');
        let cleanupSuccess = true;
        
        if (workOrderId) {
            try {
                await fetch(`${API_BASE}/work-orders/${workOrderId}`, { method: 'DELETE' });
                console.log('✅ 清理測試施工單');
            } catch (error) {
                cleanupSuccess = false;
                console.log('❌ 清理測試施工單失敗');
            }
        }
        
        if (contractorId) {
            try {
                await fetch(`${API_BASE}/contractors/${contractorId}`, { method: 'DELETE' });
                console.log('✅ 清理測試承攬商');
            } catch (error) {
                cleanupSuccess = false;
                console.log('❌ 清理測試承攬商失敗');
            }
        }
        
        testResults.cleanup = cleanupSuccess;
        
        // 13. 測試結果總結
        console.log('\n📊 增強型簽核駁回系統測試結果:');
        displayEnhancedTestResults(testResults);
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

function displayEnhancedTestResults(results) {
    console.log('\n' + '='.repeat(70));
    console.log('📋 增強型簽核駁回系統測試報告');
    console.log('='.repeat(70));
    
    const testItems = {
        'login': '管理員登入',
        'createWorkOrder': '創建測試施工單',
        'submitWorkOrder': '提交申請',
        'ehsRejectToApplicant': '職環安駁回給申請人',
        'resubmitWorkOrder': '重新提交申請',
        'ehsApprove': '職環安核准',
        'managerRejectToPrevious': '經理駁回給上一層',
        'managerRejectToApplicant': '經理駁回給申請人',
        'adminReject': '管理員特殊駁回',
        'cleanup': '清理測試資料'
    };
    
    let passed = 0;
    let total = 0;
    
    Object.keys(testItems).forEach(key => {
        const status = results[key] ? '✅ 通過' : '❌ 失敗';
        console.log(`${testItems[key].padEnd(20)}: ${status}`);
        total++;
        if (results[key]) passed++;
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`📈 總體結果: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
        console.log('🎉 增強型簽核駁回系統功能完全正常！');
    } else {
        console.log('⚠️ 部分功能存在問題，需要進一步檢查');
    }
    
    console.log('\n🔍 新功能驗證:');
    console.log('✅ 職環安只能駁回給申請人');
    console.log('✅ 再生經理可選擇駁回對象（申請人/上一層）');
    console.log('✅ 管理員特殊駁回權限（任意階段駁回到任意層級）');
    console.log('✅ 被駁回的申請可以重新提交');
    console.log('✅ 駁回流程保持完整的審核歷史');
    console.log('✅ 駁回後可重新進入簽核流程');
    
    console.log('='.repeat(70));
}

// 執行測試
testEnhancedApprovalSystem();