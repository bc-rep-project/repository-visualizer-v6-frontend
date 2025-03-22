'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">About Repository Visualizer</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Repository Visualizer is a powerful tool designed to help developers, teams, and organizations better understand and navigate their codebases through advanced visualization techniques.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our mission is to make complex codebases more accessible and understandable, enabling developers to identify patterns, dependencies, and potential issues more efficiently.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Key Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Multiple visualization types (Graph, Tree, Sunburst, Packed Circles)</li>
            <li>Code metrics and analysis</li>
            <li>Function and class exploration</li>
            <li>Directory structure visualization</li>
            <li>Language and file type statistics</li>
            <li>Interactive filtering and search capabilities</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We're always looking to improve Repository Visualizer. If you have any questions, suggestions, or feedback, please don't hesitate to reach out to us.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Email: <a href="mailto:support@repository-visualizer.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@repository-visualizer.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
} 