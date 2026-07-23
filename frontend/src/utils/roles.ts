export const ROLE_SUFFIX = {
  ADD: 'A',
  BROWSE: 'B',
  CHANGE: 'C',
  DELETE: 'D',
} as const;

export const MODULES = {
  USUARIOS: { prefix: 'USR', path: '/usuarios' },
  PERFIS: { prefix: 'PRF', path: '/perfis' },
  INFLUENCIADORES: { prefix: 'INF', path: '/influenciadores' },
  MARCAS: { prefix: 'MRC', path: '/marcas' },
  MIDIA_KIT: { prefix: 'MDK', path: '/midia-kits' },
  CONFIGURACOES: { prefix: 'CFG', path: '/configuracoes' },
  CONTAS_EMAIL: { prefix: 'CTE', path: '/contas-email' },
  EMAIL_LOGS: { prefix: 'EML', path: '/email-logs' },
  PROSPECAO: { prefix: 'PSP', path: '/prospecao' },
  PUBLICIDADE: { prefix: 'PUB', path: '/publicidade' },
  TAREFAS: { prefix: 'TAR', path: '/tarefas' },
  TEMPLATES_EMAIL: { prefix: 'TME', path: '/templates-email' },
  METRICAS: { prefix: 'MET', path: '/metricas' },
} as const;

export function hasRole(userRoles: string[], modulePrefix: string, action: string): boolean {
  return userRoles.includes(modulePrefix + action);
}

export function canBrowse(userRoles: string[], modulePrefix: string): boolean {
  return hasRole(userRoles, modulePrefix, ROLE_SUFFIX.BROWSE);
}

export function canAdd(userRoles: string[], modulePrefix: string): boolean {
  return hasRole(userRoles, modulePrefix, ROLE_SUFFIX.ADD);
}

export function canChange(userRoles: string[], modulePrefix: string): boolean {
  return hasRole(userRoles, modulePrefix, ROLE_SUFFIX.CHANGE);
}

export function canDelete(userRoles: string[], modulePrefix: string): boolean {
  return hasRole(userRoles, modulePrefix, ROLE_SUFFIX.DELETE);
}

export function getModulePrefixByPath(path: string): string | null {
  const mod = Object.values(MODULES).find((m) => m.path === path);
  return mod?.prefix ?? null;
}
