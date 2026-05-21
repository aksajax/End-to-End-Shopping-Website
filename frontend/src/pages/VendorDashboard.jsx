// src/pages/VendorDashboard.jsx
import React, { useState, useEffect } from 'react';

import axios from 'axios';
import VendorAnalytics from '../components/VendorAnalytics'; // Naya component import kiya
import { Loader2, CheckCircle2 } from 'lucide-react';
import { logoutUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-toastify';

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'orders'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]); // Real Multi-Item Orders from Backend
    
    // Common Form States
    const [editId, setEditId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Modal States for Center Delete Alert
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ id: null, type: '' });

    // Product Form States
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [stockQty, setStockQty] = useState('');
    const [image, setImage] = useState(null);

    // Category States
    const [catName, setCatName] = useState('');

    
   
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, cRes, oRes] = await Promise.all([
                API.get('products/items/?dashboard=true'), 
                API.get('products/categories/'), 
                API.get('products/orders/') 
            ]);
            setProducts(pRes.data);
            setCategories(cRes.data);
            setOrders(oRes.data);
        } catch (err) { 
            toast.error("Data refresh fail ho gaya!"); 
        }finally {
      setLoading(false);
    }
    };
    

    useEffect(() => { 
        fetchData(); 
    }, []);

    const resetForm = () => {
        setEditId(null); 
        setIsEditing(false);
        setName(''); setCategory(''); setDescription(''); setPrice(''); setDiscountPrice(''); setStockQty(''); setImage(null);
        setCatName('');
    };

    const openDeleteModal = (id, type) => {
        setDeleteTarget({ id, type });
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteTarget({ id: null, type: '' });
    };

    const handleConfirmDelete = async () => {
        const { id, type } = deleteTarget;
        try {
            if (type === 'product') {
                await API.delete(`products/items/${id}/`);
                toast.success("Product kamyabi se hata diya gaya! 🗑️");
            } else if (type === 'category') {
                await API.delete(`products/categories/${id}/`);
                toast.success("Category kamyabi se hata di gayi! 🗑️");
            }
            fetchData();
        } catch (err) {
            toast.error("Hataane mein error aaya!");
        } finally {
            closeDeleteModal();
        }
    };

    // --- PRODUCT ACTIONS ---
    const handleProdSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('price', price);
        if (discountPrice) formData.append('discount_price', discountPrice);
        formData.append('stock_qty', stockQty);
        if (image) formData.append('image', image);

        try {
            if (isEditing) {
                await API.put(`products/items/${editId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Product/Quantity successfully update ho gaya! ✨');
            } else {
                await API.post('products/items/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Naya Product live add ho gaya! 🚀');
            }
            resetForm(); fetchData();
        } catch (err) { toast.error("Product save karne mein error aaya."); }
    };

    const handleProdEditClick = (product) => {
        setIsEditing(true); setEditId(product.id); setName(product.name);
        setCategory(product.category || ''); setDescription(product.description || '');
        setPrice(product.price); setDiscountPrice(product.discount_price || ''); setStockQty(product.stock_qty);
        setActiveTab('products'); 
    };

    // --- CATEGORY ACTIONS ---
    const handleCatSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await API.put(`products/categories/${editId}/`, { name: catName });
                toast.success("Category update ho gayi! 🔥");
            } else {
                await API.post('products/categories/', { name: catName });
                toast.success("Nayi category create ho gayi! 🎉");
            }
            resetForm(); fetchData();
        } catch (err) { toast.error("Category save karne mein error aaya."); }
    };
    // 🔥 PATCH REQUEST: Order Status Update Handler
  // 🔥 PATCH REQUEST: Order Status Update Handler (With Auth Headers)
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      
      // 1. Apne localStorage ya jahan bhi aap token save karte ho, wahan se nikaalo
      const token = localStorage.getItem('token'); // Ya 'accessToken' jo bhi aapka key naam ho

      // 2. Request bhejo headers ke saath
      await axios.patch(
        // `http://127.0.0.1:8000/api/products/orders/${orderId}/`, 
        `https://end-to-end-shopping-website.onrender.com/api/products/orders/${orderId}/`, 
        { status: newStatus }, // Request Body
        {
          headers: {
            // Agar aap JWT use kar rahe ho toh 'Bearer <token>' hoga, 
            // aur agar normal Token authentication hai toh 'Token <token>' hoga.
            'Authorization': `Bearer ${token}` 
          }
        }
      );
      
      // State instantly update karo
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
    } catch (error) {
      console.error("Status update nahi ho paya:", error);
      // Agar error 401 hai toh alert mein user ko btao
      if (error.response?.status === 401) {
        alert("Aap login nahi hain ya session expire ho gaya hai. Kripya fir se login karein!");
      } else {
        alert("Status badalne mein koi dikkat aayi!");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

    return (
        <div className="flex h-screen bg-gray-100 font-sans relative">
            
            
            {/* --- CUSTOM CENTER DELETE MODAL --- */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                            <i className="fa-solid fa-trash-can"></i>
                        </div>
                        <h4 className="text-xl font-black text-slate-800 mb-2">Kya aap sure hain?</h4>
                        <p className="text-sm text-gray-500 mb-6">Yeh action wapas nahi laya ja sakta.</p>
                        <div className="flex items-center space-x-3">
                            <button onClick={closeDeleteModal} className="flex-1 bg-gray-100 text-slate-700 font-bold py-3 rounded-xl text-sm">Nahi</button>
                            <button onClick={handleConfirmDelete} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-red-200">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LEFT SIDEBAR --- */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 text-center border-b border-slate-800">
                    <h1 className="text-2xl font-black text-pink-500 tracking-tighter italic">TechKart HUB</h1>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Supplier Suite</p>
                </div>
                <nav className="flex-grow p-4 space-y-2 mt-4">
                    <button onClick={() => { setActiveTab('products'); resetForm(); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeTab === 'products' ? 'bg-pink-600' : 'hover:bg-slate-800'}`}>
                        <i className="fa-solid fa-box text-lg"></i>
                        <span className="font-semibold">Products Hub</span>
                    </button>
                    <button onClick={() => { setActiveTab('categories'); resetForm(); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeTab === 'categories' ? 'bg-pink-600' : 'hover:bg-slate-800'}`}>
                        <i className="fa-solid fa-tags text-lg"></i>
                        <span className="font-semibold">Categories</span>
                    </button>
                    
                    {/* ORDERS TAB WITH LIVE BADGE */}
                    <button onClick={() => { setActiveTab('orders'); resetForm(); }} className={`w-full flex items-center justify-between p-3 rounded-lg transition ${activeTab === 'orders' ? 'bg-pink-600' : 'hover:bg-slate-800'}`}>
                        <div className="flex items-center space-x-3">
                            <i className="fa-solid fa-truck-ramp-box text-lg"></i>
                            <span className="font-semibold">Orders & Alerts</span>
                        </div>
                        {orders.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                {orders.length} New
                            </span>
                        )}
                    </button>

                    <div className="pt-10 border-t border-slate-800 mt-10">
                        <button onClick={() => { logoutUser(); navigate('/login'); }} className="w-full flex items-center space-x-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            <i className="fa-solid fa-right-from-bracket"></i>
                            <span className="font-semibold">Sign Out</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-grow flex flex-col overflow-hidden">
                <header className="bg-white h-20 shadow-sm flex items-center justify-between px-10 border-b">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab === 'orders' ? '🔔 Incoming Orders Desk' : `${activeTab} Manager`}</h2>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">Live Sync</span>
                    </div>
                </header>

                <main className="flex-grow p-10 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        
                        {/* LEFT GRID SECTION */}
                        <div className="lg:col-span-8">
                            
                            {/* IF ACTIVE TAB IS ORDERS */}
                            {activeTab === 'orders' ? (
                                <div className="space-y-6">
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                                        <p className="text-sm text-yellow-800 font-medium">
                                            💡 <strong>Notice:</strong> Customer ke order complete karte hi stock quantity automatic real-time deduct ho chuki hai. Kripya niche diye gaye items ko packs karke dispatch ki taiyari karein.
                                        </p>
                                    </div>
                                    
                                    {orders.length === 0 ? (
                                        <div className="bg-white rounded-2xl border p-10 text-center text-gray-400 font-semibold">
                                            Abhi tak koi naya order nahi aaya hai.
                                        </div>
                                    ) : (
                                        orders.map(order => {
                                            const displayCustomerName = order.customer_name || "Buyer Customer";
                                            const displayAddress = order.shipping_address || "No Delivery Address Provided";

                                            return (
                                                <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 h-full w-2 bg-pink-500"></div>
                                                    
                                                    {/* Order Main Header */}
                                                    <div className="flex justify-between items-center mb-4 pl-2 border-b pb-3">
                                                        <div>
                                                            <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-1 rounded">
                                                                Order ID: #{order.id}
                                                            </span>
                                                            <p className="text-xs text-gray-500 font-medium mt-1">
                                                                Customer: <span className="text-slate-800 font-bold">{displayCustomerName}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-bold text-slate-500 uppercase">Total Received Amount</p>
                                                            <p className="text-lg font-black text-pink-600">₹{Number(order.total_amount || 0)}</p>
                                                        </div>
                                                    </div>

                                                    {/* 🔥 MULTI-ITEM ARRAY RENDERING (Sub-items mapping) */}
                                                    <div className="space-y-3 my-4 pl-2">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Products:</p>
                                                        {order.items && order.items.map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                                                <div className="flex items-center space-x-3">
                                                                    {item.product_image ? (
                                                                        <img src={item.product_image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-[9px] text-gray-500">No Img</div>
                                                                    )}
                                                                    <div>
                                                                        <h5 className="text-sm font-black text-slate-800 capitalize">{item.product_name}</h5>
                                                                        <p className="text-xs text-gray-500 font-medium">Unit Price: ₹{item.price}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="bg-pink-100 text-pink-700 text-[11px] font-black px-2.5 py-1 rounded-full">
                                                                        Qty: {item.quantity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Shipping Address Box */}
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 ml-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">📍 Shipping / Delivery Address:</p>
                                                        <p className="text-sm text-slate-700 font-semibold leading-relaxed">{displayAddress}</p>
                                                    </div>

                                                    {/* Order Actions footer */}
                                                    <div className="flex justify-between items-center pt-2 border-t mt-4 ml-2">
                                                        <span className="text-xs bg-green-50 text-green-600 border border-green-200 font-bold px-3 py-1.5 rounded-lg flex items-center">
                                                            <i className="fa-solid fa-circle-check mr-1.5 text-[10px]"></i> Payment Status: {order.status || 'Paid'}
                                                        </span>
                                                        <button onClick={() => toast.info("Transporter logic next stage mein attach hoga! 🚀")} className="bg-slate-900 hover:bg-pink-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm">
                                                            Assign Transporter
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            ) : activeTab === 'products' ? (
                                /* PRODUCTS TABLE VIEW */
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
       

        {/* 📊 Phase 1: Analytics Cards Component */}
        <VendorAnalytics orders={orders} products={products} />

        {/* 📦 Orders Management Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Recent Received Orders</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-center">Action (Change Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-gray-400">
                      Abhi tak koi order nahi mila hai.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">#{order.id}</td>
                      <td className="p-4">{order.customer_name || 'N/A'}</td>
                      <td className="p-4">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {order.items?.length || 0} items
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">₹{order.total_amount}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PROCESSING' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {updatingId === order.id ? (
                          <div className="flex justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          </div>
                        ) : (
                          /* 🛠️ Dropdown Action Menu */
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
                                    <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                                        <h3 className="font-black text-slate-700 uppercase tracking-tight">Catalog Items</h3>
                                    </div>
                                    <table className="w-full">
                                        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b">
                                            <tr><th className="p-4 text-left">Item Info</th><th className="p-4 text-left">Category</th><th className="p-4 text-left">Price</th><th className="p-4 text-left">Stock Status</th><th className="p-4 text-center">Action</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {products.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                                    <td className="p-4 flex items-center space-x-3">
                                                        {p.image ? <img src={p.image} className="w-12 h-12 rounded-lg object-cover" alt="" /> : <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-[10px]">No Img</div>}
                                                        <div><p className="font-bold text-slate-800">{p.name}</p></div>
                                                    </td>
                                                    <td className="p-4 text-slate-600 text-sm font-medium">{p.category_name || 'None'}</td>
                                                    <td className="p-4 font-bold text-pink-600">₹{p.discount_price ? p.discount_price : p.price}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black ${p.stock_qty <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                            {p.stock_qty} UNITS LEFT
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center space-x-2">
                                                        <button onClick={() => handleProdEditClick(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
                                                            <i className="fa-solid fa-pen-to-square mr-1"></i> Update / Qty Fill
                                                        </button>
                                                        <button onClick={() => openDeleteModal(p.id, 'product')} className="text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition">
                                                            <i className="fa-solid fa-trash mr-1"></i> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* CATEGORIES VIEW */
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b">
                                            <tr><th className="p-4 text-left">Category Name</th>
                                            {/* <th className="p-4 text-left">Slug</th> */}
                                            {/* <th className="p-4 text-center">Action</th> */}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {categories.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50 transition">
                                                    <td className="p-4 font-bold text-slate-700">{c.name}</td>
                                                    {/* <td className="p-4 text-slate-400 font-mono text-xs">{c.slug}</td>
                                                    <td className="p-4 text-center space-x-2">
                                                        <button onClick={() => { setEditId(c.id); setIsEditing(true); setCatName(c.name); }} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"><i className="fa-solid fa-pen-to-square mr-1"></i> Update</button>
                                                        <button onClick={() => openDeleteModal(c.id, 'category')} className="text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"><i className="fa-solid fa-trash mr-1"></i> Delete</button>
                                                    </td> */}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* RIGHT GRID SECTION: STICKY MANAGERS */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-10">
                                <h3 className="text-lg font-black text-slate-800 mb-5 flex items-center space-x-2">
                                    <div className="w-2 h-6 bg-pink-500 rounded-full"></div>
                                    <span>{isEditing ? '⚡ UPDATE ENGINE' : '✨ INVENTORY HUB'}</span>
                                </h3>
                                
                                {activeTab === 'categories' ? (
                                    <form onSubmit={handleCatSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">All Category Names </label>
                                            {/* <input type="text" value={catName} onChange={e => setCatName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm outline-none" /> */}
                                        </div>
                                        {/* <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg text-xs tracking-wider uppercase hover:bg-pink-600 transition">Save Category</button> */}
                                    </form>
                                ) : (
                                    /* PRODUCT & STOCK MANAGEMENT FORM */
                                    <form onSubmit={handleProdSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Title*</label>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category*</label>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none">
                                                <option value="">Select Category</option>
                                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">MRP Price*</label>
                                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Offer Price</label>
                                                <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                                            </div>
                                        </div>
                                        
                                        {/* STOCK QUANTITY FIELD */}
                                        <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                                            <label className="block text-xs font-black text-pink-700 uppercase mb-1">📦 Manage Stock Quantity*</label>
                                            <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required className="w-full px-3 py-2 border border-pink-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-800" placeholder="Stock update karein" />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">Customer buy karne par ye auto-decrease hoga. Re-stock karne ke liye yahan badhayein.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
                                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className="w-full px-3 py-2 border rounded-lg text-sm outline-none"></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Image</label>
                                            <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full text-xs text-gray-500" />
                                        </div>
                                        <button type="submit" className="w-full bg-pink-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-pink-700 transition">
                                            {isEditing ? '⚡ Update Product/Stock' : 'Publish Product'}
                                        </button>
                                    </form>
                                )}
                                {isEditing && <button onClick={resetForm} className="w-full mt-3 text-slate-400 text-xs font-bold hover:text-slate-800 block text-center">Cancel</button>}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default VendorDashboard;