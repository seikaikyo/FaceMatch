const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function testLogin() {
  try {
    console.log('🔐 Testing Login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testContractorCRUD() {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    console.log('\n👥 Testing Contractor CRUD...');
    
    // CREATE
    console.log('📝 Creating contractor...');
    const createResponse = await axios.post(`${BASE_URL}/contractors`, {
      name: '測試承攬商CRUD',
      code: 'CRUD001',
      contactPerson: '測試聯絡人',
      contactPhone: '02-1234-5678',
      contractValidFrom: '2025-01-01',
      contractValidTo: '2025-12-31'
    }, { headers });
    
    if (createResponse.data.success) {
      console.log('✅ Contractor created successfully');
      const contractorId = createResponse.data.data._id;
      
      // READ
      console.log('📖 Reading contractors...');
      const listResponse = await axios.get(`${BASE_URL}/contractors`, { headers });
      if (listResponse.data.success) {
        console.log(`✅ Found ${listResponse.data.data.length} contractors`);
      }
      
      // UPDATE
      console.log('✏️ Updating contractor...');
      const updateResponse = await axios.put(`${BASE_URL}/contractors/${contractorId}`, {
        name: '測試承攬商CRUD-已更新',
        contactPhone: '02-9876-5432'
      }, { headers });
      
      if (updateResponse.data.success) {
        console.log('✅ Contractor updated successfully');
      }
      
      // DELETE
      console.log('🗑️ Deleting contractor...');
      const deleteResponse = await axios.delete(`${BASE_URL}/contractors/${contractorId}`, { headers });
      
      if (deleteResponse.data.success) {
        console.log('✅ Contractor deleted successfully');
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Contractor CRUD failed:', error.response?.data || error.message);
    return false;
  }
}

async function testWorkOrderCRUD() {
  const headers = { Authorization: `Bearer ${authToken}` };
  
  try {
    console.log('\n📋 Testing Work Order CRUD...');
    
    // First get a contractor ID
    const contractorsResponse = await axios.get(`${BASE_URL}/contractors`, { headers });
    if (!contractorsResponse.data.success || contractorsResponse.data.data.length === 0) {
      console.log('❌ No contractors found for work order test');
      return false;
    }
    
    const contractorId = contractorsResponse.data.data[0]._id;
    
    // CREATE
    console.log('📝 Creating work order...');
    const createResponse = await axios.post(`${BASE_URL}/work-orders`, {
      orderNumber: 'WO-CRUD-001',
      title: '測試施工單CRUD',
      description: '這是一個測試用的施工單',
      contractorId: contractorId,
      siteLocation: '測試施工地點',
      workType: '維修作業',
      riskLevel: 'LOW',
      plannedStartTime: '2025-08-01T09:00:00',
      plannedEndTime: '2025-08-01T17:00:00',
      safetyRequirements: ['穿戴安全帽', '穿戴安全鞋'],
      emergencyContact: '緊急聯絡人 02-1234-5678'
    }, { headers });
    
    if (createResponse.data.success) {
      console.log('✅ Work order created successfully');
      const workOrderId = createResponse.data.data._id;
      
      // READ
      console.log('📖 Reading work orders...');
      const listResponse = await axios.get(`${BASE_URL}/work-orders`, { headers });
      if (listResponse.data.success) {
        console.log(`✅ Found ${listResponse.data.data.length} work orders`);
      }
      
      // UPDATE
      console.log('✏️ Updating work order...');
      const updateResponse = await axios.put(`${BASE_URL}/work-orders/${workOrderId}`, {
        title: '測試施工單CRUD-已更新',
        riskLevel: 'MEDIUM'
      }, { headers });
      
      if (updateResponse.data.success) {
        console.log('✅ Work order updated successfully');
      }
      
      // DELETE
      console.log('🗑️ Deleting work order...');
      const deleteResponse = await axios.delete(`${BASE_URL}/work-orders/${workOrderId}`, { headers });
      
      if (deleteResponse.data.success) {
        console.log('✅ Work order deleted successfully');
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Work Order CRUD failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting CRUD Tests...\n');
  
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Tests failed - cannot login');
    return;
  }
  
  const contractorSuccess = await testContractorCRUD();
  const workOrderSuccess = await testWorkOrderCRUD();
  
  console.log('\n📊 Test Results:');
  console.log(`🔐 Login: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`👥 Contractor CRUD: ${contractorSuccess ? '✅' : '❌'}`);
  console.log(`📋 Work Order CRUD: ${workOrderSuccess ? '✅' : '❌'}`);
  
  if (loginSuccess && contractorSuccess && workOrderSuccess) {
    console.log('\n🎉 All CRUD tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the backend server.');
  }
}

runAllTests();