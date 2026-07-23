import { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {
  midiaKitService, Sessao, InfluenciadorRef, MarcaRef, TIPOS_SESSAO,
  configPadrao, tituloPadrao, conteudoPadrao, sessaoVazia,
} from '../../service';
import SessaoCard from './SessaoCard';
import './styles.scss';

// Re-export para compatibilidade (TemplateDialog importa daqui).
export { sessaoVazia };

interface SessoesEditorProps {
  sessoes: Sessao[];
  onChange: (sessoes: Sessao[]) => void;
  templateId: string | null;
  influenciador: InfluenciadorRef | null;
  onToast: (severity: 'success' | 'error' | 'warn', detail: string) => void;
}

function SessoesEditor({ sessoes, onChange, templateId, influenciador, onToast }: Readonly<SessoesEditorProps>) {
  const [novoTipo, setNovoTipo] = useState<string | null>(null);
  const [marcasDisponiveis, setMarcasDisponiveis] = useState<MarcaRef[]>([]);
  const dragIndex = useRef<number | null>(null);

  /** Recarrega a lista de marcas disponíveis (usado após cadastrar uma marca na hora). */
  const recarregarMarcas = async (): Promise<MarcaRef[]> => {
    try {
      const m = await midiaKitService.listarMarcas();
      setMarcasDisponiveis(m);
      return m;
    } catch {
      onToast('error', 'Falha ao carregar marcas cadastradas');
      return [];
    }
  };

  useEffect(() => {
    let ativo = true;
    midiaKitService.listarMarcas()
      .then((m) => { if (ativo) setMarcasDisponiveis(m); })
      .catch(() => onToast('error', 'Falha ao carregar marcas cadastradas'));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reordenar = (lista: Sessao[]) => lista.map((s, idx) => ({ ...s, ordem: idx }));

  const adicionar = () => {
    if (!novoTipo) return;
    onChange([...sessoes, {
      tipo: novoTipo, ordem: sessoes.length, titulo: tituloPadrao(novoTipo, influenciador), ativa: true,
      conteudo: conteudoPadrao(novoTipo), config: JSON.stringify(configPadrao(novoTipo, influenciador)),
    }]);
    setNovoTipo(null);
  };

  const patch = (i: number, p: Partial<Sessao>) => {
    onChange(sessoes.map((s, idx) => (idx === i ? { ...s, ...p } : s)));
  };

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sessoes.length) return;
    const copia = [...sessoes];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(reordenar(copia));
  };

  const remover = (i: number) => {
    onChange(reordenar(sessoes.filter((_, idx) => idx !== i)));
  };

  /** Insere cópia da seção logo abaixo (sem id — vira registro novo ao salvar). */
  const duplicar = (i: number) => {
    const original = sessoes[i];
    const copia: Sessao = { ...original, id: undefined };
    const lista = [...sessoes];
    lista.splice(i + 1, 0, copia);
    onChange(reordenar(lista));
  };

  /** Drag-and-drop nativo: solta a seção arrastada na posição do card alvo. */
  const soltarEm = (destino: number) => {
    const origem = dragIndex.current;
    dragIndex.current = null;
    if (origem == null || origem === destino) return;
    const lista = [...sessoes];
    const [movida] = lista.splice(origem, 1);
    lista.splice(destino, 0, movida);
    onChange(reordenar(lista));
  };

  return (
    <div className="sessoes-editor">
      <div className="sessoes-add">
        <Dropdown value={novoTipo} options={TIPOS_SESSAO} optionLabel="label" optionValue="tipo"
          onChange={(e) => setNovoTipo(e.value)} placeholder="Adicionar seção..." className="w-full" baseZIndex={10000} />
        <Button label="Adicionar" icon="pi pi-plus" className="btn-add-sessao" onClick={adicionar} disabled={!novoTipo} />
      </div>

      {sessoes.length === 0 && <p className="sessoes-vazio">Nenhuma seção. Adicione acima.</p>}

      {sessoes.map((s, i) => (
        <SessaoCard key={s.id ?? `nova-${i}`} sessao={s} index={i} total={sessoes.length} templateId={templateId} influenciador={influenciador}
          marcasDisponiveis={marcasDisponiveis} recarregarMarcas={recarregarMarcas}
          onPatch={(p) => patch(i, p)} onMove={(d) => mover(i, d)} onRemove={() => remover(i)}
          onDuplicate={() => duplicar(i)}
          onDragStart={() => { dragIndex.current = i; }}
          onDropOn={() => soltarEm(i)}
          onToast={onToast} />
      ))}
    </div>
  );
}

export default SessoesEditor;
