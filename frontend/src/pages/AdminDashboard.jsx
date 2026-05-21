import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { logoutUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    // --- States Definition ---
    const [currentTab, setCurrentTab] = useState('orders'); // 'orders' or 'users'
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]); 
    const [vendorOrders, setVendorOrders] = useState({}); 
    const [usersList, setUsersList] = useState([]); // Master Users State
    const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalUsers: 0 });
    
    // 🔍 SEE MORE / MODAL POPUP STATE
    const [selectedUserOrders, setSelectedUserOrders] = useState(null); 

    // Category Upload Elements
    const [categoryImage, setCategoryImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const navigate = useNavigate();
    // const BACKEND_URL = "http://127.0.0.1:8000"; 
    const BACKEND_URL = "https://end-to-end-shopping-website.onrender.com"; 

    // --- 1. Centralized Data Sync Station & Cross-Reference Mapping Engine ---
    const loadAdminData = async () => {
        try {
            // Fetching data from all core clusters
            const [catRes, prodRes, orderRes, usersRes] = await Promise.all([
                API.get('products/categories/'),
                API.get('products/items/'),
                API.get('products/orders/'),
                API.get('users/').catch(() => API.get('auth/users/')).catch(() => ({ data: null }))
            ]);
            
            setCategories(catRes.data || []);
            const rawOrders = orderRes.data || [];
            const globalProducts = prodRes.data || [];
            
            setOrders(rawOrders);

            // --- 👥 USER DISCOVERY & COMPILATION PIPELINE 👥 ---
            let compiledUsers = [];
            const processedUserIds = new Set();

            // Layer 1: Core Database Users Array (All Registered Users)
            if (usersRes && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
                usersRes.data.forEach(u => {
                    if (u && u.id) {
                        compiledUsers.push({
                            id: u.id,
                            username: u.username || "N/A",
                            email: u.email || "No Email Linked",
                            is_superuser: u.is_superuser || false,
                            is_staff: u.is_staff || false,
                            date_joined: u.date_joined || null
                        });
                        processedUserIds.add(u.id);
                    }
                });
            }

            // Layer 2: Fallback Parser (Order Logs Extraction for missing references)
            rawOrders.forEach(order => {
                if (order && order.user && order.user.id) {
                    if (!processedUserIds.has(order.user.id)) {
                        compiledUsers.push({
                            id: order.user.id,
                            username: order.user.username || order.buyer_name || order.customer_name || "Anonymous User",
                            email: order.user.email || order.customer_email || "No Email Linked",
                            is_superuser: order.user.is_superuser || false,
                            is_staff: order.user.is_staff || false,
                            date_joined: order.user.date_joined || order.created_at || null
                        });
                        processedUserIds.add(order.user.id);
                    }
                } else if (order && (order.customer_name || order.buyer_name)) {
                    const rawName = order.customer_name || order.buyer_name;
                    if (!processedUserIds.has(rawName)) {
                        compiledUsers.push({
                            id: order.user_id || Math.floor(Math.random() * 100000),
                            username: rawName,
                            email: order.customer_email || "No Email Linked",
                            is_superuser: false,
                            is_staff: false,
                            date_joined: order.created_at || null
                        });
                        processedUserIds.add(rawName);
                    }
                }
            });

            setUsersList(compiledUsers);
            
            setStats({
                totalProducts: globalProducts.length,
                totalOrders: rawOrders.length,
                totalUsers: compiledUsers.length
            });

            // Create lookup map for vendor identification
            const productVendorMap = {};
            globalProducts.forEach(p => {
                if (p && p.id) {
                    productVendorMap[p.id] = p.vendor || p.owner || null;
                }
            });

            const grouped = {};

            rawOrders.forEach(order => {
                const orderItems = order.items || [];
                const buyerName = order.user?.username || order.user?.first_name || order.customer_name || order.buyer_name || "Anonymous Buyer";
                const buyerEmail = order.user?.email || order.customer_email || "";
                const finalBuyerDisplay = buyerEmail ? `${buyerName} (${buyerEmail})` : buyerName;

                orderItems.forEach(item => {
                    const productObj = item.product || {};
                    const pId = productObj.id || item.product_id || item.product || 'N/A';
                    const pName = productObj.name || item.product_name || item.title || 'Untitled Product';
                    const pPrice = item.price || productObj.price || item.unit_price || 0;

                    let dynamicVendor = productObj.vendor || productVendorMap[pId] || item.vendor || null;
                    let vendorName = "Platform Managed / No Vendor";
                    let vendorEmail = "N/A";

                    if (dynamicVendor) {
                        if (typeof dynamicVendor === 'object') {
                            vendorName = dynamicVendor.username || dynamicVendor.name || dynamicVendor.first_name || "Platform Managed / No Vendor";
                            vendorEmail = dynamicVendor.email || "N/A";
                        } else if (typeof dynamicVendor === 'string' || typeof dynamicVendor === 'number') {
                            vendorName = `Vendor ID: ${dynamicVendor}`;
                        }
                    }

                    const vendorKey = vendorName;

                    if (!grouped[vendorKey]) {
                        grouped[vendorKey] = {
                            vendorInfo: { name: vendorName, email: vendorEmail },
                            itemsList: []
                        };
                    }

                    grouped[vendorKey].itemsList.push({
                        orderId: order.id,
                        status: order.status || 'PENDING',
                        address: order.shipping_address || order.address || order.delivery_address || 'No Address Provided',
                        buyer: finalBuyerDisplay,
                        productId: pId,
                        productName: pName,
                        itemPrice: pPrice,
                        qty: item.quantity || 1
                    });
                });
            });

            setVendorOrders(grouped);

        } catch (err) {
            console.error("Sync Error:", err);
            toast.error("Admin control metrics load hone mein dikkat aayi!");
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    // --- 🔍 SEE MORE ACTION CONTROLLER ---
    const handleSeeMoreClick = (user) => {
        // Find all matched line items purchased by this specific user cross referencing username/id
        const userPurchasedItems = [];
        
        orders.forEach(order => {
            const isMatch = (order.user && order.user.id === user.id) || 
                            (order.user && order.user.username === user.username) ||
                            (order.customer_name === user.username) || 
                            (order.buyer_name === user.username);
            
            if (isMatch) {
                const items = order.items || [];
                items.forEach(item => {
                    userPurchasedItems.push({
                        orderId: order.id,
                        productName: item.product?.name || item.product_name || "Unknown Item",
                        productId: item.product?.id || item.product_id || "N/A",
                        price: item.price || item.product?.price || 0,
                        qty: item.quantity || 1,
                        status: order.status || 'PENDING',
                        date: order.created_at || null
                    });
                });
            }
        });

        setSelectedUserOrders({
            userInfo: user,
            purchases: userPurchasedItems
        });
    };

    // --- 2. Image Picker Buffer Pipeline ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCategoryImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // --- 3. Form Submission Pipeline ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.warning("Category ka naam khali nahi ho sakta!");
            return;
        }

        const formData = new FormData();
        formData.append('name', categoryName);
        formData.append('slug', categoryName.toLowerCase().trim().replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, '-'));
        
        if (categoryImage) {
            formData.append('image', categoryImage);
        }

        try {
            if (isEditing) {
                await API.put(`products/categories/${editId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(`🎉 Category kamyabi se update ho gayi!`);
                setIsEditing(false);
                setEditId(null);
            } else {
                await API.post('products/categories/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(`🎉 New Category "${categoryName}" publish ho gayi!`);
            }
            
            setCategoryName('');
            setCategoryImage(null);
            setImagePreview(null);
            loadAdminData(); 
        } catch (err) {
            toast.error(err.response?.data?.name?.[0] || "Action perform karne mein error aaya!");
        }
    };

    // --- 4. Transition Controllers ---
    const startEdit = (category) => {
        setIsEditing(true);
        setEditId(category.id);
        setCategoryName(category.name);
        if (category.image) {
            const fullImageUrl = category.image.startsWith('http') ? category.image : `${BACKEND_URL}${category.image}`;
            setImagePreview(fullImageUrl);
        } else {
            setImagePreview(null);
        }
        setCategoryImage(null);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setCategoryName('');
        setCategoryImage(null);
        setImagePreview(null);
    };

    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`⚠️ Kya aap sach mein "${name}" category ko delete karna chahte hain?`)) return;
        try {
            await API.delete(`products/categories/${id}/`);
            toast.error(`🗑️ Category "${name}" permanent delete ho gayi!`);
            if (editId === id) cancelEdit();
            loadAdminData();
        } catch (err) {
            toast.error("Delete failed!");
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-50 flex font-sans antialiased overflow-hidden relative">
            
            {/* 🔒 LEFT FIXED SIDEBAR PANEL */}
            <div className="w-64 bg-slate-950 text-white p-6 flex flex-col justify-between shadow-2xl h-full shrink-0 z-40">
                <div>
                    <h2 className="text-xl font-black text-blue-500 tracking-wider mb-8 italic">
                        TechKart Admin <span className="text-[10px] text-white bg-blue-600 px-1.5 py-0.5 rounded-sm not-italic ml-1">ADMIN</span>
                    </h2>
                    
                    <nav className="space-y-3">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest pl-2">Navigation Hub</div>
                        
                        <button 
                            onClick={() => setCurrentTab('orders')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 border ${
                                currentTab === 'orders' ? 'bg-slate-900 text-blue-400 border-blue-900/40' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <i className="fa-solid fa-boxes-stacked text-sm"></i>
                                <span>Vendor Orders</span>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">{stats.totalOrders}</span>
                        </button>

                        <button 
                            onClick={() => setCurrentTab('users')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 border ${
                                currentTab === 'users' ? 'bg-slate-900 text-blue-400 border-blue-900/40' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <i className="fa-solid fa-users text-sm"></i>
                                <span>Users Registry</span>
                            </div>
                            <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded-md font-mono">{stats.totalUsers}</span>
                        </button>
                    </nav>
                </div>

                <button 
                    onClick={() => { logoutUser(); navigate('/login'); }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs tracking-wider transition-all duration-150"
                >
                    LOGOUT FROM PLATFORM
                </button>
            </div>

            {/* 📜 RIGHT SCROLLABLE PANEL CONTAINER */}
            <div className="flex-grow h-full overflow-y-auto p-8 w-full">
                <div className="max-w-[1600px] mx-auto">
                    
                    <header className="border-b pb-4 mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Control Station</h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {currentTab === 'orders' ? 'Track vendor order metrics, build catalogs, and manage structural routing maps' : 'View system-wide registered user profiles and access metrics'}
                            </p>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                            🛡️ Account Auth: root_admin
                        </span>
                    </header>

                    {/* Counter Metric Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active System Categories</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{categories.length} <span className="text-xs text-slate-400 font-semibold">Nodes</span></h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global Live Catalogue</p>
                            <h3 className="text-3xl font-black text-blue-600 mt-1">{stats.totalProducts} <span className="text-xs text-blue-400 font-semibold">Items</span></h3>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Registered Base</p>
                            <h3 className="text-3xl font-black text-purple-600 mt-1">{stats.totalUsers} <span className="text-xs text-purple-400 font-semibold">Users</span></h3>
                        </div>
                    </div>

                    {/* DYNAMIC TAB SWITCHER AREA */}
                    {currentTab === 'orders' ? (
                        <>
                            {/* --- ORDERS MATRIX VIEW --- */}
                            <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                                <div className="flex justify-between items-center border-b pb-4 mb-6">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                                            <i className="fa-solid fa-boxes-stacked text-blue-600"></i>
                                            <span>Vendor Granular Order Audit Matrix</span>
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {Object.keys(vendorOrders).map((vendorKey, idx) => {
                                        const node = vendorOrders[vendorKey];
                                        return (
                                            <div key={idx} className="border border-slate-200 rounded-2xl bg-slate-50/40 overflow-hidden shadow-2xs">
                                                <div className="bg-white border-b px-5 py-4 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-black text-base text-slate-900 tracking-wide uppercase flex items-center gap-2">
                                                            <i className="fa-solid fa-shop text-blue-600 text-sm"></i>
                                                            <span>{node.vendorInfo.name}</span>
                                                        </h4>
                                                        <p className="text-xs text-slate-400 font-medium mt-0.5">Contact: {node.vendorInfo.email}</p>
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="border-b bg-slate-100 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                                                <th className="py-3 px-5">Invoice Reference</th>
                                                                <th className="py-3 px-5">Product Matrix</th>
                                                                <th className="py-3 px-5">Commercial Value</th>
                                                                <th className="py-3 px-5">Delivery Coordinates</th>
                                                                <th className="py-3 px-5 text-center">Pipeline State</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200 bg-white text-xs text-slate-700 font-medium">
                                                            {node.itemsList.map((item, itemIdx) => (
                                                                <tr key={itemIdx} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="py-4 px-5">
                                                                        <div className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md inline-block">#{item.orderId}</div>
                                                                        <p className="text-[11px] text-slate-600 mt-1 font-bold">Buyer: <span className="text-blue-600">{item.buyer}</span></p>
                                                                    </td>
                                                                    <td className="py-4 px-5 max-w-xs">
                                                                        <p className="font-black text-slate-900 text-sm truncate">{item.productName}</p>
                                                                        <p className="text-[10px] text-slate-500 font-mono">Product ID: #{item.productId}</p>
                                                                    </td>
                                                                    <td className="py-4 px-5">
                                                                        <p className="font-black text-slate-900 text-sm">₹{parseFloat(item.itemPrice || 0).toLocaleString('en-IN')}</p>
                                                                        <p className="text-[10px] text-slate-400">Qty: {item.qty} units</p>
                                                                    </td>
                                                                    <td className="py-4 px-5 max-w-md">
                                                                        <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg text-[11px] border border-slate-100">{item.address}</p>
                                                                    </td>
                                                                    <td className="py-4 px-5 text-center">
                                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${item.status === 'COMPLETED' || item.status === 'DELIVERED' || item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Catalog Form and List Component */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Create Category */}
                                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                                    <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest border-b pb-3 mb-5">
                                        <span>{isEditing ? '✏️ Modify Active Category Structure' : '➕ Create Global Catalogue Node'}</span>
                                    </h3>
                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        <div>
                                            <label className="block mb-1 font-black text-slate-400 text-[10px] uppercase tracking-wider">Category Identifier Title</label>
                                            <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Traditional Accessories" required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm font-semibold text-slate-800" />
                                        </div>
                                        <div>
                                            <label className="block mb-1 font-black text-slate-400 text-[10px] uppercase tracking-wider">Graphic Asset Payload</label>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border rounded-xl p-1 bg-slate-50/50" />
                                            {imagePreview && (
                                                <div className="mt-4 border border-slate-200 p-2 rounded-xl bg-slate-50 relative w-24 h-24">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                    <button type="button" onClick={() => { setCategoryImage(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold">✕</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-2 pt-2">
                                            {isEditing && <button type="button" onClick={cancelEdit} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm">Cancel</button>}
                                            <button type="submit" className={`flex-grow font-black py-2.5 rounded-xl text-sm text-white ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{isEditing ? 'Push Structural Updates' : 'Commit Context to Cluster'}</button>
                                        </div>
                                    </form>
                                </div>

                                {/* Category List */}
                                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-3 mb-5">📁 System Level Catalogue Categories ({categories.length})</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                                                    <th className="py-3 px-3">Identity</th>
                                                    <th className="py-3 px-3">Thumbnail</th>
                                                    <th className="py-3 px-3">Category Name</th>
                                                    <th className="py-3 px-3 text-right">Operation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                                                {categories.map((cat) => (
                                                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 px-3 font-mono text-xs text-slate-400">#cat_0{cat.id}</td>
                                                        <td className="py-4 px-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border overflow-hidden flex items-center justify-center">
                                                                {cat.image ? <img src={cat.image.startsWith('http') ? cat.image : `${BACKEND_URL}${cat.image}`} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-folder text-slate-400 text-xs"></i>}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-3 font-black text-slate-800 capitalize">{cat.name}</td>
                                                        <td className="py-4 px-3 text-right space-x-2 whitespace-nowrap">
                                                            <button onClick={() => startEdit(cat)} className="text-[11px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl font-bold">Edit</button>
                                                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-[11px] bg-red-50 text-red-700 px-3 py-1.5 rounded-xl font-bold">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 👥 --- SYSTEM USERS REGISTRY TABLE VIEW --- */
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="border-b pb-4 mb-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                                    <i className="fa-solid fa-users text-purple-600"></i>
                                    <span>System Registered Users Masterbase</span>
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Secure direct registry containing user account identities, emails, and full shopping histories</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b bg-slate-100 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                            <th className="py-3.5 px-5">User ID</th>
                                            <th className="py-3.5 px-5">Account Username</th>
                                            {/* <th className="py-3.5 px-5">Email Address</th> */}
                                            <th className="py-3.5 px-5">Role/Status</th>
                                            <th className="py-3.5 px-5 text-right font-black">Shopping Metrics</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white text-xs text-slate-700 font-medium">
                                        {usersList.map((user, uIdx) => (
                                            <tr key={user.id || uIdx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-5 font-mono text-slate-400 font-bold">
                                                    #usr_{user.id}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <span className="font-black text-slate-900 text-sm capitalize">{user.username || 'N/A'}</span>
                                                </td>
                                                {/* <td className="py-4 px-5 font-semibold text-blue-600">
                                                    {user.email || 'No Email Linked'}
                                                </td> */}
                                                <td className="py-4 px-5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                                                        user.is_superuser || user.is_staff ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {user.is_superuser ? 'Super Admin' : user.is_staff ? 'Staff/Vendor' : 'Active Customer'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    {/* 🔥 SEE MORE INTERACTION TRIGGER */}
                                                    <button
                                                        onClick={() => handleSeeMoreClick(user)}
                                                        className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-200 rounded-lg text-[11px] font-black tracking-wide uppercase transition-all duration-150 shadow-sm"
                                                    >
                                                        See More <i className="fa-solid fa-angle-right text-[9px] ml-1"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 💎 🛑 PREMIUM OVERLAY MODAL FOR USER PURCHASES ("SEE MORE") 🛑 💎 */}
            {selectedUserOrders && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-200 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-transform">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
                            <div>
                                <span className="text-[10px] bg-blue-600 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded">User Cart Audit</span>
                                <h3 className="text-lg font-black tracking-tight mt-1 capitalize flex items-center gap-2">
                                    <i className="fa-solid fa-circle-user text-blue-400"></i>
                                    <span>{selectedUserOrders.userInfo.username}</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">Mapped ID: #usr_{selectedUserOrders.userInfo.id} • {selectedUserOrders.userInfo.email}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedUserOrders(null)}
                                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 flex items-center justify-center transition-colors text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content / Purchases List */}
                        <div className="p-6 overflow-y-auto flex-grow bg-slate-50/50">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Itemized Purchase Logs ({selectedUserOrders.purchases.length})</h4>
                            
                            {selectedUserOrders.purchases.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedUserOrders.purchases.map((item, idx) => (
                                        <div key={idx} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-2xs hover:border-blue-200 transition-all">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] font-black bg-slate-100 px-1.5 py-0.5 text-slate-700 rounded">Invoice #{item.orderId}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${item.status === 'COMPLETED' || item.status === 'DELIVERED' || item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{item.status}</span>
                                                </div>
                                                <p className="font-black text-slate-900 text-sm capitalize mt-1.5">{item.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">SKU/Prod ID: #{item.productId}</p>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                                                <p className="text-base font-black text-slate-900">₹{parseFloat(item.price).toLocaleString('en-IN')}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">Quantity Ordered: {item.qty} pcs</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed rounded-xl bg-white">
                                    <i className="fa-solid fa-basket-shopping block text-3xl mb-2 text-slate-300"></i>
                                    <p className="text-xs text-slate-500 font-bold">Yeh user ekdum fresh hai! Isne abhi tak platform se koi purchase nahi kiya hai.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t bg-white p-4 flex justify-end shrink-0">
                            <button 
                                onClick={() => setSelectedUserOrders(null)}
                                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
                            >
                                Close Audit Log
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;