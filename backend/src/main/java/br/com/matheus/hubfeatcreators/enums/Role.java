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
    INFD,
    MDKA,
    MDKB,
    MDKC,
    MDKD,
    MRCA,
    MRCB,
    MRCC,
    MRCD,
    CFGB,
    CFGC;

    @Override
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
