import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Contato, contatoInvalido } from '../../service';
import './styles.scss';

interface ContatosEditorProps {
  contatos: Contato[];
  onChange: (contatos: Contato[]) => void;
  submitted: boolean;
}

const CONTATO_VAZIO: Contato = { nome: '', email: '', telefone: '' };

function ContatosEditor({ contatos, onChange, submitted }: ContatosEditorProps) {
  const patch = (i: number, p: Partial<Contato>) => {
    onChange(contatos.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  };

  const adicionar = () => onChange([...contatos, { ...CONTATO_VAZIO }]);
  const remover = (i: number) => onChange(contatos.filter((_, idx) => idx !== i));

  return (
    <div className="contatos-editor">
      <div className="contatos-head">
        <span>Contatos</span>
        <Button label="Adicionar contato" icon="pi pi-plus" className="btn-add-contato" type="button" onClick={adicionar} />
      </div>

      {contatos.length === 0 && <p className="contatos-vazio">Nenhum contato. Adicione acima.</p>}

      {contatos.map((c, i) => {
        const invalido = submitted && contatoInvalido(c);
        return (
          <div key={c.id ?? `novo-${i}`} className={`contato-linha ${invalido ? 'invalido' : ''}`}>
            <InputText value={c.nome} onChange={(e) => patch(i, { nome: e.target.value })} placeholder="Nome (ex: Comercial)" className="contato-in" />
            <InputText value={c.email} type="email" onChange={(e) => patch(i, { email: e.target.value })} placeholder="E-mail" className="contato-in" />
            <InputText value={c.telefone} onChange={(e) => patch(i, { telefone: e.target.value })} placeholder="Telefone" className="contato-in" />
            <button type="button" className="contato-remover" onClick={() => remover(i)} title="Remover"><i className="pi pi-trash" /></button>
            {invalido && <small className="contato-erro"><i className="pi pi-exclamation-circle" /> Informe nome e ao menos e-mail ou telefone.</small>}
          </div>
        );
      })}
    </div>
  );
}

export default ContatosEditor;
