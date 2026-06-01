import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useNavigate } from 'react-router-dom';

export default function CartSidebar() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 backdrop-blur-xs ${
          isCartOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide Out Panel Sheet */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='p-5 border-b border-gray-100 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ShoppingBag size={20} className='text-[#127058]' />
            <h3 className='font-black text-gray-950 text-lg'>
              Your Shopping Cart
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className='p-2 text-gray-400 hover:text-gray-950 hover:bg-gray-100 rounded-xl transition-all'
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Rows */}
        <div className='flex-grow overflow-y-auto p-5 space-y-4'>
          {cart.length === 0 ? (
            <div className='h-full flex flex-col items-center justify-center text-center text-gray-400 p-6'>
              <ShoppingBag size={48} className='text-gray-200 mb-3' />
              <p className='font-medium text-sm'>
                Your shopping cart is empty.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className='flex gap-4 p-3 border border-gray-100 rounded-2xl bg-white relative group shadow-xs'
              >
                <div className='w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1'>
                  <img
                    src={item.img}
                    alt={item.title}
                    className='object-contain w-full h-full'
                  />
                </div>

                <div className='flex flex-col justify-between py-0.5 flex-grow pr-6'>
                  <div>
                    <h4 className='font-bold text-gray-900 text-sm line-clamp-1'>
                      {item.title}
                    </h4>
                    <span className='text-[10px] text-gray-400 font-bold capitalize'>
                      {item.category}
                    </span>
                  </div>

                  <div className='flex items-center justify-between mt-2'>
                    <span className='text-sm font-extrabold text-gray-950'>
                      ${item.current_price}
                    </span>

                    {/* 🟢 Quantity Modifier Buttons */}
                    <div className='flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl p-1 ml-auto'>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className='p-1 text-gray-500 hover:text-gray-950 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all'
                        aria-label='Decrease quantity'
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </button>
                      <span className='text-xs font-bold text-gray-950 min-w-[14px] text-center select-none'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className='p-1 text-gray-500 hover:text-gray-950 hover:bg-white rounded-md transition-all'
                        aria-label='Increase quantity'
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.deviceId)}
                  className='absolute right-3 top-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                  aria-label='Delete item'
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className='p-5 border-t border-gray-100 bg-gray-50/50 rounded-t-3xl'>
            <div className='flex items-center justify-between mb-4'>
              <span className='text-sm font-semibold text-gray-500'>
                Order Total Amount:
              </span>
              <span className='text-xl font-black text-gray-950'>
                ${cartTotal}
              </span>
            </div>
            <button
              onClick={() => {
                setIsCartOpen(false); // close sidebar
                navigate('/checkout'); // route to checkout
              }}
              className='w-full bg-[#127058] hover:bg-[#0e5845] text-white font-bold py-3.5 px-4 rounded-xl transition-colors text-sm shadow-sm flex items-center justify-center gap-2'
            >
              Proceed to Secure Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
