import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Your API functions
import { getProductById, getProductImgById } from '../../../service/productApi';
import { addToCart } from '../../../service/cartApi';
import { buyNow } from '../../../service/checkout';
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

  const productId = product?.id;

  useEffect(() => {
    let objectUrl = null;
    // This effect fetches the product image. It depends on the id only: depending on the whole
    // product would re-run it every time it sets the image, fetching forever.
    if (productId) {
      getProductImgById(productId)
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
  }, [productId]);

  const handleBuyNow = async () => {
    setLoadingBuy(true);
    try {
      await buyNow(product.id, 1);
      alert('Payment successful! Your order has been placed.');
      getProductById(id).then(res => setProduct(prev => ({ ...res.data, imageUrls: prev?.imageUrls }))); // refresh the remaining stock
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not complete the purchase');
    } finally {
      setLoadingBuy(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, 1);
      alert(`${product.name} has been added to your cart.`);
    } catch (err) {
      alert(err.response?.data?.message || 'There was an issue adding the item to your cart.');
    }
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
            <button className="cart-btn" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;