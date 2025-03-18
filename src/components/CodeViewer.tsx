'use client';

import React, { useState } from 'react';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSettings } from '@/contexts/SettingsContext';
import { FaDownload, FaCopy } from 'react-icons/fa';

interface CodeViewerProps {
  code: string;
  language: string;
  fileName: string;
}

const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  php: 'php',
  cs: 'csharp',
  cpp: 'cpp',
  c: 'c',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  md: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  txt: 'text',
};

export default function CodeViewer({ code, language, fileName }: CodeViewerProps) {
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);

  // Determine language for syntax highlighting
  const getLanguage = () => {
    if (!language) {
      // Try to determine from file extension
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      return languageMap[ext] || 'text';
    }
    return languageMap[language.toLowerCase()] || language.toLowerCase();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center">
        <div className="font-mono text-sm text-gray-700 dark:text-gray-300">{fileName}</div>
        <div className="flex space-x-2">
          <button
            onClick={() => setLineNumbers(!lineNumbers)}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            {lineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}
          </button>
          <button
            onClick={() => setWrapLines(!wrapLines)}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            {wrapLines ? 'Disable Line Wrap' : 'Enable Line Wrap'}
          </button>
          <button
            onClick={copyToClipboard}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
          >
            {copied ? 'Copied!' : <FaCopy />}
          </button>
          <button
            onClick={downloadCode}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            title="Download file"
          >
            <FaDownload />
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[600px]">
        <SyntaxHighlighter
          language={getLanguage()}
          style={settings?.theme?.mode === 'dark' ? vscDarkPlus : vs}
          showLineNumbers={lineNumbers}
          wrapLines={wrapLines}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            backgroundColor: settings?.theme?.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
} 