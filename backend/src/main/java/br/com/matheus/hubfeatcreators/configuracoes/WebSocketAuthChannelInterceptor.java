package br.com.matheus.hubfeatcreators.configuracoes;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * Exige JWT válido no frame STOMP CONNECT. O handshake HTTP do SockJS (/ws/**) continua
 * permitAll (WebSocket nativo do browser não permite header Authorization no upgrade);
 * a autenticação real acontece aqui, lendo o token do header STOMP "Authorization"
 * (enviado pelo cliente via connectHeaders — ver frontend/src/utils/useWebSocket.ts).
 * Conexão sem token válido é rejeitada (exception no CONNECT fecha a sessão).
 */
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessagingException("Token de autenticação ausente.");
            }

            String jwt = authHeader.substring(7);
            String userEmail = jwtService.extractUsername(jwt);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            if (!jwtService.isTokenValid(jwt, userDetails)) {
                throw new MessagingException("Token de autenticação inválido.");
            }

            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()));
        }

        return message;
    }
}
