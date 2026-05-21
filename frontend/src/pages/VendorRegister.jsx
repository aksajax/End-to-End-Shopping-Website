// src/pages/VendorRegister.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setAuthData } from '../utils/auth';

const VendorRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        // Password Validation Check
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords match nahi ho rahe hain!");
        }

        if (formData.password.length < 6) {
            return toast.error("Password kam se kam 6 characters ka hona chahiye.");
        }

        try {
            // 1. Register the Vendor
            // const regResponse = await axios.post('http://127.0.0.1:8000/api/auth/register/', {
            const regResponse = await axios.post('https://end-to-end-shopping-website.onrender.com/api/auth/register/', {
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: 'VENDOR' // Hardcoded role taaki vendor hi bane
            });

            toast.success("Account successfully ban gaya! Logging you in...");

            // 2. Registration ke turant baad automatic login flow
            // const loginResponse = await axios.post('http://127.0.0.1:8000/api/auth/login/', {
            const loginResponse = await axios.post('https://end-to-end-shopping-website.onrender.com/api/auth/login/', {
                email: formData.email,
                password: formData.password
            });

            const { access, user } = loginResponse.data;
            setAuthData(access, user);

            // Redirection to Supplier Hub
            navigate('/vendor');

        } catch (error) {
            const errorData = error.response?.data;
            if (errorData?.email) {
                toast.error("Yeh email ID pehle se registered hai!");
            } else {
                toast.error("Registration mein dikkat aayi. Kripya details check karein.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="text-2xl font-extrabold text-pink-600 tracking-wider">MEESHO <span className="text-gray-500 font-medium text-lg">Supplier Hub</span></div>
                <Link to="/login" className="text-sm font-semibold text-pink-600 hover:text-pink-700">Pehle se account hai? Sign In</Link>
            </header>

            {/* Main content body */}
            <div className="flex-grow flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                    
                    {/* Left Banner: Informational Block */}
                    <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-10 text-white flex flex-col justify-center">
                        <h2 className="text-3xl font-extrabold mb-4">Meesho par apna business shuru karein!</h2>
                        <p className="text-pink-100 mb-6 text-sm leading-relaxed">
                            Koreans, Housewires aur Dukandaro ki tarah aap bhi 0% Commission par pure Bharat mein crore-o customers tak apna product bechein.
                        </p>
                        <div className="space-y-4 text-sm font-semibold">
                            <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
                                <span>💰</span> <span>0% Commission Marketplace</span>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
                                <span>📦</span> <span>Easy Shipping & Delivery Support</span>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/10 p-3 rounded-lg">
                                <span>🚀</span> <span>7 Crore+ Active Customers</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Form: Registration Inputs */}
                    <div className="p-10 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Create Seller Account</h3>
                        <p className="text-xs text-gray-400 mb-6">Apni basic details daal kar turant register karein.</p>
                        
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name</label>
                                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Rahul" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name</label>
                                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Sharma" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address*</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="rahul@example.com" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password*</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="••••••••" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password*</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" placeholder="••••••••" />
                            </div>

                            <button type="submit" className="w-full bg-pink-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-pink-700 transition shadow-md mt-2">
                                Register as Supplier
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* Footer footer element */}
            <footer className="bg-white border-t border-gray-100 text-center py-4 text-xs text-gray-400">
                &copy; 2026 Meesho Supplier Marketplace Clone. All rights reserved.
            </footer>
        </div>
    );
};

export default VendorRegister;