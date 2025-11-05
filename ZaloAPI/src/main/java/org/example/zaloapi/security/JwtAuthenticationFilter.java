package org.example.zaloapi.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7).trim();

            // Validate JWT format (should have 3 parts separated by dots)
            if (jwt.split("\\.").length != 3) {
                logger.warn("Invalid JWT token format - token does not have 3 parts: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
                filterChain.doFilter(request, response);
                return;
            }

            final String username = jwtUtil.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            logger.error("Malformed JWT token: " + e.getMessage());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            logger.error("JWT token is expired: " + e.getMessage());
        } catch (io.jsonwebtoken.UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: " + e.getMessage());
        } catch (io.jsonwebtoken.security.SignatureException e) {
            logger.error("JWT signature validation failed: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT token is invalid: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}

