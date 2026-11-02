import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CategoryModal from '../components/CategoryModal';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';

export default function CategoryDetail() {
    const { id, brand: urlBrand } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);

    useEffect(() => {
        fetchCategory();
        fetchCategoryProducts();
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/admin/categories/${id}`);
            setCategory(response.data.data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch category:', error);
            setError('Failed to load category');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await api.get(`/admin/products?category=${id}&limit=100`);
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    const deleteCategory = async () => {
        if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/categories/${id}`);
            navigate(`/${urlBrand}/categories`);
        } catch (error) {
            console.error('Failed to delete category:', error);
            setError(error.response?.data?.message || 'Failed to delete category');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Category not found</p>
                <button
                    onClick={() => navigate(`/${urlBrand}/categories`)}
                    className="btn-primary"
                >
                    Back to Categories
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/${urlBrand}/categories`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Category Details</h1>
                        <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage group info and associated items</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-[#56763D] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-[#466031] transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Edit className="w-4 h-4" />
                        Edit Group
                    </button>
                    <button
                        onClick={deleteCategory}
                        className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Category Info Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-8">
                    {/* Icon */}
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center text-6xl shadow-inner border border-gray-100">
                            {category.icon || '📦'}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Group Icon</p>
                            <p className="text-sm font-black text-gray-900 uppercase">Custom Badge</p>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Category Name</p>
                        <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{category.name}</h3>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Group Description</p>
                        <p className="text-gray-500 font-bold leading-relaxed">
                            {category.description || 'No description provided'}
                        </p>
                    </div>

                    {/* Display Order */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Display Order</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{category.displayOrder || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in listings</p>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600">Total Products</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{products.length}</p>
                        </div>

                        {category.createdAt && (
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="text-sm font-medium text-gray-900 mt-2">
                                    {new Date(category.createdAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}

                        {category.updatedAt && (
                            <div className="bg-white rounded-lg p-4">
                                <p className="text-sm text-gray-600">Last Updated</p>
                                <p className="text-sm font-medium text-gray-900 mt-2">
                                    {new Date(category.updatedAt).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Products in this Category</h2>
                    <p className="text-gray-600 mt-1">{products.length} product(s) found</p>
                </div>

                {productsLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <div
                                key={product._id}
                                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Product Image */}
                                <div className="h-32 bg-gray-100 flex items-center justify-center">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                    <h4 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h4>
                                    <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {product.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No products in this category yet</p>
                    </div>
                )}
            </div>

            {/* Category Modal */}
            <CategoryModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    fetchCategory();
                }}
                category={category}
                onSuccess={() => {
                    setShowModal(false);
                    fetchCategory();
                }}
            />
        </div>
    );
}
