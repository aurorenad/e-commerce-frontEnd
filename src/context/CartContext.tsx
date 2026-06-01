import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Device, CartItem, ToastState } from './type';
import { CartContext } from './type';
import { useAuth } from './AuthContext';
import * as marketplaceApi from '../services/marketplace.service';
import { mapApiListingToListing, mapListingToCartDevice } from '../lib/mappers';
import type { ApiListing } from '../lib/mappers';
import { getErrorMessage } from '../lib/api';

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('jaribu_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('jaribu_cart', JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  const triggerToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const syncCartFromServer = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { cart: serverCart } = await marketplaceApi.fetchCart();
      const items: CartItem[] = (serverCart?.items || []).map((item) => {
        const d = item.device as ApiListing['device'] & { price: number };
        const listing = mapApiListingToListing({
          id: `cart-${item.deviceId}`,
          deviceId: item.deviceId,
          title: `${d.brand} ${d.model}`,
          description: '',
          price: d.price,
          device: d,
        });
        return { ...mapListingToCartDevice(listing), quantity: item.quantity };
      });
      setCart(items);
    } catch {
      // keep local cart on failure
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void syncCartFromServer();
    }
  }, [isAuthenticated, syncCartFromServer]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.current_price * item.quantity, 0);

  const addToCart = async (device: Device) => {
    if (isAuthenticated) {
      try {
        await marketplaceApi.addToCart(device.deviceId);
        await syncCartFromServer();
        triggerToast(`"${device.title}" added to cart!`);
        return;
      } catch (err) {
        triggerToast(getErrorMessage(err));
        return;
      }
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.deviceId === device.deviceId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.deviceId === device.deviceId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prevCart, { ...device, quantity: 1 }];
    });
    triggerToast(`"${device.title}" added to cart!`);
  };

  const removeFromCart = async (deviceId: string) => {
    if (isAuthenticated) {
      try {
        await marketplaceApi.removeFromCart(deviceId);
        await syncCartFromServer();
      } catch {
        setCart((prev) => prev.filter((item) => item.deviceId !== deviceId));
      }
      return;
    }
    setCart((prev) => prev.filter((item) => item.deviceId !== deviceId));
  };

  const updateQuantity = (deviceId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.deviceId === deviceId) {
          const nextQty = item.quantity + delta;
          return nextQty >= 1 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      }),
    );
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await marketplaceApi.clearCart();
      } catch {
        // ignore
      }
    }
    setCart([]);
    localStorage.removeItem('jaribu_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        toast,
        triggerToast,
        clearCart,
        syncCartFromServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
