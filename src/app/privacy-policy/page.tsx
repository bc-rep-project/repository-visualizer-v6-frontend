'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Privacy Policy</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Last Updated: June 1, 2023
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Repository Visualizer ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Please read this Privacy Policy carefully. By accessing or using our service, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this Privacy Policy.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Information We Collect</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We may collect the following types of information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Repository Data:</strong> Information about the repositories you analyze, including file structures, code metrics, and other repository-related data.</li>
            <li><strong>Usage Data:</strong> Information about how you use our service, including features accessed, pages visited, and interactions with the application.</li>
            <li><strong>Technical Data:</strong> Information about your device, browser, IP address, and other technical details when accessing our service.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            We do not collect or store the actual source code from your repositories. Our analysis is performed locally and only metadata is saved.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We may use the information we collect for various purposes, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Providing, maintaining, and improving our service</li>
            <li>Analyzing usage patterns to enhance user experience</li>
            <li>Detecting and addressing technical issues</li>
            <li>Sending service-related notifications and updates</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Email: <a href="mailto:privacy@repository-visualizer.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@repository-visualizer.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
} 