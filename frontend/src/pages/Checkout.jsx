// src/pages/Checkout.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getAuthToken } from '../utils/auth';
import API from '../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const token = getAuthToken();
    const navigate = useNavigate();

    const handlePayment = async () => {
        if (!address.trim()) {
            toast.warning("📍 Delivery address dalna zaroori hai!");
            return;
        }

        setLoading(true);
        try {
           
            const orderRes = await API.post('products/create-razorpay-order/', {
                amount: getCartTotal(),
                address: address,
                items: cartItems // Cart ke items backend models ke liye
            });
            
            const orderData = orderRes.data; 

            
            const options = {
                // Aapki real dashboard test key (.trim() lagakar extra spaces clear kiye hain)
                key: "rzp_test_SqjSwSJGJb12E9".trim(), 
                amount: orderData.amount,      // Paise me (Django automatic bheja hai)
                currency: orderData.currency,  // INR
                name: "Meesho Clone",
                description: "Cart Products Purchase",
                order_id: orderData.razorpay_order_id, // 🔥 Real Razorpay Order ID from Django
                
                handler: async function (rzpResponse) {
                    
                    try {
                        const verifyPayload = {
                            razorpay_order_id: orderData.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature: rzpResponse.razorpay_signature
                        };

                        const verifyRes = await API.post('products/verify-payment/', verifyPayload);
                        
                        if (verifyRes.status === 200) {
                            toast.success("🎉 Order successfully place!");
                            clearCart();      // LocalStorage aur Context clear karo
                            navigate('/home'); // User ko home page bhej do
                        }
                    } catch (err) {
                        console.error("Verification Fail Error:", err);
                        toast.error(err.response?.data?.error || "Payment verify nahi ho payi backend par!");
                    }
                },
                prefill: {
                    name: "Customer Test",
                    email: "customer@example.com",
                },
                theme: {
                    color: "#fb641b", // Orange Theme match with button
                },
                modal: {
                    ondismiss: function() {
                        toast.info("👋 Aapne payment cancel kar di!");
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            
            // Agar processing ke dauran kuch problem aaye toh handle karega
            rzp.on('payment.failed', function (response){
                console.error("Razorpay SDK Error:", response.error);
                toast.error(`❌ Payment Failed: ${response.error.description}`);
                setLoading(false);
            });

            rzp.open();

        } catch (error) {
            console.error("Checkout Error:", error);
            const backendError = error.response?.data?.error || "Checkout process mein error aayi!";
            toast.error(backendError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white p-6 rounded-sm shadow-sm border">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-3 mb-4">🔒 Secure Checkout</h2>
                
                {/* Address Box */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Delivery Address</label>
                    <textarea 
                        rows="3"
                        className="w-full p-2 border rounded-sm text-sm outline-none focus:border-blue-500"
                        placeholder="Apna poora address yahan enter karein..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-slate-50 border rounded-sm mb-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-500">Total Unique Items:</span>
                        <span className="font-bold text-slate-800">{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-base font-bold border-t pt-2 text-slate-950">
                        <span>Total Payable Amount:</span>
                        <span>₹{getCartTotal()}</span>
                    </div>
                </div>

                {/* Pay Button */}
                <button 
                    onClick={handlePayment}
                    disabled={loading || cartItems.length === 0}
                    className="w-full bg-[#fb641b] text-white font-black py-3 rounded-sm uppercase tracking-wider text-sm shadow-md hover:bg-orange-600 transition disabled:bg-gray-300"
                >
                    {loading ? "Processing..." : `Pay Now ₹${getCartTotal()}`}
                </button>
            </div>
        </div>
    );
};

export default Checkout;