// Augmentation: o projeto passa baseZIndex para Dropdown/MultiSelect dentro de Dialogs
// (convenção do CLAUDE.md — painel portado pro body precisa de z-index acima do modal),
// mas os typings do PrimeReact 10 não declaram a prop nesses componentes.
import 'primereact/dropdown';
import 'primereact/multiselect';

declare module 'primereact/dropdown' {
  interface DropdownProps {
    baseZIndex?: number;
  }
}

declare module 'primereact/multiselect' {
  interface MultiSelectProps {
    baseZIndex?: number;
  }
}
