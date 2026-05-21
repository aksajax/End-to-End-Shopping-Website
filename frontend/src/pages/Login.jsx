import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setAuthData } from '../utils/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // YEH STATE TRACK KAREGI KI ABHI KAUN SA DEV ROLE SELECTED HAI (Default 'USER' rakh dete hain)
    const [currentRole, setCurrentRole] = useState('USER');
    const navigate = useNavigate();

    // 🚀 CRITICAL FIX: Prevent logged-in users from accessing Login page via browser back button
    useEffect(() => {
        // Aapki setAuthData/auth utility jis token key par data save karti hai usko check karo
        const token = localStorage.getItem('access_token') || localStorage.getItem('token'); 
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // User ke system role ke hisab se exact protected route lock karo
                if (parsedUser.role === 'ADMIN') {
                    navigate('/admin', { replace: true });
                } else if (parsedUser.role === 'VENDOR') {
                    navigate('/vendor', { replace: true });
                } else {
                    navigate('/home', { replace: true });
                }
            } catch (err) {
                console.error("Error parsing user payload from storage:", err);
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/auth/login/', { email, password });
            const { access, user } = response.data;
            
            // Local storage inside application shell updates
            setAuthData(access, user);
            toast.success(`Welcome back, ${user.first_name || 'User'}!`);

            // 🚀 CRITICAL FIX: Role-Based Routing with { replace: true } to clear history stack
            if (user.role === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else if (user.role === 'VENDOR') {
                navigate('/vendor', { replace: true });
            } else {
                navigate('/home', { replace: true });
            }
            
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid Credentials! Please try again.');
        }
    };

    // Dev control jo text fields bhi bharega aur state bhi update karega
    const handleQuickLogin = (roleType) => {
        setCurrentRole(roleType); // Active role save ho raha hai yahan
        
        if (roleType === 'ADMIN') {
            setEmail('admin@gmail.com');
            setPassword('admin123');
            toast.info("Admin testing credentials filled!");
        } else if (roleType === 'SELLER') {
            setEmail('vendor@gmail.com');
            setPassword('vendor123');
            toast.info("Seller/Vendor testing credentials filled!");
        } else {
            setEmail('user@gmail.com');
            setPassword('user123');
            toast.info("Customer testing credentials filled!");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <form onSubmit={handleLogin}>
                    <h2 className="text-2xl font-bold text-center mb-6 text-pink-600">TechKart Sign In</h2>
                    
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold text-gray-700">Email Address</label>
                        <input 
                            type="img-email" 
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block mb-1 font-semibold text-gray-700">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-pink-600 text-white font-bold py-2 rounded-lg hover:bg-pink-700 transition duration-200"
                    >
                        Sign In
                    </button>
                </form>

                {/* --- ⚡ DEV-MODE FAST BYPASS BUTTONS --- */}
                <div className="mt-6 pt-5 border-t border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-center text-slate-500 uppercase tracking-widest mb-3">
                        🛠️ AUTO-FILL CONTROL
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('ADMIN')}
                            className={`font-bold text-xs py-2 rounded-md transition border shadow-xs ${currentRole === 'ADMIN' ? 'bg-purple-600 text-white border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'}`}
                        >
                            👑 Admin
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('SELLER')}
                            className={`font-bold text-xs py-2 rounded-md transition border shadow-xs ${currentRole === 'SELLER' ? 'bg-pink-600 text-white border-pink-700' : 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200'}`}
                        >
                            🏪 Seller
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickLogin('USER')}
                            className={`font-bold text-xs py-2 rounded-md transition border shadow-xs ${currentRole === 'USER' ? 'bg-blue-600 text-white border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'}`}
                        >
                            👤 User
                        </button>
                    </div>
                </div>

                {/* --- 📝 DYNAMIC CONDITIONAL REGISTRATION LINK --- */}
                <div className="mt-5 text-center min-h-[20px]">
                    {currentRole === 'SELLER' && (
                        <p className="text-xs text-gray-500">
                            New Seller ?{' '}
                            <span 
                                onClick={() => navigate('/vendor-register')} 
                                className="text-pink-600 font-bold cursor-pointer hover:underline"
                            >
                                Register Now
                            </span>
                        </p>
                    )}
                    
                    {currentRole === 'USER' && (
                        <p className="text-xs text-gray-500">
                            New User ?{' '}
                            <span 
                                onClick={() => navigate('/register')} 
                                className="text-blue-600 font-bold cursor-pointer hover:underline"
                            >
                                Register Now
                            </span>
                        </p>
                    )}

                    {currentRole === 'ADMIN' && (
                        <p className="text-xs text-purple-500 italic font-medium">
                            🔒 Admin registration dashboard se allow nahi hai.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Login;