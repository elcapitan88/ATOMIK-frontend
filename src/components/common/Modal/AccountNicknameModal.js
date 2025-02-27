import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  Input,
} from '@chakra-ui/react';

const AccountNicknameModal = ({ isOpen, onClose, account, onSave }) => {
  // Use nickname as primary, fallback to name if nickname isn't set
  const [nickname, setNickname] = useState(account?.nickname || account?.name || '');

  const handleSave = () => {
    onSave(account.account_id, nickname);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(5px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.1)"
        backdropFilter="blur(10px)"
        boxShadow="0 8px 32px 0 rgba(0, 198, 224, 0.37)"
        border="1px solid rgba(255, 255, 255, 0.18)"
        borderRadius="xl"
        maxW="400px"
      >
        <ModalHeader 
          borderBottom="1px solid rgba(255, 255, 255, 0.18)" 
          pb={4}
          color="white"
        >
          Edit Account Nickname
        </ModalHeader>
        <ModalCloseButton color="white" />
        
        <ModalBody pt={6} pb={6}>
          <FormControl>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter account nickname"
              bg="whiteAlpha.100"
              color="white"
              borderColor="whiteAlpha.300"
              _hover={{ borderColor: "whiteAlpha.400" }}
              _focus={{ borderColor: "blue.300", boxShadow: "none" }}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter 
          borderTop="1px solid rgba(255, 255, 255, 0.18)"
          pt={4}
        >
          <Button
            variant="ghost"
            mr={3}
            onClick={onClose}
            color="white"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            Cancel
          </Button>
          <Button
            bg="blue.500"
            _hover={{ bg: 'blue.600' }}
            onClick={handleSave}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AccountNicknameModal;