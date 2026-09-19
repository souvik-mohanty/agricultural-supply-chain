import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar/Navbar';
import ProductCard from '../../../components/ProductCard/ProductCard'; // Import the ProductCard component
import { fetchAllProducts, addToCart, getProductImgById } from '../../../service/productApi';
import './ProductPage.css';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let objectUrls = [];
    const fetchProductsAndImages = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch all products (without images)
        const productsRes = await fetchAllProducts();
        const initialProducts = productsRes.data;

        // 2. Map over products to fetch images for each one
        const productsWithImagesPromises = initialProducts.map(async (product) => {
          try {
            const imageRes = await getProductImgById(product.id);
            const imageUrl = URL.createObjectURL(imageRes.data);
            objectUrls.push(imageUrl); // Store URL for cleanup
            return { ...product, imageUrl };
          } catch (imageErr) {
            console.error(`Failed to fetch image for product ${product.id}:`, imageErr);
            // Return product with a placeholder if image fetch fails
            return { ...product, imageUrl: 'https://placehold.co/300x200/555/white?text=No+Image' };
          }
        });

        // 3. Wait for all image fetches to complete
        const productsWithImages = await Promise.all(productsWithImagesPromises);
        setProducts(productsWithImages);

      } catch (err) {
        console.error('Failed to fetch products or images:', err);
        setError('Could not load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductsAndImages();

    // Cleanup function to revoke object URLs and prevent memory leaks
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      console.log(`${product.name} has been added to your cart.`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      console.log('There was an issue adding the item to your cart.');
    }
  };

  const handleBuyNow = (product) => {
    navigate(`/products/${product.id}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="status-msg">Loading products...</p>;
    }
    if (error) {
      return <p className="status-msg error">{error}</p>;
    }
    if (filteredProducts.length === 0) {
      return <p className="status-msg">No products found.</p>;
    }
    return (
      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
            onBuyNow={() => handleBuyNow(product)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Navbar variant="products" />
      <div className="product-page">
        <div className="product-header">
          <h2>Available Products</h2>
          <div className="product-controls">
            <input
              type="text"
              placeholder="Search by product name..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {renderContent()}
      </div>
    </>
  );
};

export default ProductPage;
