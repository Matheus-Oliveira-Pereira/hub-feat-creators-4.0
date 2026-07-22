package br.com.matheus.hubfeatcreators.configuracoes;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache das agregações de métricas (HQL pesado no dashboard). TTL curto (5 min) —
 * limita staleness sem eviction por evento e cobre a dependência de LocalDate.now()
 * no aging de recebíveis.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_METRICAS = "metricas";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(CACHE_METRICAS);
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(500));
        return cacheManager;
    }
}
