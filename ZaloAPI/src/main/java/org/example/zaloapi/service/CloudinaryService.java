package org.example.zaloapi.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload image to Cloudinary
     * @param file MultipartFile image
     * @return Map containing url, publicId, format, etc.
     */
    public Map<String, Object> uploadImage(MultipartFile file) throws IOException {
        log.info("Uploading image: {}", file.getOriginalFilename());

        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "zalo_chat/images",
                        "resource_type", "image",
                        "quality", "auto:good"
                ));

        log.info("Image uploaded successfully: {}", uploadResult.get("url"));
        return uploadResult;
    }

    /**
     * Upload video to Cloudinary
     * @param file MultipartFile video
     * @return Map containing url, publicId, thumbnail, etc.
     */
    public Map<String, Object> uploadVideo(MultipartFile file) throws IOException {
        log.info("Uploading video: {}", file.getOriginalFilename());

        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "zalo_chat/videos",
                        "resource_type", "video"
                ));

        log.info("Video uploaded successfully: {}", uploadResult.get("url"));
        return uploadResult;
    }

    /**
     * Upload file (PDF, DOC, etc.) to Cloudinary
     * @param file MultipartFile
     * @return Map containing url, publicId, etc.
     */
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        log.info("Uploading file: {}", file.getOriginalFilename());

        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "zalo_chat/files",
                        "resource_type", "raw"
                ));

        log.info("File uploaded successfully: {}", uploadResult.get("url"));
        return uploadResult;
    }

    /**
     * Delete file from Cloudinary
     * @param publicId Public ID of the file
     * @param resourceType Type: image, video, raw
     */
    public void deleteFile(String publicId, String resourceType) throws IOException {
        log.info("Deleting file: {}", publicId);
        cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", resourceType));
        log.info("File deleted successfully");
    }

    /**
     * Generate thumbnail URL for video
     * @param publicId Public ID of the video
     * @return Thumbnail URL
     */
    public String generateVideoThumbnail(String publicId) {
        try {
            // Generate thumbnail URL using transformation
            // Get frame at 1 second mark and convert to JPG
            String thumbnailUrl = cloudinary.url()
                    .resourceType("video")
                    .format("jpg")
                    .transformation(new com.cloudinary.Transformation()
                            .startOffset("1")
                            .width(300)
                            .height(300)
                            .crop("fill")
                    )
                    .generate(publicId);
            
            log.info("Generated thumbnail URL: {}", thumbnailUrl);
            return thumbnailUrl;
        } catch (Exception e) {
            log.error("Failed to generate thumbnail for video: {}", publicId, e);
            // Fallback: try simpler approach - just get video URL and replace extension
            try {
                String baseUrl = cloudinary.url()
                        .resourceType("video")
                        .generate(publicId);
                // Remove video extension and add .jpg
                return baseUrl.replaceAll("\\.(mp4|mov|avi|mkv|webm)$", ".jpg");
            } catch (Exception ex) {
                log.error("Fallback thumbnail generation also failed", ex);
                // Last resort: return video URL itself
                return cloudinary.url()
                        .resourceType("video")
                        .generate(publicId);
            }
        }
    }
}

