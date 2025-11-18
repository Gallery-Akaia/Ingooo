import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductModal = ({ product, onClose, onOrder }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="product-modal"
    >
      <div
        className="glass-effect rounded-2xl max-w-4xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Button
            data-testid="close-modal-button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70"
            onClick={onClose}
          >
            <X size={24} />
          </Button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div className="rounded-xl overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="category-badge mb-4 inline-block">{product.category}</span>
                <h2 className="text-3xl font-bold mb-4" data-testid="modal-product-name">{product.name}</h2>
                <p className="text-gray-300 mb-6 leading-relaxed" data-testid="modal-product-description">
                  {product.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-3xl font-bold text-orange-500" data-testid="modal-product-price">
                      ${product.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Availability:</span>
                    <span className={product.stock > 0 ? 'text-green-500' : 'text-red-500'} data-testid="modal-product-stock">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                data-testid="modal-order-button"
                className="w-full btn-primary py-6 text-lg"
                onClick={() => {
                  onOrder();
                  onClose();
                }}
                disabled={product.stock === 0}
              >
                <ShoppingCart size={24} className="mr-3" />
                Order via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
