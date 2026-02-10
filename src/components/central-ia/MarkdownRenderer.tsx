import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../utils/cn';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Componente para renderizar markdown de forma elegante
 * Suporta: negrito, itálico, listas, código, links, tabelas
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
  isUser = false
}: MarkdownRendererProps) {
  // Pré-processa o conteúdo para limpar caracteres problemáticos
  const processedContent = preprocessMarkdown(content);

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Parágrafos
          p: ({ children }) => (
            <p className={cn(
              'mb-2 last:mb-0 leading-relaxed',
              isUser ? 'text-white' : 'text-slate-700'
            )}>
              {children}
            </p>
          ),

          // Negrito
          strong: ({ children }) => (
            <strong className={cn(
              'font-semibold',
              isUser ? 'text-white' : 'text-slate-900'
            )}>
              {children}
            </strong>
          ),

          // Itálico
          em: ({ children }) => (
            <em className={cn(
              'italic',
              isUser ? 'text-white/90' : 'text-slate-600'
            )}>
              {children}
            </em>
          ),

          // Headers
          h1: ({ children }) => (
            <h3 className={cn(
              'text-lg font-bold mb-2 mt-3 first:mt-0',
              isUser ? 'text-white' : 'text-slate-800'
            )}>
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className={cn(
              'text-base font-bold mb-2 mt-3 first:mt-0',
              isUser ? 'text-white' : 'text-slate-800'
            )}>
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className={cn(
              'text-sm font-bold mb-1.5 mt-2 first:mt-0',
              isUser ? 'text-white' : 'text-slate-800'
            )}>
              {children}
            </h5>
          ),

          // Listas não ordenadas
          ul: ({ children }) => (
            <ul className={cn(
              'space-y-1.5 mb-3 last:mb-0 pl-1',
              isUser ? 'text-white' : 'text-slate-700'
            )}>
              {children}
            </ul>
          ),

          // Listas ordenadas
          ol: ({ children }) => (
            <ol className={cn(
              'space-y-1.5 mb-3 last:mb-0 pl-1',
              isUser ? 'text-white' : 'text-slate-700'
            )}>
              {children}
            </ol>
          ),

          // Items de lista
          li: ({ children, node, ...props }) => {
            // Verifica se está dentro de uma ol (lista ordenada)
            const isOrdered = node?.position?.start?.line !== undefined &&
              props.index !== undefined;
            const index = (props.index as number) ?? 0;

            return (
              <li className={cn(
                'flex items-start gap-2 leading-relaxed',
                isUser ? 'text-white' : 'text-slate-700'
              )}>
                {/* Bullet ou número */}
                <span className={cn(
                  'flex-shrink-0 font-medium',
                  isUser ? 'text-white/80' : 'text-coral-500'
                )}>
                  {isOrdered ? `${index + 1}.` : '•'}
                </span>
                <span className="flex-1">{children}</span>
              </li>
            );
          },

          // Código inline e blocos
          code: ({ children, className: codeClassName }) => {
            const isCodeBlock = codeClassName?.includes('language-');

            if (isCodeBlock) {
              return (
                <code className={cn(
                  'block bg-slate-800 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto my-2',
                  codeClassName
                )}>
                  {children}
                </code>
              );
            }

            return (
              <code className={cn(
                'px-1.5 py-0.5 rounded text-xs font-mono',
                isUser
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-coral-600'
              )}>
                {children}
              </code>
            );
          },

          // Blocos de código
          pre: ({ children }) => (
            <pre className="my-2 overflow-hidden rounded-lg">
              {children}
            </pre>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'underline underline-offset-2 transition-colors',
                isUser
                  ? 'text-white hover:text-white/80'
                  : 'text-coral-600 hover:text-coral-700'
              )}
            >
              {children}
            </a>
          ),

          // Citações
          blockquote: ({ children }) => (
            <blockquote className={cn(
              'border-l-3 pl-3 my-2 italic',
              isUser
                ? 'border-white/50 text-white/90'
                : 'border-coral-300 text-slate-600 bg-coral-50/50 py-1 rounded-r'
            )}>
              {children}
            </blockquote>
          ),

          // Linha horizontal
          hr: () => (
            <hr className={cn(
              'my-3 border-t',
              isUser ? 'border-white/30' : 'border-slate-200'
            )} />
          ),

          // Tabelas
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className={cn(
                'w-full text-sm border-collapse',
                isUser ? 'text-white' : 'text-slate-700'
              )}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={cn(
              isUser ? 'bg-white/10' : 'bg-slate-50'
            )}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className={cn(
              'border-b',
              isUser ? 'border-white/20' : 'border-slate-200'
            )}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={cn(
              'px-3 py-2 text-left font-semibold',
              isUser ? 'text-white' : 'text-slate-800'
            )}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn(
              'px-3 py-2',
              isUser ? 'text-white' : 'text-slate-700'
            )}>
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

/**
 * Pré-processa markdown para limpar caracteres problemáticos
 * e melhorar a formatação
 */
function preprocessMarkdown(content: string): string {
  if (!content) return '';

  let processed = content;

  // Remove TODOS os asteriscos simples (mantém apenas ** para bold)
  // Primeiro, protege os ** (bold) substituindo temporariamente
  processed = processed.replace(/\*\*/g, '§§BOLD§§');

  // Remove todos os asteriscos simples restantes
  processed = processed.replace(/\*/g, '');

  // Restaura os ** (bold)
  processed = processed.replace(/§§BOLD§§/g, '**');

  // Remove múltiplos ### e substitui por formatação correta
  processed = processed.replace(/^#{4,}\s*/gm, '### ');

  // Remove linhas com apenas --- ou === (separadores indesejados)
  processed = processed.replace(/^[-=]{3,}$/gm, '');

  // Remove || e ||| que não são tabelas válidas
  processed = processed.replace(/\|{2,}/g, ' ');

  // Limpa linhas que são apenas pipes sem conteúdo
  processed = processed.replace(/^\|\s*\|$/gm, '');

  // Converte bullets com hífen seguido de espaço extra
  processed = processed.replace(/^-\s{2,}/gm, '- ');

  // Limpa múltiplas linhas em branco
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
}
