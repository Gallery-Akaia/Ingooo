import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const ProductCard = ({ product, onViewDetails, onOrder }) => {
  const { addToCart } = useCart();
  return (
    <div
      className="product-card glass-effect rounded-xl overflow-hidden group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <span className="category-badge">{product.category}</span>
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-4 left-4">
            <span className="bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Low Stock
            </span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-xl">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-orange-500" data-testid={`product-price-${product.id}`}>
            ${product.price}
          </span>
          <span className="text-sm text-gray-400">Stock: {product.stock}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            data-testid={`view-details-${product.id}`}
            variant="outline"
            className="border-white/20 hover:bg-white/10"
            onClick={onViewDetails}
          >
            <Eye size={18} className="mr-2" />
            Details
          </Button>
          <Button
            data-testid={`order-button-${product.id}`}
            variant="outline"
            className="border-white/20 hover:bg-white/10"
            onClick={onOrder}
            disabled={product.stock === 0}
          >
            Order
          </Button>
          <Button
            data-testid={`add-to-cart-${product.id}`}
            className="col-span-2 btn-primary"
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
          >
            <ShoppingCart size={18} className="mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
