// GlassModal.js
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';

const GlassModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  closeOnOverlayClick = true,
  size = 'md',
  ...props 
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnOverlayClick={closeOnOverlayClick}
      isCentered
      size={size}
      {...props}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        color="white"
      >
        {title && (
          <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.18)">
            {title}
          </ModalHeader>
        )}
        <ModalCloseButton />
        <ModalBody>
          {children}
        </ModalBody>
        {footer && (
          <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.18)">
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default GlassModal;