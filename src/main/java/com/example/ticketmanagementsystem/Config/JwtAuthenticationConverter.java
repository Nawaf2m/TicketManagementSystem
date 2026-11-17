
package com.example.ticketmanagementsystem.Config;

import com.example.ticketmanagementsystem.Model.User;
import com.example.ticketmanagementsystem.Repository.AuthRepository;
import lombok.AllArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AuthRepository authRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        String email = jwt.getSubject();

        User user = authRepository.findUserByEmail(email);

        if (user == null) {
            throw new BadCredentialsException("User not found");
        }

        if (!user.isActive()) {
            throw new DisabledException("User account is inactive");
        }

        return UsernamePasswordAuthenticationToken.authenticated(user, jwt, user.getAuthorities());
    }
}
