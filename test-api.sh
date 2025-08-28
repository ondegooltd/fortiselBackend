#!/bin/bash

# Fortisel API Testing Script
BASE_URL="http://localhost:3000"

echo "🚀 Testing Fortisel API..."
echo "=========================="

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo -e "\n"

# Test 2: Create User
echo "2. Creating User..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "TEST001",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "role": "customer"
  }')

echo "User Response: $USER_RESPONSE"
USER_ID=$(echo $USER_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "User ID: $USER_ID"

echo -e "\n"

# Test 3: User Login
echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Login Response: $LOGIN_RESPONSE"
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "JWT Token: $TOKEN"

echo -e "\n"

# Test 4: Create Order
echo "4. Creating Order..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/order" \
  -H "Content-Type: application/json" \
  -d '{
    "cylinderSize": "12.5kg",
    "quantity": 2,
    "refillAmount": 25.0,
    "deliveryFee": 5.0,
    "totalAmount": 55.0,
    "pickupAddress": "123 Pickup St, City",
    "dropOffAddress": "456 Delivery St, City",
    "receiverName": "Test User",
    "receiverPhone": "+1234567890",
    "paymentMethod": "card",
    "notes": "Test order"
  }')

echo "Order Response: $ORDER_RESPONSE"
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
echo "Order ID: $ORDER_ID"

echo -e "\n"

# Test 5: Get All Orders
echo "5. Getting All Orders..."
curl -X GET "$BASE_URL/order" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo -e "\n"

# Test 6: Create Payment
echo "6. Creating Payment..."
curl -s -X POST "$BASE_URL/payments" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"userId\": \"$USER_ID\",
    \"amount\": 55.0,
    \"currency\": \"NGN\",
    \"provider\": \"PAYSTACK\",
    \"paymentMethod\": \"card\",
    \"description\": \"Test payment\"
  }" | jq '.'

echo -e "\n"

# Test 7: Get All Payments
echo "7. Getting All Payments..."
curl -X GET "$BASE_URL/payments" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo -e "\n"

# Test 8: Create Delivery
echo "8. Creating Delivery..."
curl -s -X POST "$BASE_URL/deliveries" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"pickupAddress\": \"123 Pickup St, City\",
    \"dropOffAddress\": \"456 Delivery St, City\",
    \"deliveryFee\": 5.0,
    \"estimatedPickupTime\": \"2024-01-15T10:00:00Z\",
    \"estimatedDeliveryTime\": \"2024-01-15T14:00:00Z\"
  }" | jq '.'

echo -e "\n"

# Test 9: Get All Deliveries
echo "9. Getting All Deliveries..."
curl -X GET "$BASE_URL/deliveries" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo -e "\n"

# Test 10: Admin Dashboard (with JWT)
echo "10. Testing Admin Dashboard..."
curl -X GET "$BASE_URL/admin/dashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nStatus: %{http_code}\nTime: %{time_total}s\n"

echo -e "\n"
echo "✅ API Testing Complete!" 