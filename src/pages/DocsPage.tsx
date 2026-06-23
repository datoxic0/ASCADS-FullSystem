import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Book, FileText, Scale, ChevronRight, Terminal, Menu } from 'lucide-react';

// Eagerly import all Markdown files from the root, Legal, and public folders as raw text
const rawDocsRoot = import.meta.glob('../../*.md', { query: '?raw', import: 'default', eager: true });
const rawDocsLegal = import.meta.glob('../../Legal/*.md', { query: '?raw', import: 'default', eager: true });
const rawDocsPublic = import.meta.glob('../../public/**/*.md', { query: '?raw', import: 'default', eager: true });

const allDocs = { ...rawDocsRoot, ...rawDocsLegal, ...rawDocsPublic };

type DocItem = {
  path: string;
  name: string;
  content: string;
  category: 'System' | 'Legal';
};

export default function DocsPage() {
  const docs = useMemo(() => {
    return Object.entries(allDocs)
      .map(([path, content]) => {
        const isLegal = path.includes('/Legal/');
        const filename = path.split('/').pop() || '';
        // Pretty print the name
        let name = filename.replace('.md', '');
        if (name === 'ASCADS_DEVELOPER_VISION') name = 'Developer Vision';
        else if (name === 'ENGIGRAPH_3D_MANUAL') name = 'EngiGraph 3D Manual';
        else if (name === 'veo_license_package (1)') name = 'VEO License Package';
        else if (name === 'ENGIGRAPH_BUILD_KNOWLEDGE') name = 'EngiGraph Build Knowledge';
        else if (name === 'README') name = 'System README';
        else name = name.replace(/_/g, ' ');

        return {
          path,
          name,
          content: content as string,
          category: isLegal ? 'Legal' : 'System'
        } as DocItem;
      })
      .filter(doc => doc.name.toLowerCase() !== 'myfooter' && doc.name.toLowerCase() !== 'task' && doc.name.toLowerCase() !== 'implementation plan' && doc.name.toLowerCase() !== 'walkthrough')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const systemDocs = docs.filter(d => d.category === 'System');
  const legalDocs = docs.filter(d => d.category === 'Legal');

  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(docs.find(d => d.name === 'Developer Vision') || docs[0] || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 border-r border-slate-800/60 bg-slate-900/40 shrink-0`}>
        <div className="p-4 border-b border-slate-800/60 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Book className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">System Docs</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Knowledge Base</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* System Section */}
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Core Architecture
            </div>
            {systemDocs.map(doc => (
              <button
                key={doc.path}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selectedDoc?.path === doc.path 
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileText className={`w-4 h-4 shrink-0 ${selectedDoc?.path === doc.path ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">{doc.name}</span>
                {selectedDoc?.path === doc.path && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </button>
            ))}
          </div>

          {/* Legal Section */}
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5" />
              Legal & Licensing
            </div>
            {legalDocs.map(doc => (
              <button
                key={doc.path}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  selectedDoc?.path === doc.path 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <FileText className={`w-4 h-4 shrink-0 ${selectedDoc?.path === doc.path ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate">{doc.name}</span>
                {selectedDoc?.path === doc.path && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {selectedDoc ? (
          <>
            <header className="h-14 border-b border-slate-800/60 flex items-center px-6 shrink-0 bg-slate-900/20 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-slate-500">{selectedDoc.category}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <span className="text-slate-200 font-semibold">{selectedDoc.name}</span>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <article className="prose prose-invert prose-slate max-w-none 
                  prose-headings:text-slate-100 prose-headings:font-bold
                  prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300 hover:prose-a:underline
                  prose-strong:text-slate-200 prose-strong:font-bold
                  prose-code:text-emerald-300 prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-800/60 prose-pre:shadow-xl
                  prose-blockquote:border-indigo-500/50 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-hr:border-slate-800
                  prose-table:border-collapse prose-th:bg-slate-800/50 prose-th:p-3 prose-th:text-left prose-td:p-3 prose-td:border-t prose-td:border-slate-800/50">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDoc.content}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-4">
              <Book className="w-12 h-12 opacity-20" />
              <p>No documentation found.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
