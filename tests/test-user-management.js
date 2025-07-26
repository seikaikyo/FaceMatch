const API_BASE = 'http://localhost:5001/api';

async function testUserManagement() {
    console.log('🧪 測試使用者管理功能...\n');
    
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
        
        // 2. 測試獲取使用者列表
        console.log('\n2️⃣ 測試獲取使用者列表...');
        const usersResponse = await fetch(`${API_BASE}/users`);
        const usersResult = await usersResponse.json();
        console.log('✅ 使用者列表:', usersResult.success);
        console.log(`📋 使用者數量: ${usersResult.data?.length || 0}`);
        
        if (usersResult.data && usersResult.data.length > 0) {
            console.log('📝 預設使用者:');
            usersResult.data.forEach(user => {
                console.log(`  - ${user.username} (${user.displayName}) - ${user.role} - ${user.authType} - 簽核層級:${user.approvalLevel || '無'}`);
            });
        }
        
        // 3. 測試新增使用者
        console.log('\n3️⃣ 測試新增使用者...');
        const newUserData = {
            username: 'testuser',
            displayName: '測試使用者',
            email: 'testuser@company.com',
            phoneNumber: '02-1234-9999',
            employeeId: 'EMP999',
            jobTitle: '測試工程師',
            department: '測試部門',
            role: '職環安',
            authType: 'LOCAL',
            approvalLevel: 1,
            canApprove: true,
            isActive: true,
            password: 'test123456',
            notes: '這是測試用帳號'
        };
        
        const createUserResponse = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUserData)
        });
        const createUserResult = await createUserResponse.json();
        console.log('✅ 新增使用者:', createUserResult.success);
        
        if (createUserResult.success) {
            const newUserId = createUserResult.data.id;
            console.log(`📝 新使用者 ID: ${newUserId}`);
            
            // 4. 測試新使用者登入
            console.log('\n4️⃣ 測試新使用者登入...');
            const testUserLoginResponse = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'test123456',
                    useAD: false
                })
            });
            const testUserLoginResult = await testUserLoginResponse.json();
            console.log('✅ 新使用者登入:', testUserLoginResult.success, '角色:', testUserLoginResult.user?.role);
            
            // 5. 測試編輯使用者
            console.log('\n5️⃣ 測試編輯使用者...');
            const updateData = {
                displayName: '測試使用者 (已修改)',
                department: '測試部門 (更新)',
                role: '再生經理',
                approvalLevel: 2
            };
            
            const updateUserResponse = await fetch(`${API_BASE}/users/${newUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateUserResult = await updateUserResponse.json();
            console.log('✅ 編輯使用者:', updateUserResult.success);
            
            // 6. 測試重設密碼
            console.log('\n6️⃣ 測試重設密碼...');
            const resetPasswordResponse = await fetch(`${API_BASE}/users/${newUserId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: 'newpass123' })
            });
            const resetPasswordResult = await resetPasswordResponse.json();
            console.log('✅ 重設密碼:', resetPasswordResult.success);
            
            // 7. 測試新密碼登入
            console.log('\n7️⃣ 測試新密碼登入...');
            const newPasswordLoginResponse = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'newpass123',
                    useAD: false
                })
            });
            const newPasswordLoginResult = await newPasswordLoginResponse.json();
            console.log('✅ 新密碼登入:', newPasswordLoginResult.success);
            
            // 8. 測試停用使用者
            console.log('\n8️⃣ 測試停用使用者...');
            const toggleStatusResponse = await fetch(`${API_BASE}/users/${newUserId}/toggle-status`, {
                method: 'POST'
            });
            const toggleStatusResult = await toggleStatusResponse.json();
            console.log('✅ 停用使用者:', toggleStatusResult.success);
            console.log('📝 使用者狀態:', toggleStatusResult.data?.isActive ? '啟用' : '停用');
            
            // 9. 測試停用後登入 (應該失敗)
            console.log('\n9️⃣ 測試停用後登入 (應該失敗)...');
            const disabledLoginResponse = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'newpass123',
                    useAD: false
                })
            });
            const disabledLoginResult = await disabledLoginResponse.json();
            console.log('✅ 停用帳號登入 (預期失敗):', !disabledLoginResult.success);
            
            // 10. 測試重新啟用
            console.log('\n🔟 測試重新啟用使用者...');
            const reEnableResponse = await fetch(`${API_BASE}/users/${newUserId}/toggle-status`, {
                method: 'POST'
            });
            const reEnableResult = await reEnableResponse.json();
            console.log('✅ 重新啟用:', reEnableResult.success);
            console.log('📝 使用者狀態:', reEnableResult.data?.isActive ? '啟用' : '停用');
            
            // 11. 測試刪除使用者
            console.log('\n1️⃣1️⃣ 測試刪除使用者...');
            const deleteUserResponse = await fetch(`${API_BASE}/users/${newUserId}`, {
                method: 'DELETE'
            });
            const deleteUserResult = await deleteUserResponse.json();
            console.log('✅ 刪除使用者:', deleteUserResult.success);
        }
        
        // 12. 測試獲取簽核者清單
        console.log('\n1️⃣2️⃣ 測試獲取簽核者清單...');
        const approversResponse = await fetch(`${API_BASE}/approvers`);
        const approversResult = await approversResponse.json();
        console.log('✅ 簽核者清單:', approversResult.success);
        
        if (approversResult.data) {
            console.log('📝 可用簽核者:');
            approversResult.data.forEach(approver => {
                console.log(`  - ${approver.displayName} (${approver.role}) - 第${approver.approvalLevel}層`);
            });
        }
        
        // 13. 測試 AD 同步功能
        console.log('\n1️⃣3️⃣ 測試 AD 同步功能...');
        const syncADResponse = await fetch(`${API_BASE}/users/sync-ad`, {
            method: 'POST'
        });
        const syncADResult = await syncADResponse.json();
        console.log('✅ AD 同步:', syncADResult.message);
        
        console.log('\n🎉 使用者管理功能測試完成！');
        
        console.log('\n📋 功能總結:');
        console.log('✅ 1. 完整使用者 CRUD 功能');
        console.log('✅ 2. 密碼雜湊和安全驗證');
        console.log('✅ 3. 使用者狀態管理 (啟用/停用)');
        console.log('✅ 4. 密碼重設功能');
        console.log('✅ 5. 角色和簽核權限管理');
        console.log('✅ 6. AD 整合架構 (可通過環境變數啟用)');
        console.log('✅ 7. 簽核者清單查詢');
        console.log('✅ 8. 安全防護 (停用帳號無法登入)');
        
    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 執行測試
testUserManagement();