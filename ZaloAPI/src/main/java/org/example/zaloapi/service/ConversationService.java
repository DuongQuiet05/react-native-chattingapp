package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.ConversationDto;
import org.example.zaloapi.dto.CreateConversationRequest;
import org.example.zaloapi.dto.MessageDto;
import org.example.zaloapi.dto.UserDto;
import org.example.zaloapi.entity.*;
import org.example.zaloapi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MessageReceiptRepository messageReceiptRepository;
    private final BlockService blockService;

    @Transactional
    public ConversationDto createConversation(CreateConversationRequest request, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = new Conversation();
        conversation.setType(Conversation.ConversationType.valueOf(request.getType()));
        conversation.setCreatedBy(creator);

        if (request.getType().equals("GROUP")) {
            conversation.setGroupName(request.getGroupName());
        }

        conversation = conversationRepository.save(conversation);

        // Add creator as admin
        ConversationParticipant creatorParticipant = new ConversationParticipant();
        creatorParticipant.setConversation(conversation);
        creatorParticipant.setUser(creator);
        creatorParticipant.setRole(ConversationParticipant.ParticipantRole.ADMIN);
        participantRepository.save(creatorParticipant);

        // Add other participants
        for (Long userId : request.getParticipantIds()) {
            if (!userId.equals(creatorId)) {
                // Check if users are blocked (either way)
                if (blockService.isBlockedEitherWay(creatorId, userId)) {
                    throw new RuntimeException("Cannot create conversation with blocked user");
                }

                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                ConversationParticipant participant = new ConversationParticipant();
                participant.setConversation(conversation);
                participant.setUser(user);
                participant.setRole(ConversationParticipant.ParticipantRole.MEMBER);
                participantRepository.save(participant);
            }
        }

        return getConversationById(conversation.getId());
    }

    public ConversationDto getConversationById(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        return convertToDto(conversation);
    }

    public List<ConversationDto> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(userId);
        return conversations.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markConversationAsRead(Long conversationId, Long userId) {
        // Verify conversation exists
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is a participant
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isParticipant = participantRepository.findByConversationId(conversationId)
                .stream()
                .anyMatch(p -> p.getUser().getId().equals(userId));

        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        // Get all messages in the conversation that are not sent by the current user
        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);

        for (Message message : messages) {
            // Skip messages sent by the user themselves
            if (message.getSender() != null && message.getSender().getId().equals(userId)) {
                continue;
            }

            // Check if receipt already exists
            var existingReceipt = messageReceiptRepository.findByMessageIdAndUserId(message.getId(), userId);

            if (existingReceipt.isPresent()) {
                // Update existing receipt to READ
                MessageReceipt receipt = existingReceipt.get();
                receipt.setStatus(MessageReceipt.ReceiptStatus.READ);
                receipt.setUpdatedAt(LocalDateTime.now());
                messageReceiptRepository.save(receipt);
            } else {
                // Create new receipt
                MessageReceipt receipt = new MessageReceipt();
                receipt.setMessage(message);
                receipt.setUser(user);
                receipt.setConversation(conversation);
                receipt.setStatus(MessageReceipt.ReceiptStatus.READ);
                receipt.setUpdatedAt(LocalDateTime.now());
                messageReceiptRepository.save(receipt);
            }
        }
    }

    private ConversationDto convertToDto(Conversation conversation) {
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());

        List<UserDto> participantDtos = participants.stream()
                .map(p -> {
                    UserDto dto = new UserDto();
                    dto.setId(p.getUser().getId());
                    dto.setUsername(p.getUser().getUsername());
                    dto.setDisplayName(p.getUser().getDisplayName());
                    dto.setAvatarUrl(p.getUser().getAvatarUrl());
                    dto.setStatus(p.getUser().getStatus().name());
                    dto.setRole(p.getUser().getRole().name());
                    dto.setIsBlocked(p.getUser().getIsBlocked());
                    dto.setLastSeen(p.getUser().getLastSeen());
                    return dto;
                })
                .collect(Collectors.toList());

        // Get last message
        List<Message> lastMessages = messageRepository.findTop50ByConversationIdOrderBySentAtDesc(conversation.getId());
        MessageDto lastMessage = null;
        if (!lastMessages.isEmpty()) {
            Message msg = lastMessages.get(0);
            lastMessage = new MessageDto(
                    msg.getId(),
                    msg.getConversation().getId(),
                    msg.getSender() != null ? msg.getSender().getId() : null,
                    msg.getSender() != null ? msg.getSender().getDisplayName() : "System",
                    msg.getSender() != null ? msg.getSender().getAvatarUrl() : null,
                    msg.getContent(),
                    msg.getMessageType().name(),
                    msg.getSentAt(),
                    msg.getFileUrl(),
                    msg.getFileName(),
                    msg.getFileSize(),
                    msg.getFileType(),
                    msg.getThumbnailUrl()
            );
        }

        return new ConversationDto(
                conversation.getId(),
                conversation.getType().name(),
                conversation.getGroupName(),
                conversation.getGroupAvatarUrl(),
                conversation.getCreatedBy() != null ? conversation.getCreatedBy().getId() : null,
                conversation.getCreatedAt(),
                participantDtos,
                lastMessage
        );
    }
}

