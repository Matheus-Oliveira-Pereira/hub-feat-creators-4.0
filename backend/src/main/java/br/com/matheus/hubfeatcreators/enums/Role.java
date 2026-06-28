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
    CFGC,
    EMLA,
    EMLB,
    EMLC,
    EMLD,
    CTEA,
    CTEB,
    CTEC,
    CTED,
    PSPA,
    PSPB,
    PSPC,
    PSPD,
    PUBA,
    PUBB,
    PUBC,
    PUBD;

    @Override
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
