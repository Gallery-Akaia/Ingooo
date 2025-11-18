import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Filter, X, Menu, LogOut, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import AdminPasswordModal from "@/components/AdminPasswordModal";
import Cart from "@/components/Cart";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [stockStatus, setStockStatus] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    checkAuth();
    fetchCategories();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      // User not logged in
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      params.append("min_price", priceRange[0]);
      params.append("max_price", priceRange[1]);
      if (stockStatus) params.append("stock_status", stockStatus);
      if (sortBy) params.append("sort_by", sortBy);

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategory, priceRange, stockStatus, sortBy]);

  const handleOrderWhatsApp = (product) => {
    const message = `Hi! I'm interested in ordering: ${product.name} - $${product.price}`;
    const phoneNumber = "96171294697";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 10000]);
    setStockStatus(null);
    setSortBy("newest");
    setSearchQuery("");
  };

  const handleAdminPanelClick = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    window.location.href = '/admin';
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="bg-[#0f0f11] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">I</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="brand-logo">Ingoo</h1>
            </div>

            {/* Store Hours */}
            <div className={`hidden md:flex flex-col items-center border rounded-lg px-6 py-3 transition-all duration-500 ${(() => {
              const now = new Date();
              const currentHour = now.getHours();
              const isSunday = now.getDay() === 0;
              const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
              return isOpen 
                ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20' 
                : 'bg-gradient-to-r from-gray-500/5 to-gray-500/5 border-gray-500/20 opacity-50';
            })()}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const isSunday = now.getDay() === 0;
                  const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                  return isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500';
                })()}`}></div>
                <span className={`text-sm font-semibold ${(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const isSunday = now.getDay() === 0;
                  const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                  return isOpen ? 'text-orange-400' : 'text-gray-400';
                })()}`}>
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const isSunday = now.getDay() === 0;
                    const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return isOpen ? `Store Hours - ${days[now.getDay()]}` : 'CLOSED';
                  })()}
                </span>
              </div>
              <div className="text-xs text-gray-300 text-center">
                <div>{new Date().getDay() === 0 ? '8:00 AM - 2:00 PM' : '8:00 AM - 8:00 PM'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                data-testid="cart-button"
                variant="ghost"
                size="icon"
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-[20px] flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
              <button
                data-testid="admin-panel-button"
                onClick={handleAdminPanelClick}
                className="w-2 h-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 opacity-30 hover:opacity-60"
                aria-label="Admin"
              />
            </div>
          </div>

          {/* Store Hours - Mobile */}
          <div className="md:hidden mt-3 flex justify-center">
            <div className={`flex flex-col items-center border rounded-lg px-4 py-2 transition-all duration-500 ${(() => {
              const now = new Date();
              const currentHour = now.getHours();
              const isSunday = now.getDay() === 0;
              const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
              return isOpen 
                ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20' 
                : 'bg-gradient-to-r from-gray-500/5 to-gray-500/5 border-gray-500/20 opacity-50';
            })()}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const isSunday = now.getDay() === 0;
                  const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                  return isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500';
                })()}`}></div>
                <span className={`text-xs font-semibold ${(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const isSunday = now.getDay() === 0;
                  const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                  return isOpen ? 'text-orange-400' : 'text-gray-400';
                })()}`}>
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const isSunday = now.getDay() === 0;
                    const isOpen = (isSunday && currentHour >= 8 && currentHour < 14) || (!isSunday && currentHour >= 8 && currentHour < 20);
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return isOpen ? days[now.getDay()] : 'CLOSED';
                  })()}
                </span>
              </div>
              <div className="text-xs text-gray-300 text-center">
                <span>{new Date().getDay() === 0 ? '8:00 AM - 2:00 PM' : '8:00 AM - 8:00 PM'}</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="search-bar glass-effect rounded-xl p-2 flex items-center gap-2">
              <Search className="ml-3 text-orange-400" size={22} />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-400"
              />
              {searchQuery && (
                <Button
                  data-testid="clear-search-button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={18} />
                </Button>
              )}
              <Button
                data-testid="filter-toggle-button"
                className="btn-primary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} className="mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-[#0f0f11] border-y border-white/5 py-12" data-testid="categories-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold mb-8">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  data-testid={`category-card-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                >
                  <h4 className="text-lg font-semibold mb-2">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      {showFilters && (
        <section className="bg-[#0f0f11] border-b border-white/5" data-testid="filters-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="space-y-8">
              {/* Price Range */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Price Range</h3>
                  <span className="text-orange-400 font-semibold">${priceRange[0]} - ${priceRange[1]}</span>
                </div>
                <Slider
                  data-testid="price-range-slider"
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="max-w-md"
                />
                <div className="flex items-center gap-4 mt-4 max-w-md">
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-1 block">Min Price</label>
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      step={100}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value)) return;
                        const clampedValue = Math.max(0, Math.min(value, priceRange[1]));
                        setPriceRange([clampedValue, priceRange[1]]);
                      }}
                      className="bg-[#1a1a1c] border-white/10 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-1 block">Max Price</label>
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      step={100}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value)) return;
                        const clampedValue = Math.max(priceRange[0], Math.min(value, 10000));
                        setPriceRange([priceRange[0], clampedValue]);
                      }}
                      className="bg-[#1a1a1c] border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Availability</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    data-testid="stock-all"
                    className={`filter-chip ${!stockStatus ? 'active' : ''}`}
                    onClick={() => setStockStatus(null)}
                  >
                    All Products
                  </button>
                  <button
                    data-testid="stock-in-stock"
                    className={`filter-chip ${stockStatus === 'in_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('in_stock')}
                  >
                    In Stock (10+)
                  </button>
                  <button
                    data-testid="stock-low-stock"
                    className={`filter-chip ${stockStatus === 'low_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('low_stock')}
                  >
                    Low Stock
                  </button>
                  <button
                    data-testid="stock-out-of-stock"
                    className={`filter-chip ${stockStatus === 'out_of_stock' ? 'active' : ''}`}
                    onClick={() => setStockStatus('out_of_stock')}
                  >
                    Out of Stock
                  </button>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sort By</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-64" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters */}
              <Button
                data-testid="reset-filters-button"
                className="btn-secondary"
                onClick={resetFilters}
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="bg-[#0a0a0b] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
              <p className="mt-6 text-gray-400 text-lg">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32" data-testid="no-products-message">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                <X size={40} className="text-orange-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3">No products found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <Button className="btn-primary" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-4xl font-bold mb-2" data-testid="products-heading">
                    {selectedCategory ? selectedCategory : 'All Products'}
                  </h2>
                  <p className="text-gray-400" data-testid="products-count">{products.length} items available</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={() => setSelectedProduct(product)}
                    onOrder={() => handleOrderWhatsApp(product)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrder={() => handleOrderWhatsApp(selectedProduct)}
        />
      )}

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Shopping Cart */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
      </div>
    </CartProvider>
  );
};

export default Home;
