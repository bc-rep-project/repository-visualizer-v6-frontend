'use client';

import React from 'react';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function NotificationProviderWrapper({ children }: { children: React.ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
} 