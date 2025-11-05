package org.example.zaloapi.service;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.MessageDto;
import org.example.zaloapi.dto.SendMessageRequest;
import org.example.zaloapi.dto.ChatMessage;
import org.example.zaloapi.entity.*;
import org.example.zaloapi.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageReceiptRepository receiptRepository;
    private final PushNotificationService pushNotificationService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageDto sendMessage(SendMessageRequest request, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Check if user is participant
        if (!participantRepository.existsByConversationIdAndUserId(conversation.getId(), senderId)) {
            throw new RuntimeException("User is not a participant of this conversation");
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setMessageType(Message.MessageType.valueOf(request.getMessageType()));

        // Set file attachment fields if present
        message.setFileUrl(request.getFileUrl());
        message.setFileName(request.getFileName());
        message.setFileSize(request.getFileSize());
        message.setFileType(request.getFileType());
        message.setThumbnailUrl(request.getThumbnailUrl());

        message = messageRepository.save(message);

        // Create receipts for all participants except sender
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());
        for (ConversationParticipant participant : participants) {
            if (!participant.getUser().getId().equals(senderId)) {
                MessageReceipt receipt = new MessageReceipt();
                receipt.setMessage(message);
                receipt.setUser(participant.getUser());
                receipt.setConversation(conversation);
                receipt.setStatus(MessageReceipt.ReceiptStatus.SENT);
                receiptRepository.save(receipt);

                // Tạo notification trong database
                try {
                    String notificationContent = message.getContent();
                    if (message.getMessageType() == Message.MessageType.IMAGE) {
                        notificationContent = "đã gửi một ảnh";
                    } else if (message.getMessageType() == Message.MessageType.VIDEO) {
                        notificationContent = "đã gửi một video";
                    } else if (message.getMessageType() == Message.MessageType.FILE) {
                        notificationContent = "đã gửi một file";
                    }
                    
                    notificationService.createNotification(
                        participant.getUser().getId(),
                        Notification.NotificationType.MESSAGE,
                        "Tin nhắn mới",
                        sender.getDisplayName() + ": " + notificationContent,
                        message.getId(),
                        "MESSAGE"
                    );
                } catch (Exception e) {
                    // Log nhưng không throw để không làm gián đoạn việc gửi tin nhắn
                    System.err.println("⚠️ Failed to create notification: " + e.getMessage());
                }

                // Gửi push notification
                try {
                    pushNotificationService.sendNewMessageNotification(
                        participant.getUser().getId(),
                        sender.getDisplayName(),
                        message.getContent(),
                        conversation.getId()
                    );
                } catch (Exception e) {
                    // Log nhưng không throw
                    System.err.println("⚠️ Failed to send push notification: " + e.getMessage());
                }
            }
        }

        // Broadcast message qua WebSocket để tất cả participants nhận được realtime
        // Điều này đảm bảo cả khi gửi qua HTTP API hay WebSocket đều được broadcast
        try {
            MessageDto messageDto = convertToDto(message);
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setId(messageDto.getId());
            chatMessage.setConversationId(messageDto.getConversationId());
            chatMessage.setSenderId(messageDto.getSenderId());
            chatMessage.setSenderName(messageDto.getSenderName());
            chatMessage.setSenderAvatar(messageDto.getSenderAvatar());
            chatMessage.setContent(messageDto.getContent());
            chatMessage.setMessageType(messageDto.getMessageType());
            chatMessage.setSentAt(messageDto.getSentAt());
            chatMessage.setAction(ChatMessage.MessageAction.SEND);
            chatMessage.setFileUrl(messageDto.getFileUrl());
            chatMessage.setFileName(messageDto.getFileName());
            chatMessage.setFileSize(messageDto.getFileSize());
            chatMessage.setFileType(messageDto.getFileType());
            chatMessage.setThumbnailUrl(messageDto.getThumbnailUrl());

            System.out.println("📤 [MessageService] Broadcasting message to conversation " + conversation.getId() + ": " + message.getId());
            
            // Broadcast đến tất cả participants qua WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/conversations/" + conversation.getId(),
                    chatMessage
            );

            System.out.println("✅ [MessageService] Message broadcasted successfully");
        } catch (Exception e) {
            // Log nhưng không throw để không làm gián đoạn việc gửi tin nhắn
            System.err.println("⚠️ Failed to broadcast message via WebSocket: " + e.getMessage());
            e.printStackTrace();
        }

        return convertToDto(message);
    }

    public List<MessageDto> getConversationMessages(Long conversationId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("sentAt").descending());
        Page<Message> messages = messageRepository.findByConversationIdOrderBySentAtDesc(conversationId, pageRequest);

        return messages.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessageAsDelivered(Long messageId, Long userId) {
        // Verify message exists
        if (!messageRepository.existsById(messageId)) {
            throw new RuntimeException("Message not found");
        }

        receiptRepository.findByMessageIdAndUserId(messageId, userId)
                .ifPresent(receipt -> {
                    receipt.setStatus(MessageReceipt.ReceiptStatus.DELIVERED);
                    receiptRepository.save(receipt);
                });
    }

    @Transactional
    public void markMessageAsRead(Long messageId, Long userId) {
        // Verify message exists
        if (!messageRepository.existsById(messageId)) {
            throw new RuntimeException("Message not found");
        }

        receiptRepository.findByMessageIdAndUserId(messageId, userId)
                .ifPresent(receipt -> {
                    receipt.setStatus(MessageReceipt.ReceiptStatus.READ);
                    receiptRepository.save(receipt);
                });
    }

    private MessageDto convertToDto(Message message) {
        return new MessageDto(
                message.getId(),
                message.getConversation().getId(),
                message.getSender() != null ? message.getSender().getId() : null,
                message.getSender() != null ? message.getSender().getDisplayName() : "System",
                message.getSender() != null ? message.getSender().getAvatarUrl() : null,
                message.getContent(),
                message.getMessageType().name(),
                message.getSentAt(),
                message.getFileUrl(),
                message.getFileName(),
                message.getFileSize(),
                message.getFileType(),
                message.getThumbnailUrl()
        );
    }
}
