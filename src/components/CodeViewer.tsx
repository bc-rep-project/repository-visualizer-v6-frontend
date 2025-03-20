'use client';

import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaDownload, FaCopy, FaEye, FaEyeSlash, FaWrench, FaTimes } from 'react-icons/fa';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wrapLines, setWrapLines] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  
  useEffect(() => {
    // Detect dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    
    // Detect mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-enable line wrapping on mobile
      if (mobile && !wrapLines) {
        setWrapLines(true);
      }
      // Use smaller font on mobile
      setFontSize(mobile ? 12 : 14);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, [wrapLines]);

  const getLanguage = () => {
    if (!language) {
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
        <div className="font-mono text-sm truncate text-gray-700 dark:text-gray-300 max-w-[50%]">
          {fileName}
        </div>
        <div className="flex space-x-2">
          {!isMobile && (
            <>
              <button
                onClick={() => setLineNumbers(!lineNumbers)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                {lineNumbers ? 'Hide Lines' : 'Show Lines'}
              </button>
              <button
                onClick={() => setWrapLines(!wrapLines)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                {wrapLines ? 'No Wrap' : 'Wrap'}
              </button>
            </>
          )}
          <button
            onClick={copyToClipboard}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md"
            title="Copy to clipboard"
          >
            {copied ? 'Copied!' : <FaCopy />}
          </button>
          <button
            onClick={downloadCode}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md"
            title="Download file"
          >
            <FaDownload />
          </button>
          {isMobile && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-md"
              title="Settings"
            >
              <FaWrench />
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile settings panel */}
      {isMobile && showSettings && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Code Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-500 p-1"
            >
              <FaTimes />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Line Numbers</span>
              <button
                onClick={() => setLineNumbers(!lineNumbers)}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${
                  lineNumbers 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {lineNumbers ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Wrap Lines</span>
              <button
                onClick={() => setWrapLines(!wrapLines)}
                className={`flex items-center justify-center w-8 h-8 rounded-md ${
                  wrapLines 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {wrapLines ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Font Size</span>
              <div className="flex items-center">
                <button
                  onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-l-md"
                >
                  -
                </button>
                <span className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  {fontSize}
                </span>
                <button
                  onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-r-md"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`overflow-auto ${isMobile ? 'max-h-[400px]' : 'max-h-[600px]'}`}>
        <SyntaxHighlighter
          language={getLanguage()}
          style={theme === 'dark' ? vscDarkPlus : vs}
          showLineNumbers={lineNumbers}
          wrapLines={wrapLines}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: `${fontSize}px`,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      
      {/* Mobile footer with basic info */}
      {isMobile && (
        <div className="bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>{getLanguage()}</div>
            <div>{code.split('\n').length} lines</div>
          </div>
        </div>
      )}
    </div>
  );
} 