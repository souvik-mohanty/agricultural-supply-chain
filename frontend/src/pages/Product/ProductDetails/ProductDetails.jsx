import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Your API functions
import { getProductById, getProductImgById } from '../../../service/productApi';
import Navbar from '../../../components/Navbar/Navbar';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loadingBuy, setLoadingBuy] = useState(false); 

  useEffect(() => {
    // This effect fetches the main product data
    getProductById(id)
      .then(res => setProduct(res.data))
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    let objectUrl = null;
    // This effect fetches an additional image based on the product
    if (product) {
      getProductImgById(product.id)
        .then(res => {
          objectUrl = URL.createObjectURL(res.data);
          setProduct(prev => ({ 
            ...prev, 
            imageUrls: [objectUrl, ...(prev.imageUrls || [])] 
          }));
        })
        .catch(err => console.error('Error fetching product image:', err));
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [product]);

  const handleBuyNow = () => {
    setLoadingBuy(true);
    setTimeout(() => {
      setLoadingBuy(false);
      alert('Navigating to Buy Page...');
    }, 2000);
  };

  if (!product) return <p className="loading-msg">Loading product details...</p>;

  return (
    <>
      <Navbar variant="products" />
      <div className="product-details">
        <div className="details-left">
          <img
            src={product?.imageUrls?.[0]}
            alt={product.name}
            className="main-image"
          />
          <div className="image-gallery">
            {product?.imageUrls?.slice(0, 4).map((url, index) => (
              <img key={index} src={url} alt={`preview-${index}`} />
            ))}
          </div>
        </div>

        <div className="details-right">
          <h1>{product.name}</h1>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Price:</strong> ₹{product.pricePerUnit} / unit</p>
          <p><strong>Available Quantity:</strong> {product.quantityAvailable}</p>
          <p><strong>Quality:</strong> {product.qualityTag}</p>
          <p><strong>Crop Info:</strong> {product.cropInfo}</p>

          <div className="action-buttons">
            <button className="buy-btn" onClick={handleBuyNow} disabled={loadingBuy}>
              {loadingBuy ? 'Loading...' : 'Buy Now'}
            </button>
            <button className="cart-btn">Add to Cart</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;