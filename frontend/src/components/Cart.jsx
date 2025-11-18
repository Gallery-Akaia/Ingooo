import { ShoppingCart, Plus, Minus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const Cart = ({ isOpen, onClose }) => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleCheckout = () => {
    // Create WhatsApp message with cart items
    const cartItems = items.map((item, index) => (
      `${index + 1}. ${item.name} - ${item.quantity}x ${formatPrice(item.price)}`
    )).join('\n');

    const message = `Hi! I'd like to order:\n\n${cartItems}\n\nTotal: ${formatPrice(totalPrice)}`;
    const phoneNumber = "96171294697";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#1a1a1d] border-l border-white/10 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <ShoppingCart size={24} className="text-orange-500" />
              <h2 className="text-xl font-semibold text-white">
                Shopping Cart
              </h2>
              {totalItems > 0 && (
                <span className="bg-orange-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <Button
              data-testid="close-cart-button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500 text-sm">
                  Add some products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-[#0a0a0b] rounded-lg border border-white/5"
                    data-testid={`cart-item-${item.id}`}
                  >
                    {/* Product Image */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm mb-1 truncate">
                        {item.name}
                      </h4>
                      <p className="text-orange-500 font-bold">
                        {formatPrice(item.price)}
                      </p>
                      <span className="text-xs text-gray-400">
                        {item.category}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#0a0a0b] rounded-lg border border-white/10">
                        <Button
                          data-testid={`decrease-quantity-${item.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="text-white text-sm font-medium px-2 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          data-testid={`increase-quantity-${item.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        data-testid={`remove-item-${item.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-white/10 p-6 space-y-4">
              {/* Clear Cart Button */}
              <div className="flex justify-between">
                <Button
                  data-testid="clear-cart-button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-gray-400 hover:text-red-400"
                >
                  Clear Cart
                </Button>

                {/* Total */}
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {formatPrice(totalPrice)}
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                data-testid="checkout-button"
                className="w-full btn-primary"
                onClick={handleCheckout}
              >
                <ShoppingCart className="mr-2" size={18} />
                Checkout via WhatsApp
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;