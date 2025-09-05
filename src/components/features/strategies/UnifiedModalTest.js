// Test component to verify unified modal functionality
import React, { useState } from 'react';
import { Button, VStack, useDisclosure } from '@chakra-ui/react';
import ActivateStrategyModal from './ActivateStrategyModal';

const UnifiedModalTest = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [testScenario, setTestScenario] = useState('webhook');
  
  // Mock data for testing
  const mockWebhookStrategy = {
    id: 'webhook_1',
    strategy_type: 'webhook',
    source_id: 'test_webhook_token',
    name: 'Test Webhook Strategy',
    category: 'TradingView Webhook'
  };
  
  const mockEngineStrategy = {
    id: 'engine_1', 
    strategy_type: 'engine',
    source_id: 5,
    name: 'Test Engine Strategy',
    category: 'Strategy Engine'
  };
  
  const mockStrategyCodes = [
    {
      id: 1,
      name: 'momentum_scalper',
      description: 'High-frequency momentum trading',
      is_active: true,
      is_validated: true
    },
    {
      id: 2,
      name: 'mean_reversion',
      description: 'Mean reversion strategy',
      is_active: true,
      is_validated: false
    }
  ];

  const handleSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return (
    <VStack spacing={4} p={6}>
      <Button onClick={() => { setTestScenario('webhook'); onOpen(); }}>
        Test Webhook Strategy Modal
      </Button>
      <Button onClick={() => { setTestScenario('engine'); onOpen(); }}>
        Test Engine Strategy Modal
      </Button>
      <Button onClick={() => { setTestScenario('marketplace_webhook'); onOpen(); }}>
        Test Marketplace Webhook
      </Button>
      <Button onClick={() => { setTestScenario('marketplace_engine'); onOpen(); }}>
        Test Marketplace Engine
      </Button>
      
      <ActivateStrategyModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        strategy={null}
        marketplaceStrategy={
          testScenario === 'marketplace_webhook' ? mockWebhookStrategy :
          testScenario === 'marketplace_engine' ? mockEngineStrategy :
          null
        }
        strategyCodes={mockStrategyCodes}
      />
    </VStack>
  );
};

export default UnifiedModalTest;