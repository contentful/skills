export type OptimizationRuntime =
  | 'react-web'
  | 'nextjs-app-router'
  | 'nextjs-pages-router'
  | 'web'
  | 'node'
  | 'react-native'
  | 'unknown';

const RUNTIME_REFERENCES: Record<Exclude<OptimizationRuntime, 'unknown'>, string> = {
  'react-web': 'optimization-react-web.md',
  'nextjs-app-router': 'optimization-nextjs-app-router.md',
  'nextjs-pages-router': 'optimization-nextjs-pages-router.md',
  web: 'optimization-web.md',
  node: 'optimization-node.md',
  'react-native': 'optimization-react-native.md',
};

interface OptimizationReferenceContext {
  framework: string;
  routerType?: string;
  architecture?: string;
  runtime?: OptimizationRuntime;
}

export function getOptimizationRuntimeReferences({
  framework,
  routerType,
  architecture,
  runtime,
}: OptimizationReferenceContext): string[] {
  const normalizedFramework = framework.toLowerCase();
  const normalizedRouter = routerType?.toLowerCase();

  if (runtime && runtime !== 'unknown') {
    if (
      (runtime === 'nextjs-app-router' || runtime === 'nextjs-pages-router') &&
      (normalizedRouter === 'hybrid' || /next.*hybrid/.test(normalizedFramework))
    ) {
      return [RUNTIME_REFERENCES['nextjs-app-router'], RUNTIME_REFERENCES['nextjs-pages-router']];
    }

    const references = [RUNTIME_REFERENCES[runtime]];
    if (architecture === 'hybrid-ssr' && (runtime === 'react-web' || runtime === 'web')) {
      references.push(RUNTIME_REFERENCES.node);
    }
    return references;
  }

  if (/react.?native|expo|metro/.test(normalizedFramework)) {
    return [RUNTIME_REFERENCES['react-native']];
  }

  if (/next/.test(normalizedFramework)) {
    if (normalizedRouter === 'hybrid' || /hybrid/.test(normalizedFramework)) {
      return [RUNTIME_REFERENCES['nextjs-app-router'], RUNTIME_REFERENCES['nextjs-pages-router']];
    }
    if (normalizedRouter === 'pages' || /pages/.test(normalizedFramework)) {
      return [RUNTIME_REFERENCES['nextjs-pages-router']];
    }
    return [RUNTIME_REFERENCES['nextjs-app-router']];
  }

  if (/node|express|fastify|server/.test(normalizedFramework) || architecture === 'server-only') {
    return [RUNTIME_REFERENCES.node];
  }

  if (/react|gatsby|remix/.test(normalizedFramework)) {
    return architecture === 'hybrid-ssr'
      ? [RUNTIME_REFERENCES['react-web'], RUNTIME_REFERENCES.node]
      : [RUNTIME_REFERENCES['react-web']];
  }

  return architecture === 'hybrid-ssr' ? [RUNTIME_REFERENCES.web, RUNTIME_REFERENCES.node] : [RUNTIME_REFERENCES.web];
}

export function getOptimizationReferenceFiles(context: OptimizationReferenceContext): string[] {
  return ['optimization-shared.md', ...getOptimizationRuntimeReferences(context)];
}
