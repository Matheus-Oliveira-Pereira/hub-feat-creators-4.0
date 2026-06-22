package br.com.matheus.hubfeatcreators.enums;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {
    USRA,
    USRB,
    USRC,
    USRD,
    PRFA,
    PRFB,
    PRFC,
    PRFD,
    INFA,
    INFB,
    INFC,
    INFD;

    @Override
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
