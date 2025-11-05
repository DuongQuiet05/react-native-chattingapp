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
                        "resource_type", "video",
                        "eager", ObjectUtils.asMap(
                                "width", 300,
                                "height", 300,
                                "crop", "pad",
                                "format", "jpg"
                        ),
                        "eager_async", true
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
        return cloudinary.url()
                .resourceType("video")
                .format("jpg")
                .generate(publicId + ".jpg");
    }
}

