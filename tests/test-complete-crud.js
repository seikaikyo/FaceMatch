const API_BASE = 'http://localhost:5001/api';

async function testCompleteCRUD() {
    console.log('🧪 完整 CRUD 功能測試開始...\n');
    
    let testResults = {
        contractors: { create: false, read: false, update: false, delete: false },
        workorders: { create: false, read: false, update: false, delete: false },
        qualifications: { create: false, read: false, update: false, delete: false },
        users: { create: false, read: false, update: false, delete: false },
        facematch: { create: false, read: false, update: false, delete: false }
    };

    try {
        // 1. 管理員登入
        console.log('🔐 管理員登入...');
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
        console.log('✅ 登入狀態:', loginResult.success ? '成功' : '失敗');

        if (!loginResult.success) {
            throw new Error('登入失敗，無法進行 CRUD 測試');
        }

        // 2. 測試承攬商 CRUD
        console.log('\n📋 測試承攬商 CRUD...');
        await testContractorsCRUD(testResults);

        // 3. 測試施工單 CRUD
        console.log('\n🏗️ 測試施工單 CRUD...');
        await testWorkOrdersCRUD(testResults);

        // 4. 測試年度資格 CRUD
        console.log('\n🎓 測試年度資格 CRUD...');
        await testQualificationsCRUD(testResults);

        // 5. 測試使用者 CRUD
        console.log('\n👥 測試使用者 CRUD...');
        await testUsersCRUD(testResults);

        // 6. 測試 FaceMatch 整合 CRUD
        console.log('\n👤 測試 FaceMatch 整合 CRUD...');
        await testFaceMatchCRUD(testResults);

        // 7. 測試特殊功能
        console.log('\n⚡ 測試特殊功能...');
        await testSpecialFeatures();

        // 8. 輸出測試結果
        console.log('\n📊 CRUD 測試結果總結:');
        displayTestResults(testResults);

    } catch (error) {
        console.error('❌ 測試過程中發生錯誤:', error.message);
    }
}

// 承攬商 CRUD 測試
async function testContractorsCRUD(results) {
    let contractorId = null;

    try {
        // CREATE
        console.log('  📝 測試新增承攬商...');
        const createData = {
            name: '測試承攬商公司',
            code: 'TEST_' + Date.now(),
            contact: '測試聯絡人',
            phone: '02-1234-5678',
            status: 'ACTIVE'
        };

        const createResponse = await fetch(`${API_BASE}/contractors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const createResult = await createResponse.json();
        results.contractors.create = createResult.success;
        console.log('    ✅ 新增:', createResult.success ? '成功' : '失敗');
        
        if (createResult.success) {
            contractorId = createResult.data.id;
        }

        // READ
        console.log('  📖 測試查詢承攬商...');
        const readResponse = await fetch(`${API_BASE}/contractors`);
        const readResult = await readResponse.json();
        results.contractors.read = readResult.success && Array.isArray(readResult.data);
        console.log('    ✅ 查詢:', results.contractors.read ? '成功' : '失敗');
        console.log(`    📊 承攬商總數: ${readResult.data?.length || 0}`);

        // UPDATE
        if (contractorId) {
            console.log('  ✏️ 測試更新承攬商...');
            const updateData = {
                name: '測試承攬商公司 (已更新)',
                contact: '更新後聯絡人',
                phone: '02-9876-5432'
            };

            const updateResponse = await fetch(`${API_BASE}/contractors/${contractorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            results.contractors.update = updateResult.success;
            console.log('    ✅ 更新:', updateResult.success ? '成功' : '失敗');
        }

        // DELETE
        if (contractorId) {
            console.log('  🗑️ 測試刪除承攬商...');
            const deleteResponse = await fetch(`${API_BASE}/contractors/${contractorId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            results.contractors.delete = deleteResult.success;
            console.log('    ✅ 刪除:', deleteResult.success ? '成功' : '失敗');
        }

    } catch (error) {
        console.log('    ❌ 承攬商測試錯誤:', error.message);
    }
}

// 施工單 CRUD 測試
async function testWorkOrdersCRUD(results) {
    let workOrderId = null;
    let contractorId = null;

    try {
        // 先創建一個承攬商用於施工單測試
        console.log('  🏢 創建測試承攬商...');
        const contractorData = {
            name: '施工單測試承攬商',
            code: 'WO_TEST_' + Date.now(),
            contact: '施工聯絡人',
            phone: '02-1111-2222',
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
            console.log('    ✅ 測試承攬商創建成功');
        }

        // CREATE
        console.log('  📝 測試新增施工單...');
        const createData = {
            orderNumber: 'WO_' + Date.now(),
            title: '測試施工項目',
            contractorId: contractorId,
            location: '測試施工地點',
            status: 'PENDING'
        };

        const createResponse = await fetch(`${API_BASE}/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const createResult = await createResponse.json();
        results.workorders.create = createResult.success;
        console.log('    ✅ 新增:', createResult.success ? '成功' : '失敗');
        
        if (createResult.success) {
            workOrderId = createResult.data.id;
        }

        // READ
        console.log('  📖 測試查詢施工單...');
        const readResponse = await fetch(`${API_BASE}/work-orders`);
        const readResult = await readResponse.json();
        results.workorders.read = readResult.success && Array.isArray(readResult.data);
        console.log('    ✅ 查詢:', results.workorders.read ? '成功' : '失敗');
        console.log(`    📊 施工單總數: ${readResult.data?.length || 0}`);

        // UPDATE
        if (workOrderId) {
            console.log('  ✏️ 測試更新施工單...');
            const updateData = {
                title: '測試施工項目 (已更新)',
                location: '更新後施工地點'
            };

            const updateResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            results.workorders.update = updateResult.success;
            console.log('    ✅ 更新:', updateResult.success ? '成功' : '失敗');
        }

        // DELETE
        if (workOrderId) {
            console.log('  🗑️ 測試刪除施工單...');
            const deleteResponse = await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            results.workorders.delete = deleteResult.success;
            console.log('    ✅ 刪除:', deleteResult.success ? '成功' : '失敗');
        }

        // 清理測試承攬商
        if (contractorId) {
            await fetch(`${API_BASE}/contractors/${contractorId}`, { method: 'DELETE' });
        }

    } catch (error) {
        console.log('    ❌ 施工單測試錯誤:', error.message);
    }
}

// 年度資格 CRUD 測試
async function testQualificationsCRUD(results) {
    let qualificationId = null;

    try {
        // CREATE
        console.log('  📝 測試新增年度資格...');
        const createData = {
            personName: '測試資格人員',
            type: 'SAFETY',
            name: '測試安全教育訓練',
            validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'VALID'
        };

        const createResponse = await fetch(`${API_BASE}/qualifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const createResult = await createResponse.json();
        results.qualifications.create = createResult.success;
        console.log('    ✅ 新增:', createResult.success ? '成功' : '失敗');
        
        if (createResult.success) {
            qualificationId = createResult.data.id;
        }

        // READ
        console.log('  📖 測試查詢年度資格...');
        const readResponse = await fetch(`${API_BASE}/qualifications`);
        const readResult = await readResponse.json();
        results.qualifications.read = readResult.success && Array.isArray(readResult.data);
        console.log('    ✅ 查詢:', results.qualifications.read ? '成功' : '失敗');
        console.log(`    📊 資格總數: ${readResult.data?.length || 0}`);

        // UPDATE
        if (qualificationId) {
            console.log('  ✏️ 測試更新年度資格...');
            const updateData = {
                name: '測試安全教育訓練 (已更新)',
                status: 'EXPIRES_SOON'
            };

            const updateResponse = await fetch(`${API_BASE}/qualifications/${qualificationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            results.qualifications.update = updateResult.success;
            console.log('    ✅ 更新:', updateResult.success ? '成功' : '失敗');
        }

        // 測試快速操作
        if (qualificationId) {
            console.log('  ⚡ 測試快速續約...');
            const renewResponse = await fetch(`${API_BASE}/qualifications/${qualificationId}/quick-renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    renewalPeriod: 1,
                    renewalNotes: '測試續約',
                    renewedBy: '測試管理員'
                })
            });
            const renewResult = await renewResponse.json();
            console.log('    ✅ 快速續約:', renewResult.success ? '成功' : '失敗');

            console.log('  ⚡ 測試快速停用...');
            const suspendResponse = await fetch(`${API_BASE}/qualifications/${qualificationId}/quick-suspend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suspendReason: '測試停用',
                    suspendedBy: '測試管理員'
                })
            });
            const suspendResult = await suspendResponse.json();
            console.log('    ✅ 快速停用:', suspendResult.success ? '成功' : '失敗');
        }

        // DELETE
        if (qualificationId) {
            console.log('  🗑️ 測試刪除年度資格...');
            const deleteResponse = await fetch(`${API_BASE}/qualifications/${qualificationId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            results.qualifications.delete = deleteResult.success;
            console.log('    ✅ 刪除:', deleteResult.success ? '成功' : '失敗');
        }

    } catch (error) {
        console.log('    ❌ 年度資格測試錯誤:', error.message);
    }
}

// 使用者 CRUD 測試
async function testUsersCRUD(results) {
    let userId = null;

    try {
        // CREATE
        console.log('  📝 測試新增使用者...');
        const createData = {
            username: 'testuser_' + Date.now(),
            displayName: '測試使用者',
            email: 'test@example.com',
            phoneNumber: '02-1234-5678',
            employeeId: 'EMP_TEST',
            jobTitle: '測試工程師',
            department: '測試部門',
            role: '職環安',
            authType: 'LOCAL',
            approvalLevel: 1,
            canApprove: true,
            isActive: true,
            password: 'test123456',
            notes: '測試用帳號'
        };

        const createResponse = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const createResult = await createResponse.json();
        results.users.create = createResult.success;
        console.log('    ✅ 新增:', createResult.success ? '成功' : '失敗');
        
        if (createResult.success) {
            userId = createResult.data.id;
        }

        // READ
        console.log('  📖 測試查詢使用者...');
        const readResponse = await fetch(`${API_BASE}/users`);
        const readResult = await readResponse.json();
        results.users.read = readResult.success && Array.isArray(readResult.data);
        console.log('    ✅ 查詢:', results.users.read ? '成功' : '失敗');
        console.log(`    📊 使用者總數: ${readResult.data?.length || 0}`);

        // UPDATE
        if (userId) {
            console.log('  ✏️ 測試更新使用者...');
            const updateData = {
                displayName: '測試使用者 (已更新)',
                department: '更新後部門',
                role: '再生經理',
                approvalLevel: 2
            };

            const updateResponse = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            results.users.update = updateResult.success;
            console.log('    ✅ 更新:', updateResult.success ? '成功' : '失敗');
        }

        // 測試使用者管理功能
        if (userId) {
            console.log('  ⚡ 測試重設密碼...');
            const resetResponse = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: 'newpass123' })
            });
            const resetResult = await resetResponse.json();
            console.log('    ✅ 重設密碼:', resetResult.success ? '成功' : '失敗');

            console.log('  ⚡ 測試切換狀態...');
            const toggleResponse = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
                method: 'POST'
            });
            const toggleResult = await toggleResponse.json();
            console.log('    ✅ 切換狀態:', toggleResult.success ? '成功' : '失敗');
        }

        // DELETE
        if (userId) {
            console.log('  🗑️ 測試刪除使用者...');
            const deleteResponse = await fetch(`${API_BASE}/users/${userId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            results.users.delete = deleteResult.success;
            console.log('    ✅ 刪除:', deleteResult.success ? '成功' : '失敗');
        }

    } catch (error) {
        console.log('    ❌ 使用者測試錯誤:', error.message);
    }
}

// FaceMatch 整合 CRUD 測試
async function testFaceMatchCRUD(results) {
    let faceMatchId = null;

    try {
        // CREATE
        console.log('  📝 測試新增 FaceMatch 記錄...');
        const createData = {
            personName: '測試人臉辨識人員',
            workOrderId: 1,
            status: 'PENDING'
        };

        const createResponse = await fetch(`${API_BASE}/facematch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createData)
        });
        const createResult = await createResponse.json();
        results.facematch.create = createResult.success;
        console.log('    ✅ 新增:', createResult.success ? '成功' : '失敗');
        
        if (createResult.success) {
            faceMatchId = createResult.data.id;
        }

        // READ
        console.log('  📖 測試查詢 FaceMatch 記錄...');
        const readResponse = await fetch(`${API_BASE}/facematch`);
        const readResult = await readResponse.json();
        results.facematch.read = readResult.success && Array.isArray(readResult.data);
        console.log('    ✅ 查詢:', results.facematch.read ? '成功' : '失敗');
        console.log(`    📊 FaceMatch 記錄總數: ${readResult.data?.length || 0}`);

        // UPDATE
        if (faceMatchId) {
            console.log('  ✏️ 測試更新 FaceMatch 記錄...');
            const updateData = {
                status: 'SUCCESS',
                syncTime: new Date().toISOString()
            };

            const updateResponse = await fetch(`${API_BASE}/facematch/${faceMatchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const updateResult = await updateResponse.json();
            results.facematch.update = updateResult.success;
            console.log('    ✅ 更新:', updateResult.success ? '成功' : '失敗');
        }

        // DELETE
        if (faceMatchId) {
            console.log('  🗑️ 測試刪除 FaceMatch 記錄...');
            const deleteResponse = await fetch(`${API_BASE}/facematch/${faceMatchId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            results.facematch.delete = deleteResult.success;
            console.log('    ✅ 刪除:', deleteResult.success ? '成功' : '失敗');
        }

    } catch (error) {
        console.log('    ❌ FaceMatch 測試錯誤:', error.message);
    }
}

// 測試特殊功能
async function testSpecialFeatures() {
    try {
        // 測試簽核者清單
        console.log('  📋 測試簽核者清單...');
        const approversResponse = await fetch(`${API_BASE}/approvers`);
        const approversResult = await approversResponse.json();
        console.log('    ✅ 簽核者清單:', approversResult.success ? '成功' : '失敗');
        console.log(`    👥 可用簽核者: ${approversResult.data?.length || 0} 人`);

        // 測試待簽核清單
        console.log('  📋 測試待簽核清單...');
        const pendingResponse = await fetch(`${API_BASE}/work-orders/pending-approval`);
        const pendingResult = await pendingResponse.json();
        console.log('    ✅ 待簽核清單:', pendingResult.success ? '成功' : '失敗');
        console.log(`    📄 待簽核項目: ${pendingResult.data?.length || 0} 個`);

        // 測試 AD 配置
        console.log('  🔐 測試 AD 配置...');
        const adConfigResponse = await fetch(`${API_BASE}/ad-config`);
        const adConfigResult = await adConfigResponse.json();
        console.log('    ✅ AD 配置:', adConfigResult ? '成功' : '失敗');
        console.log('    🔧 AD 狀態:', adConfigResult.enabled ? '啟用' : '停用');

        // 測試健康檢查
        console.log('  ❤️ 測試系統健康檢查...');
        const healthResponse = await fetch(`${API_BASE}/../health`);
        const healthResult = await healthResponse.json();
        console.log('    ✅ 健康檢查:', healthResult.status === 'OK' ? '成功' : '失敗');

        // 測試日誌系統
        console.log('  📊 測試日誌系統...');
        const logsResponse = await fetch(`${API_BASE}/logs?limit=5`);
        const logsResult = await logsResponse.json();
        console.log('    ✅ 日誌查詢:', logsResult.success ? '成功' : '失敗');
        console.log(`    📋 日誌記錄: ${logsResult.data?.length || 0} 條`);

    } catch (error) {
        console.log('    ❌ 特殊功能測試錯誤:', error.message);
    }
}

// 顯示測試結果
function displayTestResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRUD 功能測試報告');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;

    Object.keys(results).forEach(module => {
        console.log(`\n🔹 ${getModuleName(module)}:`);
        Object.keys(results[module]).forEach(operation => {
            const passed = results[module][operation];
            const status = passed ? '✅ 通過' : '❌ 失敗';
            console.log(`  ${operation.toUpperCase().padEnd(8)}: ${status}`);
            totalTests++;
            if (passed) passedTests++;
        });
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📈 總體結果: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有 CRUD 功能測試通過！');
    } else {
        console.log('⚠️ 部分功能存在問題，需要進一步檢查');
    }
    console.log('='.repeat(60));
}

function getModuleName(module) {
    const names = {
        contractors: '承攬商管理',
        workorders: '施工單管理',
        qualifications: '年度資格管理',
        users: '使用者管理',
        facematch: 'FaceMatch 整合'
    };
    return names[module] || module;
}

// 執行測試
testCompleteCRUD();