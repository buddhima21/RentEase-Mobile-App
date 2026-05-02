const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');
const Property = require('./models/Property');
const Agreement = require('./models/Agreement');
const MaintenanceRequest = require('./models/MaintenanceRequest');

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const API_URL = 'http://localhost:5000/api';

async function generateToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

async function apiFetch(endpoint, token, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
}

async function runTests() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    // Clean up previous tests
    await User.deleteMany({ email: { $in: ['test_tenant@example.com', 'test_admin@example.com', 'test_owner@example.com'] } });
    await MaintenanceRequest.deleteMany({ description: "TEST LEAK" });
    
    // Create users
    const tenant = await User.create({
      name: 'Test Tenant',
      phone: '1234567890',
      email: 'test_tenant@example.com',
      password: 'password123',
      role: 'tenant'
    });
    const tenantToken = await generateToken(tenant);

    const admin = await User.create({
      name: 'Test Admin',
      phone: '1234567890',
      email: 'test_admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    const adminToken = await generateToken(admin);
    
    const owner = await User.create({
      name: 'Test Owner',
      phone: '1234567890',
      email: 'test_owner@example.com',
      password: 'password123',
      role: 'owner'
    });

    // Create property
    const property = await Property.create({
      owner: owner._id,
      title: "Test Property",
      description: "Test Desc",
      propertyType: "Apartment",
      price: 1000,
      securityDeposit: 1000,
      bedrooms: 2,
      bathrooms: 1,
      location: "Colombo",
      images: [],
      amenities: [],
      status: "approved"
    });

    // Create agreement
    const agreement = await Agreement.create({
      property: property._id,
      tenant: tenant._id,
      owner: owner._id,
      leaseStartDate: new Date(),
      leaseEndDate: new Date(Date.now() + 365*24*60*60*1000),
      rentAmount: 1000,
      status: 'ACTIVE'
    });

    console.log("Users, property, and agreement created.");
    console.log("---");

    // 1. Create Maintenance Request (Tenant)
    console.log("1. Tenant creating maintenance request...");
    const createRes = await apiFetch('/maintenance', tenantToken, 'POST', {
      category: "Plumbing",
      description: "TEST LEAK",
      entryPermission: "CONTACT_TO_SCHEDULE"
    });
    const requestId = createRes._id;
    console.log("Created successfully. ID:", requestId);
    console.log("---");

    // 2. Get My Maintenance Requests (Tenant)
    console.log("2. Tenant fetching my requests...");
    const myRes = await apiFetch('/maintenance/my', tenantToken, 'GET');
    console.log("Found", myRes.length, "requests.");
    if (myRes[0].description !== "TEST LEAK") throw new Error("Description mismatch");
    console.log("---");

    // 3. Get All Maintenance Requests (Admin)
    console.log("3. Admin fetching all requests...");
    const allRes = await apiFetch('/maintenance', adminToken, 'GET');
    console.log("Found", allRes.length, "total requests in system.");
    console.log("---");

    // 4. Update Status (Admin) -> AWAITING_PARTS
    console.log("4. Admin updating status to AWAITING_PARTS...");
    await apiFetch(`/maintenance/${requestId}`, adminToken, 'PUT', {
      status: 'AWAITING_PARTS',
      adminNotes: 'Ordering pipes.'
    });
    console.log("Updated successfully.");
    console.log("---");

    // 5. Update Status (Admin) -> RESOLVED
    console.log("5. Admin updating status to RESOLVED...");
    await apiFetch(`/maintenance/${requestId}`, adminToken, 'PUT', {
      status: 'RESOLVED',
      adminNotes: 'Fixed it!'
    });
    console.log("Updated successfully.");
    console.log("---");

    // 6. Tenant confirms fix -> CLOSED
    console.log("6. Tenant confirming fix (status to CLOSED)...");
    await apiFetch(`/maintenance/${requestId}`, tenantToken, 'PUT', { status: 'CLOSED' });
    const finalRes = await apiFetch(`/maintenance/${requestId}`, adminToken, 'GET');
    console.log("Final status is:", finalRes.status);
    console.log("---");

    // 7. Test Tenant reverting fix -> SUBMITTED
    console.log("7. Testing Tenant reverting fix...");
    // First admin sets it back to resolved (need to access db directly since admin cannot close or maybe it's fine)
    await MaintenanceRequest.findByIdAndUpdate(requestId, { status: 'RESOLVED' });
    // Tenant marks still broken
    await apiFetch(`/maintenance/${requestId}`, tenantToken, 'PUT', { status: 'SUBMITTED' });
    const revertRes = await apiFetch(`/maintenance/${requestId}`, adminToken, 'GET');
    console.log("Reverted status is:", revertRes.status);
    console.log("---");
    
    // 8. Tenant tries to delete SUBMITTED ticket
    console.log("8. Tenant deleting SUBMITTED ticket...");
    await apiFetch(`/maintenance/${requestId}`, tenantToken, 'DELETE');
    console.log("Deleted successfully.");
    console.log("---");

    console.log("✅ ALL TESTS PASSED SUCCESSFULLY!");

    // Clean up
    console.log("Cleaning up test data...");
    await Agreement.findByIdAndDelete(agreement._id);
    await Property.findByIdAndDelete(property._id);
    await User.deleteMany({ email: { $in: ['test_tenant@example.com', 'test_admin@example.com', 'test_owner@example.com'] } });

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ TEST FAILED:");
    console.error(error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Wait 1 second to let the server start before running
setTimeout(runTests, 1000);
