// src/pages/HomeFeed.jsx
import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';

const HomeFeed = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Checkout Modal States
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [buyQty, setBuyQty] = useState(1);
    const [shippingAddress, setShippingAddress] = useState('');

    const loadStoreData = async () => {
        try {
            const [pRes, cRes] = await Promise.all([
                API.get('products/items/'),
                API.get('products/categories/')
            ]);
            setProducts(pRes.data);
            setCategories(cRes.data);
        } catch (err) {
            toast.error("Shopping catalog load karne mein dikkat aayi!");
        }
    };

    useEffect(() => {
        loadStoreData();
    }, []);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch && p.stock_qty > 0; // Sirf in-stock items dikhao
    });

    // Handle Checkout Open
    const openCheckout = (product) => {
        setActiveProduct(product);
        setBuyQty(1);
        setShowBuyModal(true);
    };

    // Live Order Post Trigger
    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress.trim()) {
            toast.warning("Kshama karein, delivery address zaroori hai!");
            return;
        }

        try {
            const orderPayload = {
                product: activeProduct.id,
                quantity: buyQty,
                shipping_address: shippingAddress
            };

            await API.post('products/orders/', orderPayload);
            toast.success("🎉 Order Placed Successfully! Vendor ko alert bhej diya gaya hai.", {
                position: "top-center"
            });
            
            setShowBuyModal(false);
            setShippingAddress('');
            loadStoreData(); // Refresh product inventory instantly
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Order fail ho gaya!";
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased">
            
            {/* --- 1. FLIPKART BLUE HEADER / NAVBAR --- */}
            <header className="bg-[#2874f0] text-white sticky top-0 z-40 shadow-md py-3 px-4 lg:px-24 flex items-center justify-between">
                <div className="flex items-center space-x-8 w-full max-w-4xl">
                    {/* Brand Logo */}
                    <div className="cursor-pointer" onClick={() => setSelectedCategory(null)}>
                        <h1 className="text-xl font-black tracking-tight italic select-none">
                            Flipkart<span className="text-[#ffe500] font-bold not-italic text-xs block -mt-1 ml-4">Plus ✦</span>
                        </h1>
                    </div>
                    {/* Flipkart Wide Search Bar */}
                    <div className="relative flex-grow max-w-xl hidden md:block">
                        <input 
                            type="text" 
                            placeholder="Search for products, brands and more"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white text-slate-800 text-sm px-4 py-2 pr-10 rounded-sm shadow-sm outline-none placeholder-gray-400 focus:ring-1 focus:ring-blue-300"
                        />
                        <i className="fa-solid fa-magnifying-glass text-blue-600 absolute right-3 top-3 text-sm cursor-pointer"></i>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-8 font-bold text-sm">
                    <button className="bg-white text-[#2874f0] font-semibold px-8 py-1 rounded-sm hover:bg-gray-50 transition shadow-sm">
                        Login
                    </button>
                    <span className="cursor-pointer hover:text-gray-100 hidden sm:inline">Become a Seller</span>
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-100">
                        <i className="fa-solid fa-cart-shopping text-base"></i>
                        <span>Cart</span>
                    </div>
                </div>
            </header>

            {/* --- 2. FLIPKART CATEGORY STRIPE (HORIZONTAL ROW) --- */}
            <div className="bg-white border-b shadow-sm py-3 px-4 flex justify-start md:justify-center items-center space-x-8 lg:space-x-12 overflow-x-auto whitespace-nowrap">
                <div 
                    onClick={() => setSelectedCategory(null)}
                    className={`flex flex-col items-center justify-center cursor-pointer group text-center ${!selectedCategory ? 'text-blue-600' : 'text-slate-700'}`}
                >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg mb-1 group-hover:scale-105 transition shadow-inner">
                        <i className="fa-solid fa-border-all"></i>
                    </div>
                    <span className="text-xs font-bold tracking-tight">All Items</span>
                </div>

                {categories.map(cat => (
                    <div 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center cursor-pointer group text-center ${selectedCategory === cat.id ? 'text-blue-600' : 'text-slate-700'}`}
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-1 group-hover:scale-105 transition shadow-inner">
                            <i className="fa-solid fa-bag-shopping"></i>
                        </div>
                        <span className="text-xs font-bold tracking-tight capitalize">{cat.name}</span>
                    </div>
                ))}
            </div>

            {/* --- 3. HERO SALE BANNER DISPLAY --- */}
            <div className="max-w-7xl mx-auto mt-4 px-2 md:px-4">
                <div className="bg-gradient-to-r from-blue-700 to-cyan-500 rounded-sm text-white p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute right-10 top-0 bottom-0 opacity-10 hidden md:flex items-center text-[150px]">
                        <i className="fa-solid fa-percent"></i>
                    </div>
                    <span className="bg-yellow-400 text-slate-900 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm w-max mb-2">
                        BIG BACHAT DHAMAKA ⚡
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">Top Offers & Fashion Steals</h2>
                    <p className="text-sm text-blue-100 mt-1">Get up to 70% off on premium catalog elements. Free shipping over India.</p>
                </div>
            </div>

            {/* --- 4. FLIPKART STYLE CARD GRID VIEW --- */}
            <main className="max-w-7xl mx-auto px-2 md:px-4 py-6">
                <div className="bg-white p-4 md:p-6 rounded-sm shadow-sm border border-gray-200">
                    <div className="border-b pb-4 mb-5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                            {selectedCategory ? "Filtered Recommendations" : "Top Deals of the Day"}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-sm">
                            {filteredProducts.length} Items Available
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                        {filteredProducts.map(product => {
                            // Calculate discount percentage automatically
                            const hasDiscount = !!product.discount_price;
                            const currentPrice = hasDiscount ? product.discount_price : product.price;
                            const discountPercent = hasDiscount 
                                ? Math.round(((product.price - product.discount_price) / product.price) * 100)
                                : 0;

                            return (
                                <div 
                                    key={product.id} 
                                    className="bg-white border rounded-sm hover:shadow-xl transition-shadow p-3 flex flex-col justify-between group relative cursor-pointer"
                                    onClick={() => openCheckout(product)}
                                >
                                    {/* Image Section */}
                                    <div className="w-full aspect-square bg-slate-50 rounded-sm overflow-hidden relative mb-3 flex items-center justify-center border-b pb-2">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-102 transition duration-200" />
                                        ) : (
                                            <i className="fa-regular fa-image text-4xl text-gray-300"></i>
                                        )}
                                        {hasDiscount && (
                                            <span className="absolute top-1 left-1 bg-green-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                                                {discountPercent}% OFF
                                            </span>
                                        )}
                                    </div>

                                    {/* Info Block */}
                                    <div className="flex-grow flex flex-col justify-end">
                                        <h4 className="text-sm font-bold text-slate-800 truncate leading-snug group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h4>
                                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5 mb-2">{product.description || "No description provided."}</p>
                                        
                                        {/* Pricing Block */}
                                        <div className="flex items-baseline space-x-2">
                                            <span className="text-base font-black text-slate-900">₹{currentPrice}</span>
                                            {hasDiscount && (
                                                <span className="text-xs line-through text-gray-400">₹{product.price}</span>
                                            )}
                                        </div>

                                        {/* Stock / Fast Shipping Info */}
                                        <div className="mt-2 pt-2 border-t border-dashed flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-1.5 py-0.5 rounded-sm">
                                                ✓ Assured Delivery
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                Stock: {product.stock_qty}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {filteredProducts.length === 0 && (
                        <div className="py-20 text-center text-gray-400">
                            <i className="fa-solid fa-magnifying-glass-minus text-4xl mb-3 block text-gray-300"></i>
                            Kshama karein, is category mein abhi koi stock available nahi hai.
                        </div>
                    )}
                </div>
            </main>

            {/* --- 5. CENTER POPUP MODAL FOR FLIPKART STYLE BUY NOW / CHECKOUT --- */}
            {showBuyModal && activeProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm max-w-lg w-full shadow-2xl border border-gray-300 animate-in zoom-in duration-150 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-[#2874f0] text-white p-4 flex justify-between items-center">
                            <h4 className="font-bold text-sm tracking-wide">📦 FLIPKART SECURE CHECKOUT</h4>
                            <button onClick={() => setShowBuyModal(false)} className="text-white hover:text-gray-200 text-lg">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handlePlaceOrder} className="p-6 space-y-5">
                            <div className="flex items-center space-x-4 bg-slate-50 p-3 border rounded-sm">
                                {activeProduct.image && <img src={activeProduct.image} className="w-16 h-16 object-contain border bg-white p-1 rounded-sm" alt="" />}
                                <div>
                                    <h5 className="font-bold text-slate-800 text-sm">{activeProduct.name}</h5>
                                    <p className="text-xs text-gray-500">Price Per Item: <strong>₹{activeProduct.discount_price || activeProduct.price}</strong></p>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Order Quantity</label>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={activeProduct.stock_qty}
                                        value={buyQty} 
                                        onChange={(e) => setBuyQty(Math.min(activeProduct.stock_qty, Math.max(1, int(e.target.value) || 1)))}
                                        className="w-20 px-3 py-1.5 border border-gray-300 rounded-sm text-sm font-bold text-center outline-none focus:border-blue-500"
                                    />
                                    <span className="text-xs text-gray-400 italic">Max available: {activeProduct.stock_qty} units</span>
                                </div>
                            </div>

                            {/* Shipping Address Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">📍 Enter Complete Shipping Address*</label>
                                <textarea 
                                    rows="3" 
                                    required
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="House No, Street Name, Area, City, State, Pincode..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-300"
                                ></textarea>
                            </div>

                            {/* Bill Calculation Summary Box */}
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-sm flex justify-between items-center text-slate-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Total Payable Amount:</span>
                                <span className="text-xl font-black text-slate-900">
                                    ₹{(activeProduct.discount_price || activeProduct.price) * buyQty}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowBuyModal(false)} 
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-2.5 rounded-sm text-sm transition text-center"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-[#fb641b] hover:bg-[#f2570c] text-white font-black py-2.5 rounded-sm text-sm tracking-wide transition shadow-md shadow-orange-100 uppercase"
                                >
                                    Confirm & Place Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeFeed;