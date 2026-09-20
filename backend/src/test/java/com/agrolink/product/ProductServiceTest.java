package com.agrolink.product;

import com.agrolink.common.exception.ConflictException;
import com.agrolink.product.dto.ProductRequest;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.security.UserPrincipal;
import com.agrolink.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @Mock PhotoService photoService;
    @Mock MongoTemplate mongoTemplate;

    ProductService productService;

    final UserPrincipal owner = new UserPrincipal("farmer-1", "farmer", "x", UserRole.FARMER, false);
    final UserPrincipal otherFarmer = new UserPrincipal("farmer-2", "other", "x", UserRole.FARMER, false);
    final UserPrincipal admin = new UserPrincipal("admin-1", "root", "x", UserRole.ADMIN, false);

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, photoService, mongoTemplate);
    }

    private Product storedProduct() {
        return Product.builder().id("p1").farmerId("farmer-1").name("Tomato").category("VEGETABLE")
                .pricePerUnit(20.0).quantityAvailable(10).photoIds(new ArrayList<>(List.of("photo-1"))).build();
    }

    private static ProductRequest request(String name) {
        ProductRequest request = new ProductRequest();
        request.setName(name);
        request.setCategory("VEGETABLE");
        request.setPricePerUnit(25.0);
        request.setQuantityAvailable(5);
        return request;
    }

    @Test
    void farmersAlwaysOwnTheProductsTheyCreateWhateverFarmerIdTheyPost() throws IOException {
        ProductRequest request = request("Tomato");
        request.setFarmerId("someone-else");
        when(photoService.addPhotos(any(), eq("farmer-1"))).thenReturn(List.of());
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.addProduct(request, null, owner);

        assertThat(response.farmerId()).isEqualTo("farmer-1");
    }

    @Test
    void updatingWithoutNewImagesKeepsTheExistingPhotos() throws IOException {
        Product product = storedProduct();
        when(productRepository.findById("p1")).thenReturn(Optional.of(product));
        when(photoService.addPhotos(any(), any())).thenReturn(List.of());
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.updateProduct("p1", request("Cherry tomato"), null, owner);

        assertThat(response.name()).isEqualTo("Cherry tomato");
        assertThat(response.photoIds()).containsExactly("photo-1");
        verify(photoService, never()).deletePhotos(any());
    }

    @Test
    void uploadingNewImagesReplacesTheOldOnes() throws IOException {
        Product product = storedProduct();
        when(productRepository.findById("p1")).thenReturn(Optional.of(product));
        when(photoService.addPhotos(any(), any())).thenReturn(List.of("photo-2"));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.updateProduct("p1", request("Tomato"), List.of(), owner);

        assertThat(response.photoIds()).containsExactly("photo-2");
        verify(photoService).deletePhotos(List.of("photo-1"));
    }

    @Test
    void farmersCannotTouchEachOthersProductsButAdminsCan() {
        when(productRepository.findById("p1")).thenReturn(Optional.of(storedProduct()));

        assertThatThrownBy(() -> productService.deleteProduct("p1", otherFarmer)).isInstanceOf(AccessDeniedException.class);
        verify(productRepository, never()).deleteById(any());

        productService.deleteProduct("p1", admin);
        verify(productRepository).deleteById("p1");
        verify(photoService).deletePhotos(List.of("photo-1"));
    }

    @Test
    void reservingMoreThanIsInStockFails() {
        when(mongoTemplate.findAndModify(any(), any(), eq(Product.class))).thenReturn(null);

        assertThatThrownBy(() -> productService.reserveStock("p1", 50)).isInstanceOf(ConflictException.class);
    }

    @Test
    void reservingWithinStockSucceeds() {
        when(mongoTemplate.findAndModify(any(), any(), eq(Product.class))).thenReturn(storedProduct());

        productService.reserveStock("p1", 3);

        verify(mongoTemplate).findAndModify(any(), any(), eq(Product.class));
    }
}
