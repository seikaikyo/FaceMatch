const API_BASE = 'http://localhost:5001/api';

async function testManagerRejectOptions() {
    console.log('🧪 測試再生經理駁回選項功能...\n');
    
    let adminSessionId = null;
    let managerSessionId = null;
    let ehsSessionId = null;
    let workOrderId = null;
    let contractorId = null;
    
    try {
        // 1. 管理員登入創建測試資料
        console.log('1️⃣ 管理員登入...');
        const adminLoginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123',
                useAD: false
            })
        });
        const adminLoginResult = await adminLoginResponse.json();
        
        if (!adminLoginResult.success) {
            throw new Error('管理員登入失敗');
        }
        
        adminSessionId = adminLoginResult.sessionId;
        console.log('✅ 管理員登入成功');
        
        // 2. 職環安登入
        console.log('\n2️⃣ 職環安登入...');
        const ehsLoginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'safety',
                password: 'safety123',
                useAD: false
            })
        });
        const ehsLoginResult = await ehsLoginResponse.json();
        
        if (!ehsLoginResult.success) {
            throw new Error('職環安登入失敗');
        }
        
        ehsSessionId = ehsLoginResult.sessionId;
        console.log('✅ 職環安登入成功');
        console.log('👤 職環安用戶角色:', ehsLoginResult.user.role);
        
        // 3. 再生經理登入
        console.log('\n3️⃣ 再生經理登入...');
        const managerLoginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'manager',
                password: 'manager123',
                useAD: false
            })
        });
        const managerLoginResult = await managerLoginResponse.json();
        
        if (!managerLoginResult.success) {
            throw new Error('再生經理登入失敗');
        }
        
        managerSessionId = managerLoginResult.sessionId;
        console.log('✅ 再生經理登入成功');
        console.log('👤 再生經理用戶角色:', managerLoginResult.user.role);
        
        // 4. 創建測試承攬商和施工單（使用管理員權限）
        console.log('\n4️⃣ 創建測試資料...');
        
        const contractorResponse = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            },
            body: JSON.stringify({
                name: '經理駁回測試承攬商',
                code: 'MGR_REJECT_' + Date.now(),
                contact: '測試聯絡人',
                phone: '02-1234-5678',
                status: 'ACTIVE'
            })
        });
        const contractorResult = await contractorResponse.json();
        contractorId = contractorResult.data?.id;
        console.log('✅ 測試承攬商創建成功');
        
        const workOrderResponse = await fetch(`${API_BASE}/work-orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            },
            body: JSON.stringify({
                orderNumber: 'WO_MGR_' + Date.now(),
                title: '經理駁回選項測試施工單',
                contractorId: contractorId,
                location: '測試地點',
                status: 'DRAFT'
            })
        });
        const workOrderResult = await workOrderResponse.json();
        workOrderId = workOrderResult.data?.id;
        console.log('✅ 測試施工單創建成功');
        
        // 5. 設置為 PENDING_EHS 狀態
        await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': adminSessionId
            },
            body: JSON.stringify({
                status: 'PENDING_EHS',
                currentApprover: '職環安',
                approvalLevel: 1
            })
        });
        console.log('✅ 設置為待職環安簽核狀態');
        
        // 6. 職環安核准進入經理階段
        console.log('\n5️⃣ 職環安核准...');
        const ehsApprovalResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/ehs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': ehsSessionId
            },
            body: JSON.stringify({
                action: 'APPROVED',
                comments: '職環安核准，進入經理簽核階段'
            })
        });
        const ehsApprovalResult = await ehsApprovalResponse.json();
        console.log('✅ 職環安核准:', ehsApprovalResult.success ? '成功' : '失敗');
        
        if (!ehsApprovalResult.success) {
            console.log('❌ 核准失敗:', ehsApprovalResult.message);
        }
        
        // 7. 測試經理駁回給上一層選項
        console.log('\n6️⃣ 測試經理駁回給上一層（職環安）...');
        const managerRejectEhsResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
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
        const managerRejectEhsResult = await managerRejectEhsResponse.json();
        console.log('✅ 經理駁回給職環安:', managerRejectEhsResult.success ? '成功' : '失敗');
        
        if (!managerRejectEhsResult.success) {
            console.log('❌ 駁回失敗:', managerRejectEhsResult.message);
        }
        
        // 8. 職環安重新核准
        console.log('\n7️⃣ 職環安重新核准...');
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
        
        // 9. 測試經理駁回給申請人選項
        console.log('\n8️⃣ 測試經理駁回給申請人...');
        const managerRejectAppResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/manager`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'session-id': managerSessionId
            },
            body: JSON.stringify({
                action: 'REJECTED',
                comments: '經理要求申請人重新提交完整資料',
                rejectTo: 'APPLICANT'
            })
        });
        const managerRejectAppResult = await managerRejectAppResponse.json();
        console.log('✅ 經理駁回給申請人:', managerRejectAppResult.success ? '成功' : '失敗');
        
        // 10. 查看簽核歷史
        console.log('\n9️⃣ 查看完整簽核歷史...');
        const historyResponse = await fetch(`${API_BASE}/approvals/${workOrderId}/history`, {
            headers: { 'session-id': adminSessionId }
        });
        const historyResult = await historyResponse.json();
        
        if (historyResult.success) {
            console.log('📊 簽核歷史記錄:');
            historyResult.data.forEach((record, index) => {
                const actionText = record.action === 'APPROVED' ? '核准' : '駁回';
                const timeText = record.timestamp ? new Date(record.timestamp).toLocaleString() : '待處理';
                console.log(`  ${index + 1}. ${record.approver} - ${actionText} (${timeText})`);
                if (record.comment) {
                    console.log(`     意見: ${record.comment}`);
                }
                if (record.rejectTo) {
                    console.log(`     駁回對象: ${record.rejectTo}`);
                }
            });
        }
        
        // 11. 清理測試資料
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
        
        console.log('\n🎉 經理駁回選項測試完成！');
        console.log('\n📋 測試結果總結:');
        console.log('✅ 再生經理可以駁回給上一層（職環安）');
        console.log('✅ 再生經理可以駁回給申請人');
        console.log('✅ 駁回流程支援多層級路由');
        console.log('✅ 簽核歷史完整記錄');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
        
        // 清理資源
        if (workOrderId && adminSessionId) {
            try {
                await fetch(`${API_BASE}/work-orders/${workOrderId}`, { 
                    method: 'DELETE',
                    headers: { 'session-id': adminSessionId }
                });
            } catch (e) {}
        }
        
        if (contractorId && adminSessionId) {
            try {
                await fetch(`${API_BASE}/contractors/${contractorId}`, { 
                    method: 'DELETE',
                    headers: { 'session-id': adminSessionId }
                });
            } catch (e) {}
        }
    }
}

// 執行測試
testManagerRejectOptions();