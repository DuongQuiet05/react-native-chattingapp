package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.MessageReactionDto;
import org.example.zaloapi.entity.Message;
import org.example.zaloapi.entity.MessageReaction;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.MessageReactionRepository;
import org.example.zaloapi.repository.MessageRepository;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageReactionService {

    private final MessageReactionRepository messageReactionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageReactionDto reactToMessage(Long messageId, Long userId, String reactionType) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MessageReaction.ReactionType type = MessageReaction.ReactionType.valueOf(reactionType.toUpperCase());

        // Check if user already reacted with this type
        Optional<MessageReaction> existing = messageReactionRepository
                .findByMessageIdAndUserIdAndReactionType(messageId, userId, type);

        if (existing.isPresent()) {
            // Remove reaction if same type (toggle)
            messageReactionRepository.delete(existing.get());
            return null; // Indicates reaction was removed
        }

        // Remove any existing reaction of different type
        messageReactionRepository.findByMessageId(messageId).stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .forEach(messageReactionRepository::delete);

        // Create new reaction
        MessageReaction reaction = new MessageReaction();
        reaction.setMessage(message);
        reaction.setUser(user);
        reaction.setReactionType(type);
        reaction = messageReactionRepository.save(reaction);

        return convertToDto(reaction);
    }

    @Transactional
    public void removeReaction(Long messageId, Long userId) {
        messageReactionRepository.findByMessageId(messageId).stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .forEach(messageReactionRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<MessageReactionDto> getMessageReactions(Long messageId) {
        return messageReactionRepository.findByMessageId(messageId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private MessageReactionDto convertToDto(MessageReaction reaction) {
        return MessageReactionDto.builder()
                .id(reaction.getId())
                .messageId(reaction.getMessage().getId())
                .userId(reaction.getUser().getId())
                .username(reaction.getUser().getUsername())
                .displayName(reaction.getUser().getDisplayName())
                .avatarUrl(reaction.getUser().getAvatarUrl())
                .reactionType(reaction.getReactionType().name())
                .createdAt(reaction.getCreatedAt())
                .build();
    }
}

