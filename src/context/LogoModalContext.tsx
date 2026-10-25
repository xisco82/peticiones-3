import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LogoViewerModal } from '../components/LogoViewerModal';

interface LogoModalContextType {
  isLogoModalOpen: boolean;
  openLogoModal: () => void;
  closeLogoModal: () => void;
}

const LogoModalContext = createContext<LogoModalContextType | undefined>(undefined);

export const LogoModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  const openLogoModal = () => setIsLogoModalOpen(true);
  const closeLogoModal = () => setIsLogoModalOpen(false);

  return (
    <LogoModalContext.Provider value={{ isLogoModalOpen, openLogoModal, closeLogoModal }}>
      {children}
      <LogoViewerModal isOpen={isLogoModalOpen} onClose={closeLogoModal} />
    </LogoModalContext.Provider>
  );
};

export const useLogoModal = (): LogoModalContextType => {
  const context = useContext(LogoModalContext);
  if (!context) {
    throw new Error('useLogoModal must be used within a LogoModalProvider');
  }
  return context;
};
