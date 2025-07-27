// 測試角色切換和駁回選項
console.log('🧪 測試角色切換和駁回選項功能...');

// 模擬角色映射函數
function testRoleMapping() {
    const roleMapping = {
        '管理員': 'ADMIN',
        '職環安': 'EHS', 
        '再生經理': 'MANAGER',
        '一般使用者': 'CONTRACTOR'
    };
    
    console.log('\n📋 角色映射測試:');
    Object.entries(roleMapping).forEach(([chinese, english]) => {
        console.log(`${chinese} -> ${english}`);
    });
    
    return roleMapping;
}

// 模擬駁回選項邏輯
function testRejectOptions(userRole) {
    console.log(`\n🔍 測試 ${userRole} 的駁回選項:`);
    
    if (userRole === 'EHS') {
        console.log('✅ 職環安：只能駁回給申請人');
        return ['APPLICANT'];
    } else if (userRole === 'MANAGER') {
        console.log('✅ 再生經理：可駁回給申請人或職環安');
        return ['APPLICANT', 'PREVIOUS_LEVEL'];
    } else if (userRole === 'ADMIN') {
        console.log('✅ 管理員：可駁回給申請人或職環安');
        return ['APPLICANT', 'PREVIOUS_LEVEL'];
    } else {
        console.log('✅ 其他角色：只能駁回給申請人');
        return ['APPLICANT'];
    }
}

// 執行測試
function runTests() {
    console.log('🚀 開始測試...\n');
    
    // 測試角色映射
    const roleMapping = testRoleMapping();
    
    // 測試每個角色的駁回選項
    const roles = ['EHS', 'MANAGER', 'ADMIN', 'CONTRACTOR'];
    roles.forEach(role => {
        const options = testRejectOptions(role);
        console.log(`   可用選項: ${options.join(', ')}`);
    });
    
    console.log('\n✅ 測試完成！');
    console.log('\n📝 預期行為:');
    console.log('• 職環安：只能駁回給申請人（APPLICANT）');
    console.log('• 再生經理：可選擇駁回給申請人或職環安（APPLICANT, PREVIOUS_LEVEL）');
    console.log('• 管理員：擁有完整權限（APPLICANT, PREVIOUS_LEVEL）');
    console.log('• 切換身分後會自動重新整理頁面');
}

runTests();