// src/pages/UserRegister.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserRegister = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
        toast.error("Password aur Confirm Password match nahi ho rahe hain!");
        return;
    }

    try {
        // TRICK: Agar backend 'USER' se naraz hai toh 'CUSTOMER' try karte hain
        // Aur agar role field block hai toh niche options hain
        const payload = {
            username: email,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
            role: 'CUSTOMER' // 'USER' ko badal kar 'CUSTOMER' kar diya jo Meesho models mein common hai
        };

        await axios.post('http://127.0.0.1:8000/api/auth/register/', payload);
        toast.success("🎉 Account successfully create ho gaya! Ab aap login kar sakte hain.");
        navigate('/login');
        
    } catch (error) {
        console.error("Backend Validation Error:", error.response?.data);
        
        const serverData = error.response?.data;
        
        // 💡 DEEP DEBUG WORKAROUND: Agar abhi bhi role error de, toh bina role ke bhej kar dekhte hain
        if (serverData && serverData.role) {
            console.log("Role reject hua, retry bina role key ke...");
            try {
                const backupPayload = {
                    username: email,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    password: password
                    // role field poori tarah hata diya taaki Django apna default set kare
                };
                await axios.post('http://127.0.0.1:8000/api/auth/register/', backupPayload);
                toast.success("🎉 Account successfully create ho gaya (Default Role)!");
                navigate('/login');
                return;
            } catch (retryError) {
                console.error("Retry failed too:", retryError.response?.data);
            }
        }

        if (serverData && typeof serverData === 'object') {
            const firstField = Object.keys(serverData)[0];
            const msg = serverData[firstField];
            toast.error(`${firstField}: ${Array.isArray(msg) ? msg[0] : msg}`);
        } else {
            toast.error('Registration fail ho gaya!');
        }
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-6 text-blue-600">Meesho Clone User Signup</h2>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* First Name */}
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700 text-sm">First Name</label>
                        <input 
                            type="text" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            required 
                            placeholder="John"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700 text-sm">Last Name</label>
                        <input 
                            type="text" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            required 
                            placeholder="Doe"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700 text-sm">Email Address</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700 text-sm">Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700 text-sm">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm text-sm"
                    >
                        Register As User
                    </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-4 text-center border-t pt-4 border-gray-100">
                    <p className="text-xs text-gray-500">
                        Pehle se account hai?{' '}
                        <span 
                            onClick={() => navigate('/login')} 
                            className="text-blue-600 font-bold cursor-pointer hover:underline"
                        >
                            Yahan Login Karein
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserRegister;