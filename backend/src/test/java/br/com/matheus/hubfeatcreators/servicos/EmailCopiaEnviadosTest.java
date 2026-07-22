package br.com.matheus.hubfeatcreators.servicos;

import br.com.matheus.hubfeatcreators.exceptions.ConfiguracaoInvalidaException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Testes das regras puras de CC/BCC e derivação de host IMAP (gravação em Enviados). */
class EmailCopiaEnviadosTest {

    // ---------- derivarImapHost ----------

    @Test
    void derivaImapTrocandoPrefixoSmtp() {
        assertEquals("imap.gmail.com", ContaEmailService.derivarImapHost("smtp.gmail.com"));
        assertEquals("imap.hostinger.com", ContaEmailService.derivarImapHost("smtp.hostinger.com"));
        assertEquals("imap.titan.email", ContaEmailService.derivarImapHost("SMTP.titan.email".toLowerCase()));
    }

    @Test
    void derivaImapPrefixandoQuandoSemPrefixoSmtp() {
        assertEquals("imap.mail.provedor.com", ContaEmailService.derivarImapHost("mail.provedor.com"));
    }

    @Test
    void derivaImapNuloParaHostVazio() {
        assertNull(ContaEmailService.derivarImapHost(null));
        assertNull(ContaEmailService.derivarImapHost("  "));
    }

    // ---------- separarEmails ----------

    @Test
    void separaCsvDeEmailsIgnorandoVazios() {
        assertEquals(List.of("a@x.com", "b@y.com"), ContaEmailService.separarEmails("a@x.com, b@y.com"));
        assertEquals(List.of("a@x.com"), ContaEmailService.separarEmails(" a@x.com ; "));
        assertEquals(List.of(), ContaEmailService.separarEmails(null));
        assertEquals(List.of(), ContaEmailService.separarEmails("  "));
    }

    // ---------- mesclarCopiaOculta ----------

    @Test
    void mesclaBccDoEnvioComDaContaSemDuplicatas() {
        List<String> resultado = EmailService.mesclarCopiaOculta(
                List.of("chefe@agencia.com", "Arquivo@agencia.com"),
                "arquivo@agencia.com, backup@agencia.com");
        assertEquals(List.of("chefe@agencia.com", "Arquivo@agencia.com", "backup@agencia.com"), resultado);
    }

    @Test
    void mesclaBccComListasVazias() {
        assertEquals(List.of(), EmailService.mesclarCopiaOculta(null, null));
        assertEquals(List.of("a@x.com"), EmailService.mesclarCopiaOculta(null, "a@x.com"));
        assertEquals(List.of("a@x.com"), EmailService.mesclarCopiaOculta(List.of("a@x.com"), ""));
    }

    // ---------- validarCopiaOculta ----------

    @Test
    void validaCopiaOcultaDaConta() {
        ContaEmailService service = new ContaEmailService(null);
        assertDoesNotThrow(() -> service.validarCopiaOculta("a@x.com, b@y.com"));
        assertDoesNotThrow(() -> service.validarCopiaOculta(null));
        assertThrows(ConfiguracaoInvalidaException.class, () -> service.validarCopiaOculta("nao-e-email"));
    }
}
