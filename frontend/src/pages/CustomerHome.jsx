// src/pages/CustomerHome.jsx
import React, { useState, useEffect } from 'react';
import { logoutUser, getAuthToken } from '../utils/auth';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { toast } from 'react-toastify';
// 🛒 STEP 1: Cart context hook ko import kiya
import { useCart } from '../context/CartContext'; 

const CustomerHome = () => {
    const navigate = useNavigate();
    const token = getAuthToken();

    // 🛒 STEP 2: Cart context se functions aur counts nikale
    const { addToCart, getCartCount } = useCart();

    // Catalog States
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Checkout Modal States (For Instant Buy Now)
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [buyQty, setBuyQty] = useState(1);
    const [shippingAddress, setShippingAddress] = useState('');

    // Django Media Backend Base URL Handle karne ke liye
    const BACKEND_BASE_URL = 'https://end-to-end-shopping-website.onrender.com';
    // const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

    // Fetch Database Products and Categories
    const loadStoreData = async () => {
        try {
            const [pRes, cRes] = await Promise.all([
                API.get('products/items/'),
                API.get('products/categories/')
            ]);
            
            console.log("Backend Raw Products:", pRes.data);
            console.log("Backend Raw Categories:", cRes.data);

            setProducts(Array.isArray(pRes.data) ? pRes.data : []);
            setCategories(Array.isArray(cRes.data) ? cRes.data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
            toast.error("Shopping catalog load karne mein dikkat aayi!");
        }
    };

    useEffect(() => {
        loadStoreData();
    }, []);

    // SEARCH & CATEGORY FILTER LOGIC
    const filteredProducts = products.filter(p => {
        // 1. Search filter handling
        const productName = (p.name || p.title || "").toLowerCase();
        const matchesSearch = productName.includes(searchQuery.toLowerCase());

        // 2. Category fallback logic
        if (!selectedCategory) return matchesSearch; // Agar koi category select nahi hai, toh direct search return karo

        let productCategoryId = null;
        if (p.category) {
            if (typeof p.category === 'object' && p.category.id) {
                productCategoryId = p.category.id;
            } else {
                productCategoryId = p.category;
            }
        }

        // String ya Number dono ko handle karne ke liye String() mein convert karke match karte hain
        const matchesCategory = productCategoryId 
            ? String(productCategoryId) === String(selectedCategory)
            : false;

        return matchesSearch && matchesCategory;
    });

    // Checkout Popup Open Trigger (For Instant Buy Now)
    const openCheckout = (product) => {
        if (!token) {
            toast.warning("🔒 Order karne ke liye pehle login karein!");
            navigate('/login');
            return;
        }
        if (Number(product.stock_qty || 0) <= 0) {
            toast.error("Yeh product abhi Out of Stock hai!");
            return;
        }
        setActiveProduct(product);
        setBuyQty(1);
        setShowBuyModal(true);
    };

    // Live Order Submission Handler
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress.trim()) {
            toast.warning("Delivery address dalna zaroori hai!");
            return;
        }

        try {
            const orderPayload = {
                product: activeProduct.id,
                quantity: buyQty,
                shipping_address: shippingAddress
            };

            await API.post('products/orders/', orderPayload);
            toast.success("🎉 Order successfully place ho gaya!");
            setShowBuyModal(false);
            setShippingAddress('');
            loadStoreData(); 
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Order fail ho gaya!";
            toast.error(errorMsg);
        }
    };

    // Helper Function: Absolute Image URL builder
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `${BACKEND_BASE_URL}${imagePath}`;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
            
            {/* --- 1. NAVBAR --- */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white sticky top-0 z-40 shadow-md py-3.5 px-4 lg:px-16 flex items-center justify-between backdrop-blur-md bg-opacity-95">
                <div className="flex items-center space-x-6 w-full max-w-4xl">
                    <div className="cursor-pointer group" onClick={() => setSelectedCategory(null)}>
                        <h1 className="text-2xl font-black tracking-tight italic select-none transition-transform group-hover:scale-102">
                            TechKart<span className="text-yellow-400 font-bold not-italic text-[11px] block -mt-1 ml-4 tracking-widest">Plus ✦</span>
                        </h1>
                    </div>
                    <div className="relative flex-grow block max-w-2xl">
                        <input 
                            type="text" 
                            placeholder="Search for premium products, brands and more..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 text-white placeholder-blue-200 text-sm px-5 py-2.5 pr-12 rounded-full border border-white/20 outline-none transition-all focus:bg-white focus:text-slate-900 focus:placeholder-gray-400 focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                        />
                        <div className="absolute right-4 top-3 flex items-center pointer-events-none">
                            <i className="fa-solid fa-magnifying-glass text-blue-200 group-focus-within:text-blue-600 transition-colors"></i>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-6 font-semibold text-sm ml-6 shrink-0">
                    {token ? (
                        <button 
                            onClick={() => { logoutUser(); navigate('/login'); }} 
                            className="bg-white text-blue-600 font-bold px-5 py-2 rounded-full hover:bg-blue-50 active:scale-95 transition-all shadow-sm text-xs uppercase tracking-wider"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link to="/login" className="bg-white text-blue-600 font-bold px-5 py-2 rounded-full hover:bg-blue-50 active:scale-95 transition-all shadow-sm text-xs uppercase tracking-wider">
                            Login
                        </Link>
                    )}
                    <span className="cursor-pointer text-blue-100 hover:text-white transition hidden md:inline text-xs font-medium">Become a Seller</span>
                    
                    {/* 🛒 STEP 3: Cart Icon Layout */}
                    <div 
                        onClick={() => navigate('/cart')} 
                        className="flex items-center space-x-2 cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition relative active:scale-95 border border-white/10"
                    >
                        <div className="relative flex items-center justify-center">
                            <i className="fa-solid fa-cart-shopping text-sm"></i>
                            {getCartCount() > 0 && (
                                <span className="absolute -top-3.5 -right-3 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md border-2 border-indigo-700">
                                    {getCartCount()}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold tracking-wide">Cart</span>
                    </div>
                </div>
            </header>

            {/* --- 2. CATEGORY ICON BAR --- */}
            <div className="bg-white border-b shadow-xs py-4 px-4 flex justify-start md:justify-center items-center space-x-8 overflow-x-auto whitespace-nowrap scrollbar-none">
                <div 
                    onClick={() => setSelectedCategory(null)}
                    className={`flex flex-col items-center justify-center cursor-pointer group text-center shrink-0 transition-all ${!selectedCategory ? 'text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-all shadow-sm border ${!selectedCategory ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-slate-50 border-slate-100'}`}>
                        <i className="fa-solid fa-border-all"></i>
                    </div>
                    <span className="text-xs font-semibold tracking-tight">All Items</span>
                </div>

                {categories.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <div 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex flex-col items-center justify-center cursor-pointer group text-center shrink-0 transition-all ${isSelected ? 'text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-all shadow-sm overflow-hidden border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                                {cat.image ? (
                                    <img 
                                        src={cat.image.startsWith('http') ? cat.image : `${BACKEND_BASE_URL}${cat.image.startsWith('/') ? '' : '/'}${cat.image}`} 
                                        alt={cat.name || "category"} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                ) : null}
                                <i 
                                    className="fa-solid fa-bag-shopping text-blue-500" 
                                    style={{ display: cat.image ? 'none' : 'block' }}
                                ></i>
                            </div>  
                            <span className="text-xs font-semibold capitalize tracking-tight">{cat.name || cat.title}</span>
                        </div>
                    );
                })}
            </div>

            {/* --- 3. PRODUCT GRID CATALOG --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                            {selectedCategory ? "🛒 Filtered Recommendations" : "🔥 Trending Dynamic Products"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Top deals handpicked just for you.</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-3 py-1 rounded-full shadow-2xs">
                        {filteredProducts.length} Items Available
                    </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredProducts.map(product => {
                        const rawPrice = Number(product.price || 0);
                        const rawDiscount = Number(product.discount_price || 0);
                        const hasDiscount = rawDiscount > 0 && rawDiscount < rawPrice;
                        const currentPrice = hasDiscount ? rawDiscount : rawPrice;
                        
                        const discountPercent = hasDiscount 
                            ? Math.round(((rawPrice - rawDiscount) / rawPrice) * 100)
                            : 0;
                        const isOutOfStock = Number(product.stock_qty || 0) <= 0;

                        return (
                            <div 
                                key={product.id} 
                                className={`bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 flex flex-col justify-between group relative ${isOutOfStock ? 'opacity-75' : ''}`}
                            >
                                {/* Badges (Top Left Stack) */}
                                <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1">
                                    {isOutOfStock ? (
                                        <span className="bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">Out Of Stock</span>
                                    ) : hasDiscount ? (
                                        <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md tracking-wider shadow-sm">{discountPercent}% OFF</span>
                                    ) : null}
                                </div>

                                {/* Image Container */}
                                <div className="w-full aspect-square bg-slate-50/50 rounded-xl overflow-hidden relative mb-4 flex items-center justify-center p-2 border border-slate-50 group-hover:bg-slate-50 transition-colors">
                                    {product.image ? (
                                        <img 
                                            src={getImageUrl(product.image)} 
                                            alt={product.name} 
                                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-all duration-300 transform" 
                                        />
                                    ) : (
                                        <i className="fa-regular fa-image text-4xl text-slate-200"></i>
                                    )}
                                </div>

                                {/* Text Metadata */}
                                <div className="flex-grow flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {product.name || product.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 line-clamp-2 my-1.5 min-h-[2rem]">
                                            {product.description || "Premium Quality guaranteed by verified hub distributors."}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-2">
                                        <div className="flex items-baseline space-x-2">
                                            <span className="text-lg font-black text-slate-900">₹{currentPrice.toLocaleString('en-IN')}</span>
                                            {hasDiscount && (
                                                <span className="text-xs line-through text-slate-400 font-medium">₹{rawPrice.toLocaleString('en-IN')}</span>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center mb-3">
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">✓ Assured</span>
                                            <span className={`text-[10px] font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {isOutOfStock ? 'No Stock' : `Stock: ${product.stock_qty}`}
                                            </span>
                                        </div>

                                        {/* 🛒 STEP 4: Double Button Actions Buttons updated */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button 
                                                disabled={isOutOfStock}
                                                onClick={() => {
                                                    addToCart(product);
                                                    toast.success("Item cart mein add ho gaya! 🛒");
                                                }}
                                                className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold py-2 px-1 rounded-xl uppercase tracking-wider transition active:scale-95 shadow-xs"
                                            >
                                                Add Cart
                                            </button>
                                            <button 
                                                disabled={isOutOfStock}
                                                onClick={() => openCheckout(product)}
                                                className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold py-2 px-1 rounded-xl uppercase tracking-wider transition active:scale-95 shadow-xs"
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Fallback View */}
                {filteredProducts.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-xs max-w-md mx-auto mt-12 p-8">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <i className="fa-solid fa-box-open text-2xl"></i>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">No Match Found</h4>
                        <p className="text-xs text-slate-400 mt-1">Aapki search query ya select ki hui category se koi item match nahi hua! Sabhi items dekhne ke liye filter clear karein.</p>
                    </div>
                )}
            </main>

            {/* --- 4. CHECKOUT MODAL (Instant Buy) --- */}
            {showBuyModal && activeProduct && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-transform animate-scale-up">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4.5 flex justify-between items-center">
                            <h4 className="font-extrabold text-xs tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-shield-halved text-sm text-yellow-400"></i> SECURE CHECKOUT
                            </h4>
                            <button onClick={() => setShowBuyModal(false)} className="text-white/80 hover:text-white text-xl transition-colors p-1 rounded-lg hover:bg-white/10 flex items-center justify-center">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <form onSubmit={handlePlaceOrder} className="p-5 space-y-5">
                            <div className="flex items-center space-x-4 bg-slate-50 p-3 border border-slate-100 rounded-xl">
                                {activeProduct.image && (
                                    <div className="w-14 h-14 shrink-0 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center">
                                        <img src={getImageUrl(activeProduct.image)} className="max-h-full max-w-full object-contain" alt="" />
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <h5 className="font-bold text-slate-800 text-sm truncate">{activeProduct.name || activeProduct.title}</h5>
                                    <p className="text-xs text-slate-500 mt-0.5">Price Rate: <strong className="text-slate-800">₹{(activeProduct.discount_price || activeProduct.price).toLocaleString('en-IN')}</strong></p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Order Quantity</label>
                                <div className="flex items-center space-x-3">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={activeProduct.stock_qty}
                                        value={buyQty} 
                                        onChange={(e) => setBuyQty(Math.min(activeProduct.stock_qty, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-20 px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                                    />
                                    <span className="text-xs text-slate-400 font-medium">Available Inventory: {activeProduct.stock_qty} units</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">📍 Delivery Address*</label>
                                <textarea 
                                    rows="3" 
                                    required
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Type your complete doorstep shipping details here..."
                                    className="w-full px-3 py-2.5 border border-slate-200 text-xs rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-slate-400 resize-none"
                                ></textarea>
                            </div>

                            <div className="bg-orange-50/70 border border-orange-100 p-3.5 rounded-xl flex justify-between items-center shadow-xs">
                                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Total Payable Amount:</span>
                                <span className="text-xl font-black text-slate-900">
                                    ₹{((activeProduct.discount_price || activeProduct.price) * buyQty).toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button type="button" onClick={() => setShowBuyModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition">Cancel</button>
                                <button type="submit" disabled={isOutOfStock}
                                                onClick={() => {
                                                    addToCart(product);
                                                    toast.success("Item cart mein add ho gaya! 🛒");
                                                }} className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition shadow-md shadow-orange-500/20 active:scale-98">Confirm & Buy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerHome;