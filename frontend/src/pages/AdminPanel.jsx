import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Plus, Pencil, Trash2, Package, FolderOpen, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AdminPasswordModal from "@/components/AdminPasswordModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    stock: ""
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check if password is already verified in this session
    const verified = sessionStorage.getItem("admin_password_verified") === "true";
    
    if (verified) {
      // Password verified, allow access without OAuth
      setIsPasswordVerified(true);
      setLoading(false);
      fetchProducts();
      fetchCategories();
      return;
    }

    // Show password modal
    setShowPasswordModal(true);
    setLoading(false);
  };
  
  const handlePasswordSuccess = () => {
    setIsPasswordVerified(true);
    setShowPasswordModal(false);
    fetchProducts();
    fetchCategories();
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`, { withCredentials: true });
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`, { withCredentials: true });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProductForm({ ...productForm, imageUrl: response.data.url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-Admin-Password': '8890' };
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, {
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        }, { withCredentials: true, headers });
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, {
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock)
        }, { withCredentials: true, headers });
        toast.success("Product created successfully");
      }
      setOpenProductDialog(false);
      setEditingProduct(null);
      setProductForm({ name: "", description: "", price: "", category: "", imageUrl: "", stock: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 'X-Admin-Password': '8890' };
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, categoryForm, { 
          withCredentials: true,
          headers
        });
        toast.success("Category updated successfully");
      } else {
        await axios.post(`${API}/categories`, categoryForm, { 
          withCredentials: true,
          headers
        });
        toast.success("Category created successfully");
      }
      setOpenCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const headers = { 'X-Admin-Password': '8890' };
      await axios.delete(`${API}/products/${id}`, { withCredentials: true, headers });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const headers = { 'X-Admin-Password': '8890' };
      await axios.delete(`${API}/categories/${id}`, { 
        withCredentials: true,
        headers
      });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleToggleAdmin = async (userEmail, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${userEmail}`, {
        email: userEmail,
        is_admin: !currentStatus
      }, { withCredentials: true });
      toast.success("Admin status updated");
      fetchUsers();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error(error.response?.data?.detail || "Failed to update admin status");
    }
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock.toString()
    });
    setOpenProductDialog(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description
    });
    setOpenCategoryDialog(true);
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className="mt-6 text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show password modal if not verified yet
  if (!isPasswordVerified && currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <AdminPasswordModal
          isOpen={showPasswordModal}
          onClose={handleBackToHome}
          onSuccess={handlePasswordSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <div className="bg-[#0f0f11] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                data-testid="back-to-home-button"
                className="btn-secondary"
                onClick={() => window.location.href = '/'}
              >
                <ArrowLeft className="mr-2" size={20} />
                Back to Store
              </Button>
              <div>
                <h1 className="text-3xl font-bold" data-testid="admin-panel-title">Admin Panel</h1>
                {currentUser && (
                  <p className="text-sm text-gray-400 mt-1">
                    {currentUser.is_owner ? 'Owner' : 'Admin'} • {currentUser.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
            <TabsTrigger value="products" data-testid="products-tab">
              <Package className="mr-2" size={18} />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="categories-tab">
              <FolderOpen className="mr-2" size={18} />
              Categories
            </TabsTrigger>
            {currentUser?.is_owner && (
              <TabsTrigger value="admins" data-testid="admins-tab">
                <Users className="mr-2" size={18} />
                Admin Access
              </TabsTrigger>
            )}
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Products</h2>
              <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-product-button"
                    className="btn-primary"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: "", description: "", price: "", category: "", imageUrl: "", stock: "" });
                    }}
                  >
                    <Plus className="mr-2" size={20} />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-[#1a1a1d] border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        data-testid="product-name-input"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        data-testid="product-description-input"
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          data-testid="product-price-input"
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          data-testid="product-stock-input"
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        data-testid="product-category-input"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-white/10 bg-[#0f0f11] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name} className="bg-[#1a1a1d] text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="imageUrl">Product Image</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="flex-1"
                          />
                          {uploadingImage && <span className="text-sm text-gray-500">Uploading...</span>}
                        </div>
                        {!productForm.imageUrl && (
                          <Input
                            id="imageUrl"
                            data-testid="product-image-input"
                            placeholder="Or paste image URL directly"
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            required
                          />
                        )}
                        {productForm.imageUrl && (
                          <div className="space-y-2">
                            <img 
                              src={productForm.imageUrl} 
                              alt="Preview" 
                              className="w-32 h-32 object-cover rounded border"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <p className="text-sm text-gray-400">Image uploaded successfully</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button type="submit" data-testid="save-product-button" className="w-full btn-primary">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <div key={product.id} className="admin-card flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{product.description.substring(0, 100)}...</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-orange-400 font-bold text-lg">${product.price}</span>
                        <span className="category-badge">{product.category}</span>
                        <span className="text-sm text-gray-400">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      data-testid={`edit-product-${product.id}`}
                      variant="outline"
                      size="icon"
                      onClick={() => openEditProduct(product)}
                    >
                      <Pencil size={18} />
                    </Button>
                    <Button
                      data-testid={`delete-product-${product.id}`}
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Manage Categories</h2>
              <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="add-category-button"
                    className="btn-primary"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", description: "" });
                    }}
                  >
                    <Plus className="mr-2" size={20} />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-[#1a1a1d] border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cat-name">Category Name</Label>
                      <Input
                        id="cat-name"
                        data-testid="category-name-input"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cat-description">Description</Label>
                      <Textarea
                        id="cat-description"
                        data-testid="category-description-input"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" data-testid="save-category-button" className="w-full btn-primary">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="admin-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl mb-2">{category.name}</h3>
                      <p className="text-gray-400 text-sm">{category.description || 'No description'}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        data-testid={`edit-category-${category.id}`}
                        variant="outline"
                        size="icon"
                        onClick={() => openEditCategory(category)}
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        data-testid={`delete-category-${category.id}`}
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Admin Access Tab (Owner Only) */}
          {currentUser?.is_owner && (
            <TabsContent value="admins">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Manage Admin Access</h2>
                <p className="text-gray-400">Control who can access the admin panel</p>
              </div>

              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="admin-card flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-400">{user.email}</p>
                        {user.is_owner && (
                          <span className="inline-flex items-center text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded mt-1">
                            <Shield size={12} className="mr-1" />
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Label htmlFor={`admin-${user.id}`} className="text-sm">
                        Admin Access
                      </Label>
                      <Switch
                        id={`admin-${user.id}`}
                        data-testid={`admin-toggle-${user.email}`}
                        checked={user.is_admin}
                        onCheckedChange={() => handleToggleAdmin(user.email, user.is_admin)}
                        disabled={user.is_owner}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
