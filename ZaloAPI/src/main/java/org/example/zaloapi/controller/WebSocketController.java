package org.example.zaloapi.controller;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.dto.ChatMessage;
import org.example.zaloapi.dto.MessageDto;
import org.example.zaloapi.dto.SendMessageRequest;
import org.example.zaloapi.repository.UserRepository;
import org.example.zaloapi.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;
@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserRepository userRepository;
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        try {
            // Get sender information
            String username = principal.getName();
            Long senderId = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            // Save message to database
            SendMessageRequest request = new SendMessageRequest();
            request.setConversationId(chatMessage.getConversationId());
            request.setContent(chatMessage.getContent());
            request.setMessageType(chatMessage.getMessageType() != null ? chatMessage.getMessageType() : "TEXT");
            MessageDto savedMessage = messageService.sendMessage(request, senderId);
            ChatMessage response = new ChatMessage();
            response.setId(savedMessage.getId());
            response.setConversationId(savedMessage.getConversationId());
            response.setSenderId(savedMessage.getSenderId());
            response.setSenderName(savedMessage.getSenderName());
            response.setSenderAvatar(savedMessage.getSenderAvatar());
            response.setContent(savedMessage.getContent());
            response.setMessageType(savedMessage.getMessageType());
            response.setSentAt(savedMessage.getSentAt());
            response.setAction(ChatMessage.MessageAction.SEND);
            // Set file attachment fields
            response.setFileUrl(savedMessage.getFileUrl());
            response.setFileName(savedMessage.getFileName());
            response.setFileSize(savedMessage.getFileSize());
            response.setFileType(savedMessage.getFileType());
            response.setThumbnailUrl(savedMessage.getThumbnailUrl());
            System.out.println("📤 [WebSocket] Broadcasting message to conversation " + chatMessage.getConversationId() + ": " + savedMessage.getId());
            messagingTemplate.convertAndSend(
                    "/topic/conversations/" + chatMessage.getConversationId(),
                    response
            );} catch (Exception e) {
            e.printStackTrace();
        }
    }
    @MessageMapping("/chat.typing")
    public void typing(@Payload ChatMessage chatMessage, Principal principal) {
        String username = principal.getName();
        chatMessage.setAction(ChatMessage.MessageAction.TYPING);
        chatMessage.setSenderName(username);
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + chatMessage.getConversationId(),
                chatMessage
        );
    }
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ChatMessage chatMessage, Principal principal) {
        try {
            String username = principal.getName();
            Long userId = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            if (chatMessage.getId() != null) {
                messageService.markMessageAsRead(chatMessage.getId(), userId);
                chatMessage.setAction(ChatMessage.MessageAction.READ);
                messagingTemplate.convertAndSend(
                        "/topic/conversations/" + chatMessage.getConversationId(),
                        chatMessage
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}