import { useState, useEffect, useCallback } from 'react';
import { TOOLS_DATA } from '../data/toolsData';
import { ToolItem } from '../types';

function extractToolIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check hash first: e.g. #/merge-pdf or #merge-pdf
  const hash = window.location.hash;
  if (hash) {
    const cleanHash = hash.replace(/^#\/?/, '').split('?')[0].trim();
    if (cleanHash && TOOLS_DATA.some((t) => t.id === cleanHash)) {
      return cleanHash;
    }
  }

  // 2. Check query parameter: e.g. ?tool=merge-pdf or ?/merge-pdf
  const searchParams = new URLSearchParams(window.location.search);
  const toolParam = searchParams.get('tool');
  if (toolParam && TOOLS_DATA.some((t) => t.id === toolParam)) {
    return toolParam;
  }

  // 3. Check pathname: e.g. /merge-pdf or /repo-name/merge-pdf
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    // Check from last segment backwards to handle sub-paths
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const segment = decodeURIComponent(pathParts[i]).trim();
      const match = TOOLS_DATA.find((t) => t.id === segment);
      if (match) {
        return match.id;
      }
    }
  }

  return null;
}

function getSubpathPrefix(): string {
  if (typeof window === 'undefined') return '';
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // If the last part is a known tool, remove it from the subpath
  if (pathParts.length > 0) {
    const lastPart = decodeURIComponent(pathParts[pathParts.length - 1]);
    if (TOOLS_DATA.some((t) => t.id === lastPart)) {
      pathParts.pop();
    }
  }
  return pathParts.length > 0 ? '/' + pathParts.join('/') : '';
}

export function useRouter() {
  const [activeToolId, setActiveToolId] = useState<string | null>(() => extractToolIdFromLocation());

  const activeTool: ToolItem | null = activeToolId
    ? TOOLS_DATA.find((t) => t.id === activeToolId) || null
    : null;

  // Sync state on browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const matched = extractToolIdFromLocation();
      setActiveToolId(matched);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Update document title dynamically
  useEffect(() => {
    if (activeTool) {
      document.title = `${activeTool.name} - Free Online Tool | Hello PDF`;
    } else {
      document.title = 'Hello PDF - 100+ Free Online PDF Tools';
    }
  }, [activeTool]);

  const navigateToTool = useCallback((toolOrId: ToolItem | string) => {
    const id = typeof toolOrId === 'string' ? toolOrId : toolOrId.id;
    const found = TOOLS_DATA.find((t) => t.id === id);
    if (!found) return;

    setActiveToolId(found.id);

    const prefix = getSubpathPrefix();
    const newUrl = `${prefix}/${found.id}`;

    try {
      window.history.pushState({ toolId: found.id }, '', newUrl);
    } catch {
      // Fallback for strict sandbox/iframe environments
      window.location.hash = `/${found.id}`;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateHome = useCallback(() => {
    setActiveToolId(null);
    const prefix = getSubpathPrefix();
    const homeUrl = prefix ? `${prefix}/` : '/';

    try {
      window.history.pushState({}, '', homeUrl);
    } catch {
      window.location.hash = '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    activeToolId,
    activeTool,
    navigateToTool,
    navigateHome,
  };
}
