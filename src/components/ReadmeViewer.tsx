import React, { useState, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface ReadmeViewerProps {
  content: string;
  filename?: string;
}

const ReadmeViewer: React.FC<ReadmeViewerProps> = ({ content, filename = 'README.md' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to decode base64 content if needed
  const decodeContent = () => {
    try {
      // GitHub API returns base64 encoded content
      if (content.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/)) {
        return atob(content);
      }
      return content;
    } catch (error) {
      console.error('Error decoding content:', error);
      return content;
    }
  };
  
  const decodedContent = decodeContent();
  const displayContent = isExpanded ? decodedContent : decodedContent.split('\n').slice(0, 20).join('\n');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium dark:text-white">{filename}</h3>
        {decodedContent.split('\n').length > 20 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = props.inline;
              
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {displayContent}
        </ReactMarkdown>
        
        {!isExpanded && decodedContent.split('\n').length > 20 && (
          <div className="mt-2 text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Show more content...
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadmeViewer;