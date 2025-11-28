// components/ARIA/ARIAAssistant.jsx
// Main orchestrator component - Pill + Panel Architecture
// Redesigned for non-intrusive, delightful UX

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ARIAPill from './ARIAPill';
import ARIAPanel from './ARIAPanel';
import ARIAFlyingMessage from './ARIAFlyingMessage';

// Hook
import useARIA, { EXAMPLE_COMMANDS } from './useARIA';

// Styles
import './ARIAAssistant.css';

const ARIAAssistant = () => {
  const {
    // UI State
    isPillFocused,
    isPanelOpen,
    isListening,
    isLoading,
    isHidden,

    // Animation State
    flyingMessage,
    flyingMessagePosition,

    // Chat State
    conversations,
    activeConversationId,
    chatHistory,
    pendingConfirmation,

    // Input State
    pillInput,
    setPillInput,
    panelInput,
    setPanelInput,

    // Pagination State
    hasMoreMessages,
    isLoadingHistory,
    showTips,
    showConversationList,
    setShowConversationList,

    // Refs
    pillRef,
    chatContainerRef,

    // Actions
    focusPill,
    blurPill,
    closePanel,
    toggleVoiceRecognition,
    handleSendMessage,
    handleConfirmation,
    handleExampleClick,
    handleScroll,
    startNewConversation,
    switchConversation,
    deleteConversation,
    showARIA,
  } = useARIA();

  // Hidden state - show restore button
  if (isHidden) {
    return (
      <motion.div
        className="aria-restore-button"
        onClick={showARIA}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare size={20} />
      </motion.div>
    );
  }

  return (
    <div className="aria-assistant-v2">
      {/* Pill - Always visible at top center */}
      <ARIAPill
        ref={pillRef}
        value={pillInput}
        onChange={setPillInput}
        onSubmit={(message) => handleSendMessage(message, 'pill')}
        onVoiceToggle={toggleVoiceRecognition}
        onFocus={focusPill}
        onBlur={blurPill}
        isListening={isListening}
        isPanelOpen={isPanelOpen}
        isFocused={isPillFocused}
        disabled={isLoading}
      />

      {/* Flying Message Animation */}
      <ARIAFlyingMessage
        message={flyingMessage}
        startPosition={flyingMessagePosition}
        isVisible={!!flyingMessage}
        onAnimationComplete={() => {}}
      />

      {/* Panel - Slides from right */}
      <ARIAPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        onMinimize={closePanel}
        messages={chatHistory}
        inputValue={panelInput}
        onInputChange={setPanelInput}
        onSendMessage={handleSendMessage}
        onVoiceToggle={toggleVoiceRecognition}
        isListening={isListening}
        isLoading={isLoading}
        isLoadingHistory={isLoadingHistory}
        hasMoreMessages={hasMoreMessages}
        showTips={showTips}
        exampleCommands={EXAMPLE_COMMANDS}
        onExampleClick={handleExampleClick}
        pendingConfirmation={pendingConfirmation}
        onConfirmation={handleConfirmation}
        onScroll={handleScroll}
        chatContainerRef={chatContainerRef}
        // Conversation management
        conversations={conversations}
        activeConversationId={activeConversationId}
        showConversationList={showConversationList}
        onToggleConversationList={() => setShowConversationList(!showConversationList)}
        onNewConversation={startNewConversation}
        onSwitchConversation={switchConversation}
        onDeleteConversation={deleteConversation}
      />
    </div>
  );
};

export default ARIAAssistant;
