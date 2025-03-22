'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function TermsOfUsePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Terms of Use</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Last Updated: June 1, 2023
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            These Terms of Use constitute a legally binding agreement made between you and Repository Visualizer, concerning your access to and use of our service.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            By accessing or using our service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree with these terms, you must not access or use our service.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">User Responsibilities</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            By using Repository Visualizer, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Provide accurate information when using our service</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Not attempt to interfere with the proper functioning of the service</li>
            <li>Not use the service for any illegal or unauthorized purpose</li>
            <li>Not infringe upon the intellectual property rights of others</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Intellectual Property</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The Repository Visualizer service, including its features, functionality, content, and underlying technology, is owned by us and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You are granted a limited, non-exclusive, non-transferable, revocable license to access and use our service strictly in accordance with these Terms of Use.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Limitation of Liability</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Repository Visualizer provides the service on an "as is" and "as available" basis. We do not make any warranties, expressed or implied, regarding the operation or availability of the service.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            In no event shall Repository Visualizer be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our service.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you have questions or concerns about these Terms of Use, please contact us at:
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Email: <a href="mailto:legal@repository-visualizer.com" className="text-blue-600 dark:text-blue-400 hover:underline">legal@repository-visualizer.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
} 