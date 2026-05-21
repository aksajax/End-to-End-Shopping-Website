import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // ✅ Import Fixed!

const Cart = () => {
    const { cartItems, getCartCount, addToCart, removeFromCart, clearItemFromCart, getCartTotal } = useCart();
    const navigate = useNavigate();

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-sm shadow-sm border">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-xl font-bold text-slate-800">🛒 Aapka Cart ({getCartCount()} Items)</h2>
            <button 
              onClick={() => navigate('/home')} 
              className="bg-[#2874f0] text-white text-xs font-bold px-4 py-2 rounded-sm hover:bg-blue-600 transition"
            >
              Continue Shopping
            </button>
          </div>

          {/* Cart Items List */}
          {(!cartItems || cartItems.length === 0) ? (
            <div className="text-center py-10 text-gray-500">
              Aapka cart khali hai bhai! Thoda saamaan add karo.
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const itemPrice = item.discount_price || item.price;
                return (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center space-x-4">
                      {item.image && (
                        <img 
                          src={item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`} 
                          className="w-16 h-16 object-contain border bg-white p-1 rounded-sm" 
                          alt={item.name} 
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.name || item.title}</h4>
                        <p className="text-xs text-gray-500 my-0.5">Price: ₹{itemPrice}</p>
                        <p className="text-xs text-slate-900 font-bold">Subtotal: ₹{itemPrice * item.quantity}</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="bg-gray-200 text-slate-800 px-2 py-0.5 rounded-sm font-bold text-sm hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-gray-200 text-slate-800 px-2 py-0.5 rounded-sm font-bold text-sm hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => clearItemFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 ml-4 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total Box */}
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-sm flex justify-between items-center">
                <span className="font-bold text-orange-800 text-sm">Total Payable Amount:</span>
                <span className="text-xl font-black text-slate-900">₹{getCartTotal()}</span>
              </div>

              {/* Checkout Button */}
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => {
                    navigate('/checkout');
                    toast.info("Proceeding to Checkout 🔥");
                  }}
                  className="bg-[#fb641b] text-white font-black px-6 py-2.5 text-xs uppercase tracking-wider rounded-sm shadow-md hover:bg-orange-600 transition"
                >
                  Proceed to Checkout
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    );
};

export default Cart;