package org.example.zaloapi.security;

import lombok.RequiredArgsConstructor;
import org.example.zaloapi.entity.User;
import org.example.zaloapi.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                new ArrayList<>()
        );
    }
}

