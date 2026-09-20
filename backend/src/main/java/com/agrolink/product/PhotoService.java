package com.agrolink.product;

import com.agrolink.common.exception.BadRequestException;
import com.agrolink.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;

    /** Stores every non-empty file and returns the new photo ids. Browsers send an empty part when no file was picked. */
    public List<String> addPhotos(List<MultipartFile> files, String uploaderId) throws IOException {
        List<String> ids = new ArrayList<>();
        if (files == null) {
            return ids;
        }
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new BadRequestException("Only image files can be uploaded: " + file.getOriginalFilename());
            }
            Photo photo = Photo.builder()
                    .uploaderId(uploaderId)
                    .filename(file.getOriginalFilename())
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .imageData(file.getBytes())
                    .build();
            ids.add(photoRepository.save(photo).getId());
        }
        return ids;
    }

    public Photo getPhoto(String id) {
        return photoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found with id: " + id));
    }

    public void deletePhotos(List<String> ids) {
        if (ids != null && !ids.isEmpty()) {
            photoRepository.deleteAllById(ids);
        }
    }
}
