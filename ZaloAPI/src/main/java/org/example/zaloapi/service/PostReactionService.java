package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.PostDto;
import org.example.zaloapi.dto.ReactToPostRequest;
import org.example.zaloapi.entity.Post;
import org.example.zaloapi.entity.PostReaction;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.PostReactionRepository;
import org.example.zaloapi.repository.PostRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostReactionService {

    private final PostReactionRepository postReactionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public PostDto reactToPost(Long postId, Long userId, ReactToPostRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PostReaction.ReactionType type = PostReaction.ReactionType.valueOf(request.getReactionType().toUpperCase());

        // Check if user already reacted with this type
        Optional<PostReaction> existing = postReactionRepository
                .findByPostIdAndUserIdAndReactionType(postId, userId, type);

        if (existing.isPresent()) {
            // Remove reaction if same type (toggle)
            postReactionRepository.delete(existing.get());
        } else {
            // Remove any existing reaction of different type
            postReactionRepository.findByPostId(postId).stream()
                    .filter(r -> r.getUser().getId().equals(userId))
                    .forEach(postReactionRepository::delete);

            // Create new reaction
            PostReaction reaction = new PostReaction();
            reaction.setPost(post);
            reaction.setUser(user);
            reaction.setReactionType(type);
            postReactionRepository.save(reaction);
        }

        // Return updated post DTO
        // Note: This would typically be handled by PostService
        return null; // Will be handled by PostService
    }

    @Transactional
    public void removeReaction(Long postId, Long userId) {
        postReactionRepository.findByPostId(postId).stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .forEach(postReactionRepository::delete);
    }
}

