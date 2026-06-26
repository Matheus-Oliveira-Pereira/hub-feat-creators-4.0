package br.com.matheus.hubfeatcreators;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HubFeatCreatorsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HubFeatCreatorsApplication.class, args);
    }
}
