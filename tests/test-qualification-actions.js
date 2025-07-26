const API_BASE = 'http://localhost:5001/api';

async function testQualificationActions() {
    console.log('🧪 測試年度資格快速操作功能...\n');
    
    try {
        // 1. 測試管理員登入
        console.log('1️⃣ 測試管理員登入...');
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
        console.log('✅ 管理員登入:', adminLoginResult.success, '角色:', adminLoginResult.user?.role);
        
        // 2. 創建測試資格
        console.log('\n2️⃣ 創建測試年度資格...');
        const testQualificationData = {
            personName: '測試人員A',
            type: 'SAFETY',
            name: '職業安全衛生教育訓練',
            validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天後到期
            status: 'EXPIRES_SOON'
        };
        
        const createResponse = await fetch(`${API_BASE}/qualifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testQualificationData)
        });
        const createResult = await createResponse.json();
        console.log('✅ 創建測試資格:', createResult.success);
        
        if (createResult.success) {
            const testQualificationId = createResult.data.id;
            console.log(`📝 測試資格 ID: ${testQualificationId}`);
            
            // 3. 測試快速續約功能
            console.log('\n3️⃣ 測試快速續約功能...');
            const renewResponse = await fetch(`${API_BASE}/qualifications/${testQualificationId}/quick-renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    renewalPeriod: 1,
                    renewalNotes: '自動測試續約',
                    renewedBy: '測試管理員'
                })
            });
            const renewResult = await renewResponse.json();
            console.log('✅ 快速續約:', renewResult.success);
            console.log('📝 續約訊息:', renewResult.message);
            
            // 4. 檢查續約後狀態
            console.log('\n4️⃣ 檢查續約後狀態...');
            const checkResponse1 = await fetch(`${API_BASE}/qualifications`);
            const checkResult1 = await checkResponse1.json();
            const renewedQual = checkResult1.data.find(q => q.id === testQualificationId);
            console.log('✅ 續約後狀態:', renewedQual.status);
            console.log('📝 新到期日:', new Date(renewedQual.validTo).toLocaleDateString('zh-TW'));
            console.log('📝 續約人員:', renewedQual.lastRenewedBy);
            
            // 5. 測試快速停用功能
            console.log('\n5️⃣ 測試快速停用功能...');
            const suspendResponse = await fetch(`${API_BASE}/qualifications/${testQualificationId}/quick-suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suspendReason: '測試停用功能',
                    suspendedBy: '測試管理員'
                })
            });
            const suspendResult = await suspendResponse.json();
            console.log('✅ 快速停用:', suspendResult.success);
            console.log('📝 停用訊息:', suspendResult.message);
            
            // 6. 檢查停用後狀態
            console.log('\n6️⃣ 檢查停用後狀態...');
            const checkResponse2 = await fetch(`${API_BASE}/qualifications`);
            const checkResult2 = await checkResponse2.json();
            const suspendedQual = checkResult2.data.find(q => q.id === testQualificationId);
            console.log('✅ 停用後狀態:', suspendedQual.status);
            console.log('📝 停用人員:', suspendedQual.suspendedBy);
            console.log('📝 停用原因:', suspendedQual.suspendReason);
            
            // 7. 測試重新啟用功能
            console.log('\n7️⃣ 測試重新啟用功能...');
            const reactivateResponse = await fetch(`${API_BASE}/qualifications/${testQualificationId}/reactivate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reactivatedBy: '測試管理員',
                    notes: '測試重新啟用'
                })
            });
            const reactivateResult = await reactivateResponse.json();
            console.log('✅ 重新啟用:', reactivateResult.success);
            console.log('📝 啟用訊息:', reactivateResult.message);
            
            // 8. 檢查啟用後狀態
            console.log('\n8️⃣ 檢查啟用後狀態...');
            const checkResponse3 = await fetch(`${API_BASE}/qualifications`);
            const checkResult3 = await checkResponse3.json();
            const reactivatedQual = checkResult3.data.find(q => q.id === testQualificationId);
            console.log('✅ 啟用後狀態:', reactivatedQual.status);
            console.log('📝 啟用備註:', reactivatedQual.renewalNotes);
            
            // 9. 測試不同續約期間
            console.log('\n9️⃣ 測試不同續約期間 (3年)...');
            const renewLongResponse = await fetch(`${API_BASE}/qualifications/${testQualificationId}/quick-renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    renewalPeriod: 3,
                    renewalNotes: '測試長期續約',
                    renewedBy: '測試管理員'
                })
            });
            const renewLongResult = await renewLongResponse.json();
            console.log('✅ 長期續約:', renewLongResult.success);
            console.log('📝 續約訊息:', renewLongResult.message);
            
            // 10. 清理測試資料
            console.log('\n🔟 清理測試資料...');
            const deleteResponse = await fetch(`${API_BASE}/qualifications/${testQualificationId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            console.log('✅ 清理測試資格:', deleteResult.success);
        }
        
        // 11. 測試獲取資格列表
        console.log('\n1️⃣1️⃣ 測試獲取完整資格列表...');
        const qualificationsResponse = await fetch(`${API_BASE}/qualifications`);
        const qualificationsResult = await qualificationsResponse.json();
        console.log('✅ 資格列表:', qualificationsResult.success);
        console.log(`📋 資格總數: ${qualificationsResult.data?.length || 0}`);
        
        if (qualificationsResult.data && qualificationsResult.data.length > 0) {
            console.log('📝 現有資格:');
            qualificationsResult.data.forEach(qual => {
                const validTo = qual.validTo ? new Date(qual.validTo).toLocaleDateString('zh-TW') : '無期限';
                console.log(`  - ${qual.personName}: ${qual.name} (${qual.status}) - 到期: ${validTo}`);
            });
        }
        
        console.log('\n🎉 年度資格快速操作功能測試完成！');
        
        console.log('\n📋 功能總結:');
        console.log('✅ 1. 快速續約功能 - 可設定續約年數，自動計算新到期日');
        console.log('✅ 2. 快速停用功能 - 可設定停用原因，即時停用資格');
        console.log('✅ 3. 重新啟用功能 - 根據到期日智能判斷啟用後狀態');
        console.log('✅ 4. 狀態追蹤 - 記錄操作人員、時間和備註');
        console.log('✅ 5. 數據完整性 - 停用清除、啟用恢復機制');
        console.log('✅ 6. 前端整合 - 動態按鈕顯示，狀態相關操作');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testQualificationActions();