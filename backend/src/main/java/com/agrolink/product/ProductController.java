package com.agrolink.product;

import com.agrolink.product.dto.ProductRequest;
import com.agrolink.product.dto.ProductResponse;
import com.agrolink.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private static final String FARMER_OR_ADMIN = "hasAnyRole('FARMER', 'ADMIN')";

    private final ProductService productService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(FARMER_OR_ADMIN)
    public ProductResponse addProduct(@Valid @ModelAttribute ProductRequest request,
                                      @RequestParam(value = "images", required = false) List<MultipartFile> images,
                                      @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        return productService.addProduct(request, images, principal);
    }

    @GetMapping
    public List<ProductResponse> getProducts(@RequestParam(required = false) String category) {
        return productService.getAllProducts(category);
    }

    @GetMapping("/{id}")
    public ProductResponse getProduct(@PathVariable String id) {
        return productService.getProduct(id);
    }

    /** Serves the first photo of the product with the given id. */
    @GetMapping("/photo/{id}")
    public ResponseEntity<byte[]> getProductPhoto(@PathVariable String id) {
        Photo photo = productService.getProductPhoto(id);
        MediaType type = photo.getContentType() != null
                ? MediaType.parseMediaType(photo.getContentType())
                : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(type).body(photo.getImageData());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(FARMER_OR_ADMIN)
    public ProductResponse updateProduct(@PathVariable String id,
                                         @Valid @ModelAttribute ProductRequest request,
                                         @RequestParam(value = "images", required = false) List<MultipartFile> images,
                                         @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        return productService.updateProduct(id, request, images, principal);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(FARMER_OR_ADMIN)
    public ResponseEntity<Void> deleteProduct(@PathVariable String id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        productService.deleteProduct(id, principal);
        return ResponseEntity.noContent().build();
    }
}
