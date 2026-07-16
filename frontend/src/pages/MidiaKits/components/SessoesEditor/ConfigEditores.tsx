import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { SessaoConfig, RedeCapa, InfluenciadorRef, REDES_CAPA, configPadrao } from '../../service';

function labelRede(rede: string): string {
  return REDES_CAPA.find((r) => r.rede === rede)?.label ?? rede;
}

export function CapaRedes({ config, influ, patchConfig }: {
  config: SessaoConfig;
  influ: InfluenciadorRef | null;
  patchConfig: (p: Partial<SessaoConfig>) => void;
}) {
  const redes: RedeCapa[] = config.redes && config.redes.length ? config.redes : (configPadrao('CAPA', influ).redes ?? []);
  const setRede = (i: number, patch: Partial<RedeCapa>) => {
    patchConfig({ redes: redes.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  };
  return (
    <div className="bloco-config sem-divisor">
      <div className="form-field">
        <label>Nome na capa</label>
        <InputText value={config.nomeCapa ?? ''} onChange={(e) => patchConfig({ nomeCapa: e.target.value })}
          className="w-full" placeholder={influ?.nome ?? 'Nome exibido na capa'} />
        <small className="campo-ajuda">Aparece em destaque na capa. Independe do cadastro do influenciador.</small>
      </div>
      <div className="bloco-head">
        <span>Redes na capa</span>
        {influ && <button type="button" className="btn-puxar" onClick={() => patchConfig({ redes: configPadrao('CAPA', influ).redes })}><i className="pi pi-refresh" /> Puxar do cadastro</button>}
      </div>
      {redes.map((r, i) => (
        <div key={r.rede} className="rede-linha">
          <InputSwitch checked={r.mostrar} onChange={(e) => setRede(i, { mostrar: e.value })} />
          <span className="rede-nome">{labelRede(r.rede)}</span>
          <InputText value={r.handle} onChange={(e) => setRede(i, { handle: e.target.value })} placeholder="@handle" className="rede-in" />
          <InputText value={r.seguidores} onChange={(e) => setRede(i, { seguidores: e.target.value })} placeholder="nº seguidores" className="rede-in" />
          <InputText value={r.url} onChange={(e) => setRede(i, { url: e.target.value })} placeholder="link" className="rede-in" />
        </div>
      ))}
    </div>
  );
}

export function ContatoEditor({ config, patchConfig }: {
  config: SessaoConfig;
  patchConfig: (p: Partial<SessaoConfig>) => void;
}) {
  return (
    <div className="bloco-config">
      <div className="bloco-head"><span>Contatos exibidos</span></div>
      <div className="contato-linha">
        <InputSwitch checked={config.mostrarEmail !== false} onChange={(e) => patchConfig({ mostrarEmail: e.value })} />
        <InputText value={config.email ?? ''} onChange={(e) => patchConfig({ email: e.target.value })} placeholder="E-mail" className="w-full" />
      </div>
      <div className="contato-linha">
        <InputSwitch checked={config.mostrarWhatsapp !== false} onChange={(e) => patchConfig({ mostrarWhatsapp: e.value })} />
        <InputText value={config.whatsapp ?? ''} onChange={(e) => patchConfig({ whatsapp: e.target.value })} placeholder="WhatsApp" className="w-full" />
      </div>
    </div>
  );
}
