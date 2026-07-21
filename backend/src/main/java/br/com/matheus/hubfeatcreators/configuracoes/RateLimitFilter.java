package br.com.matheus.hubfeatcreators.configuracoes;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    /** Expira por inatividade e tem teto de tamanho — evita crescimento sem limite do mapa de buckets. */
    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .expireAfterAccess(1, TimeUnit.HOURS)
            .maximumSize(50_000)
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!isRateLimited(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveKey(request, path);
        Bucket bucket = buckets.get(key, k -> createBucket(path));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Muitas tentativas. Aguarde antes de tentar novamente.\"}");
        }
    }

    private boolean isRateLimited(String path) {
        return path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/refresh");
    }

    private String resolveKey(HttpServletRequest request, String path) {
        return request.getRemoteAddr() + ":" + path;
    }

    private Bucket createBucket(String path) {
        if (path.startsWith("/api/auth/login")) {
            return Bucket.builder()
                    .addLimit(Bandwidth.simple(5, Duration.ofMinutes(1)))
                    .addLimit(Bandwidth.simple(20, Duration.ofHours(1)))
                    .build();
        }

        return Bucket.builder()
                .addLimit(Bandwidth.simple(10, Duration.ofMinutes(1)))
                .build();
    }
}
