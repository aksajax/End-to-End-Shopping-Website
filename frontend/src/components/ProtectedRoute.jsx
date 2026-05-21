// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, getUserRole } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = getAuthToken();
    const userRole = getUserRole();

    if (!token) {
        // Agar logged in nahi hai toh login page par bhejo
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Agar role allowed nahi hai, toh unauthorized ya default login par bhejo
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;