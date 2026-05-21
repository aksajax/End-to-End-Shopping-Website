import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CustomerHome from './pages/CustomerHome';
import ProtectedRoute from './components/ProtectedRoute';
import VendorRegister from './pages/VendorRegister';
import HomeFeed from './pages/HomeFeed';
import UserRegister from './pages/UserRegister';
// 🛒 IMPORTANT: Cart page ko yahan import karo (Agar aapka file path alag hai toh update kar lena)
import Cart from './pages/Cart'; 
import Checkout from './pages/Checkout'; // ✅ Checkout page bhi import karna mat bhoolna!

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/vendor-register" element={<VendorRegister />} />
        <Route path="/home" element={<CustomerHome />} />
        <Route path="/register" element={<UserRegister />} />

        {/* 🛒 FIX: Cart page ka route jo aap bhool gaye the */}
        <Route path="/cart" element={<Cart />} />

        {/* Protected Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Vendor Route */}
        <Route 
          path="/vendor" 
          element={
            <ProtectedRoute allowedRoles={['VENDOR']}>
              <VendorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Unauthorized Route / Fallback */}
        <Route 
          path="/unauthorized" 
          element={
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
              <h1 className="text-4xl font-extrabold text-red-600">403 - Access Denied</h1>
              <p className="text-gray-600 mt-2 text-lg font-medium">
                Aapke paas is dashboard ko dekhne ki permission nahi hai.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-pink-700"
              >
                Go to Home
              </button>
            </div>
          } 
        />
          <Route 
  path="/checkout" 
  element={
    <ProtectedRoute allowedRoles={['CUSTOMER', 'USER']}> {/* Aapka jo bhi customer role ka naam ho */}
      <Checkout />
    </ProtectedRoute>
  } 
/>
        {/* Agar koi random URL daale toh Login/Home par redirect karein */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;