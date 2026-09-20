package com.agrolink.product;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ConflictException;
import com.agrolink.common.exception.ResourceNotFoundException;
import com.agrolink.product.dto.ProductRequest;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final PhotoService photoService;
    private final MongoTemplate mongoTemplate;

    public ProductResponse addProduct(ProductRequest request, List<MultipartFile> files, UserPrincipal actor)
            throws IOException {
        String farmerId = resolveFarmerId(request, actor);
        List<String> photoIds = photoService.addPhotos(files, farmerId);

        Product product = Product.builder()
                .farmerId(farmerId)
                .name(request.getName())
                .category(request.getCategory())
                .pricePerUnit(request.getPricePerUnit())
                .quantityAvailable(request.getQuantityAvailable())
                .photoIds(photoIds)
                .qualityTag(request.getQualityTag())
                .cropInfo(request.getCropInfo())
                .build();

        return ProductResponse.from(productRepository.save(product));
    }

    public List<ProductResponse> getAllProducts(String category) {
        List<Product> products = StringUtils.hasText(category)
                ? productRepository.findByCategory(category)
                : productRepository.findAll();
        return products.stream().map(ProductResponse::from).toList();
    }

    public ProductResponse getProduct(String id) {
        return ProductResponse.from(find(id));
    }

    /** Existing photos are only replaced when new images are uploaded. */
    public ProductResponse updateProduct(String id, ProductRequest request, List<MultipartFile> newImages,
                                         UserPrincipal actor) throws IOException {
        Product product = find(id);
        assertCanModify(product, actor);

        List<String> newPhotoIds = photoService.addPhotos(newImages, product.getFarmerId());
        if (!newPhotoIds.isEmpty()) {
            photoService.deletePhotos(product.getPhotoIds());
            product.setPhotoIds(newPhotoIds);
        }

        updateIfPresent(request.getName(), product::setName);
        updateIfPresent(request.getCategory(), product::setCategory);
        updateIfPresent(request.getQualityTag(), product::setQualityTag);
        updateIfPresent(request.getCropInfo(), product::setCropInfo);
        updateIfPresent(request.getPricePerUnit(), product::setPricePerUnit);
        updateIfPresent(request.getQuantityAvailable(), product::setQuantityAvailable);

        return ProductResponse.from(productRepository.save(product));
    }

    public void deleteProduct(String id, UserPrincipal actor) {
        Product product = find(id);
        assertCanModify(product, actor);
        photoService.deletePhotos(product.getPhotoIds());
        productRepository.deleteById(id);
    }

    /** Returns the first photo of a product. */
    public Photo getProductPhoto(String productId) {
        Product product = find(productId);
        if (product.getPhotoIds() == null || product.getPhotoIds().isEmpty()) {
            throw new ResourceNotFoundException("No photos available for product with id: " + productId);
        }
        return photoService.getPhoto(product.getPhotoIds().get(0));
    }

    /**
     * Atomically takes {@code quantity} units out of stock so two buyers can never oversell the same units.
     *
     * @throws ConflictException when there is not enough stock
     */
    public void reserveStock(String productId, int quantity) {
        Query enoughStock = Query.query(Criteria.where("id").is(productId).and("quantityAvailable").gte(quantity));
        Product updated = mongoTemplate.findAndModify(enoughStock, new Update().inc("quantityAvailable", -quantity), Product.class);
        if (updated == null) {
            throw new ConflictException("Insufficient stock for product " + productId);
        }
    }

    public void releaseStock(String productId, int quantity) {
        mongoTemplate.updateFirst(Query.query(Criteria.where("id").is(productId)),
                new Update().inc("quantityAvailable", quantity), Product.class);
    }

    private Product find(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    private String resolveFarmerId(ProductRequest request, UserPrincipal actor) {
        if (!actor.isAdmin()) {
            return actor.getId();
        }
        if (!StringUtils.hasText(request.getFarmerId())) {
            throw new BadRequestException("farmerId is required when an admin creates a product");
        }
        return request.getFarmerId();
    }

    private void assertCanModify(Product product, UserPrincipal actor) {
        if (!actor.isAdmin() && !actor.getId().equals(product.getFarmerId())) {
            throw new AccessDeniedException("You can only modify your own products");
        }
    }

    private <T> void updateIfPresent(T value, Consumer<T> setter) {
        Optional.ofNullable(value).ifPresent(setter);
    }
}
