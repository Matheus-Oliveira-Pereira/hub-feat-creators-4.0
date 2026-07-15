import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import './styles.scss';

const VIEWPORT = 320; // px do quadro de recorte na tela

interface Props {
  visible: boolean;
  /** Imagem a recortar, como data URL. */
  src: string | null;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
  /** Lado do quadrado de saída em px. */
  saida?: number;
  qualidade?: number;
}

/** Recortador quadrado (1:1) em canvas: arrastar para posicionar + zoom. Sem dependências externas. */
function ImageCropper({ visible, src, onCrop, onCancel, saida = 900, qualidade = 0.72 }: Readonly<Props>) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const arrasto = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Escala base para "cobrir" o viewport (menor lado preenche o quadro).
  const escalaBase = nat ? VIEWPORT / Math.min(nat.w, nat.h) : 1;
  const escala = escalaBase * zoom;
  const dispW = nat ? nat.w * escala : 0;
  const dispH = nat ? nat.h * escala : 0;

  const clampar = useCallback((x: number, y: number) => {
    const minX = VIEWPORT - dispW;
    const minY = VIEWPORT - dispH;
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y)),
    };
  }, [dispW, dispH]);

  // Ao carregar imagem/abrir: centraliza.
  useEffect(() => {
    if (!visible || !src) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.width, h: img.height });
      setZoom(1);
      const base = VIEWPORT / Math.min(img.width, img.height);
      setOffset({ x: (VIEWPORT - img.width * base) / 2, y: (VIEWPORT - img.height * base) / 2 });
    };
    img.src = src;
  }, [visible, src]);

  // Re-clampa ao mudar zoom.
  useEffect(() => {
    if (nat) setOffset((o) => clampar(o.x, o.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, nat]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    arrasto.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!arrasto.current) return;
    const dx = e.clientX - arrasto.current.x;
    const dy = e.clientY - arrasto.current.y;
    setOffset(clampar(arrasto.current.ox + dx, arrasto.current.oy + dy));
  };
  const onPointerUp = () => { arrasto.current = null; };

  const confirmar = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    const canvas = document.createElement('canvas');
    canvas.width = saida;
    canvas.height = saida;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mapeia a janela visível (VIEWPORT) para o source da imagem.
    const sourceSize = VIEWPORT / escala;
    const sourceX = -offset.x / escala;
    const sourceY = -offset.y / escala;
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, saida, saida);
    onCrop(canvas.toDataURL('image/jpeg', qualidade));
  };

  const footer = (
    <div className="cropper-footer">
      <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={onCancel} />
      <Button label="Recortar" icon="pi pi-check" onClick={confirmar} disabled={!nat} />
    </div>
  );

  return (
    <Dialog
      header={<span><i className="pi pi-crop" /> Recortar foto</span>}
      visible={visible}
      onHide={onCancel}
      footer={footer}
      style={{ width: '400px' }}
      modal
      draggable={false}
      baseZIndex={10000}
      className="image-cropper-dialog"
    >
      <p className="cropper-ajuda">Arraste para posicionar e use o zoom. A área visível será a foto quadrada.</p>
      <div
        className="cropper-viewport"
        style={{ width: VIEWPORT, height: VIEWPORT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {src && nat && (
          <img
            src={src}
            alt="Recorte"
            draggable={false}
            style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
          />
        )}
      </div>
      <div className="cropper-zoom">
        <i className="pi pi-search-minus" />
        <Slider value={zoom} onChange={(e) => setZoom(e.value as number)} min={1} max={4} step={0.01} className="cropper-slider" />
        <i className="pi pi-search-plus" />
      </div>
    </Dialog>
  );
}

export default ImageCropper;
