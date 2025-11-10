package org.example.zaloapi.config;
import lombok.RequiredArgsConstructor;
import org.example.zaloapi.security.JwtUtil;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:*",
                    "http://127.0.0.1:*",
                    "http://192.168.*.*:*",
                    "http://10.*.*.*:*",
                    "exp://*"
                );
    }
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public org.springframework.messaging.Message<?> preSend(org.springframework.messaging.Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = null;
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        token = authToken.substring(7);}
                    if (token == null) {
                        Object sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes instanceof java.util.Map) {
                            @SuppressWarnings("unchecked")
                            java.util.Map<String, Object> attrs = (java.util.Map<String, Object>) sessionAttributes;
                            Object accessToken = attrs.get("access_token");
                            if (accessToken != null) {
                                token = accessToken.toString();}
                        }
                    }
                    if (token != null && !token.isEmpty()) {
                        try {
                            String username = jwtUtil.extractUsername(token);
                            if (username != null && jwtUtil.validateToken(token)) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                accessor.setUser(authentication);} else {
                                System.err.println("❌ [WebSocket] Invalid token: username=" + username);
                                throw new RuntimeException("Invalid JWT token");
                            }
                        } catch (Exception e) {
                            System.err.println("❌ [WebSocket] JWT validation error: " + e.getMessage());
                            e.printStackTrace();
                            throw new RuntimeException("Invalid JWT token: " + e.getMessage());
                        }
                    } else {
                        System.err.println("❌ [WebSocket] No token provided in CONNECT frame");
                        System.err.println("   Headers: " + accessor.toNativeHeaderMap());
                        throw new RuntimeException("Authentication token required");
                    }
                }
                return message;
            }
        });
    }
}