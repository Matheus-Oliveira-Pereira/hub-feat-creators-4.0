import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { contaEmailService, ImportacaoResultadoDTO, ImportacaoLinhaDTO } from '../../service';
import '../../../Influenciadores/components/ImportacaoDialog/styles.scss';

interface ImportacaoDialogProps {
  visible: boolean;
  onHide: () => void;
  onComplete: () => void;
}

type Etapa = 'upload' | 'processando' | 'resultado';

function ImportacaoDialog({ visible, onHide, onComplete }: ImportacaoDialogProps) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [resultado, setResultado] = useState<ImportacaoResultadoDTO | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetar = () => {
    setEtapa('upload');
    setResultado(null);
    setErro(null);
    setArquivo(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const fechar = () => {
    if (resultado && resultado.sucesso > 0) onComplete();
    resetar();
    onHide();
  };

  const importar = async () => {
    if (!arquivo) return;
    setEtapa('processando');
    setErro(null);
    try {
      const res = await contaEmailService.importarCSV(arquivo);
      setResultado(res);
      setEtapa('resultado');
    } catch {
      setErro('Erro ao enviar arquivo. Verifique o formato e tente novamente.');
      setEtapa('upload');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setArquivo(file);
  };

  const statusIcon = (linha: ImportacaoLinhaDTO) => {
    switch (linha.status) {
      case 'SUCESSO': return <i className="pi pi-check-circle status-sucesso" />;
      case 'DUPLICADO': return <i className="pi pi-clone status-duplicado" />;
      case 'ERRO': return <i className="pi pi-times-circle status-erro" />;
    }
  };

  const statusLabel = (linha: ImportacaoLinhaDTO) => {
    switch (linha.status) {
      case 'SUCESSO': return 'Importada';
      case 'DUPLICADO': return 'Já existia';
      case 'ERRO': return linha.erro || 'Erro';
    }
  };

  const header = (
    <span className="p-dialog-title">
      <i className="pi pi-file-import" /> Importar Contas de E-mail
    </span>
  );

  return (
    <Dialog visible={visible} onHide={fechar} header={header} style={{ width: '650px' }} modal draggable={false} className="importacao-dialog">
      {etapa === 'upload' && (
        <div className="importacao-upload">
          <div className="upload-instructions">
            <i className="pi pi-cloud-upload upload-icon" />
            <p>Selecione um arquivo CSV com as contas de e-mail (colunas: nome, host, porta, usuario, senha, remetentenome, tls, sistema)</p>
            <button type="button" className="btn-template" onClick={() => contaEmailService.downloadTemplate()}>
              <i className="pi pi-download" /> Baixar modelo de exemplo
            </button>
          </div>

          <div className="upload-area">
            <input ref={inputRef} type="file" accept=".csv,.txt" onChange={onFileSelect} className="file-input" id="csv-upload-conta" />
            <label htmlFor="csv-upload-conta" className="file-label">
              <i className="pi pi-file" />
              {arquivo ? arquivo.name : 'Escolher arquivo...'}
            </label>
          </div>

          {erro && <div className="importacao-erro"><i className="pi pi-exclamation-triangle" /> {erro}</div>}

          <div className="importacao-footer">
            <Button label="Cancelar" icon="pi pi-times" className="btn-cancelar" onClick={fechar} />
            <Button label="Importar" icon="pi pi-upload" className="btn-salvar" onClick={importar} disabled={!arquivo} />
          </div>
        </div>
      )}

      {etapa === 'processando' && (
        <div className="importacao-processando">
          <i className="pi pi-spin pi-spinner processando-icon" />
          <p>Processando arquivo...</p>
          <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
        </div>
      )}

      {etapa === 'resultado' && resultado && (
        <div className="importacao-resultado">
          <div className="resultado-resumo">
            <div className="resumo-item total">
              <span className="resumo-numero">{resultado.totalLinhas}</span>
              <span className="resumo-label">Processadas</span>
            </div>
            <div className="resumo-item sucesso">
              <span className="resumo-numero">{resultado.sucesso}</span>
              <span className="resumo-label">Importadas</span>
            </div>
            <div className="resumo-item duplicado">
              <span className="resumo-numero">{resultado.duplicados}</span>
              <span className="resumo-label">Duplicados</span>
            </div>
            <div className="resumo-item erro">
              <span className="resumo-numero">{resultado.erros}</span>
              <span className="resumo-label">Erros</span>
            </div>
          </div>

          {resultado.detalhes.length > 0 && (
            <div className="resultado-detalhes">
              <h4>Detalhes do processamento</h4>
              <div className="detalhes-lista">
                {resultado.detalhes.map((linha, i) => (
                  <div key={i} className={`detalhe-linha ${linha.status.toLowerCase()}`}>
                    <span className="detalhe-num">#{linha.linha}</span>
                    {statusIcon(linha)}
                    <span className="detalhe-nome">{linha.nome || '—'}</span>
                    <span className="detalhe-status">{statusLabel(linha)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="importacao-footer">
            <Button label="Fechar" icon="pi pi-check" className="btn-salvar" onClick={fechar} />
          </div>
        </div>
      )}
    </Dialog>
  );
}

export default ImportacaoDialog;
