// components/ARIA/ARIAPanel.jsx
// Right-side sliding panel for ARIA conversations

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Plus, ChevronLeft, MessageSquare, Sparkles } from 'lucide-react';
import ARIAChat from './ARIAChat';
import './ARIAPanel.css';

const ARIAPanel = ({
  isOpen,
  onClose,
  onMinimize,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  onVoiceToggle,
  isListening,
  isLoading,
  isLoadingHistory,
  hasMoreMessages,
  showTips,
  exampleCommands,
  onExampleClick,
  pendingConfirmation,
  onConfirmation,
  onScroll,
  chatContainerRef,
  // Conversation management
  conversations,
  activeConversationId,
  showConversationList,
  onToggleConversationList,
  onNewConversation,
  onSwitchConversation,
  onDeleteConversation
}) => {
  const panelVariants = {
    hidden: {
      x: '100%',
      opacity: 0.8
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200
      }
    },
    exit: {
      x: '100%',
      opacity: 0.8,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300
      }
    }
  };

  const sidebarVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: 220,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200
      }
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - subtle overlay */}
          <motion.div
            className="aria-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={`aria-panel ${showConversationList ? 'with-sidebar' : ''}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Conversation Sidebar */}
            <AnimatePresence>
              {showConversationList && (
                <motion.div
                  className="aria-panel-sidebar"
                  variants={sidebarVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="aria-sidebar-header">
                    <span>Conversations</span>
                    <motion.button
                      className="aria-sidebar-new-btn"
                      onClick={onNewConversation}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="New Chat"
                    >
                      <Plus size={16} />
                    </motion.button>
                  </div>

                  <div className="aria-conversation-list">
                    {conversations.length === 0 ? (
                      <div className="aria-no-conversations">
                        No recent conversations
                      </div>
                    ) : (
                      conversations.map(conv => (
                        <motion.div
                          key={conv.id}
                          className={`aria-conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                          onClick={() => onSwitchConversation(conv.id)}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                        >
                          <div className="aria-conv-title">
                            {conv.title || 'New Conversation'}
                          </div>
                          <div className="aria-conv-preview">
                            {conv.preview || 'No messages yet'}
                          </div>
                          <div className="aria-conv-meta">
                            <span className="aria-conv-date">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </span>
                            <motion.button
                              className="aria-conv-delete"
                              onClick={(e) => onDeleteConversation(conv.id, e)}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              title="Delete"
                            >
                              <X size={12} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Panel Content */}
            <div className="aria-panel-main">
              {/* Header */}
              <div className="aria-panel-header">
                <div className="aria-panel-header-left">
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onToggleConversationList}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={showConversationList ? 'Hide conversations' : 'Show conversations'}
                  >
                    {showConversationList ? <ChevronLeft size={18} /> : <MessageSquare size={18} />}
                  </motion.button>
                  <div className="aria-panel-title">
                    <Sparkles size={18} className="aria-panel-icon" />
                    <span>ARIA</span>
                  </div>
                  {conversations.length > 0 && (
                    <span className="aria-conv-count">({conversations.length})</span>
                  )}
                </div>

                <div className="aria-panel-header-right">
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onNewConversation}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="New Chat"
                  >
                    <Plus size={18} />
                  </motion.button>
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onMinimize || onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Minimize"
                  >
                    <Minimize2 size={18} />
                  </motion.button>
                  <motion.button
                    className="aria-panel-header-btn close"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Close"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>

              {/* Chat Content */}
              <ARIAChat
                ref={chatContainerRef}
                messages={messages}
                inputValue={inputValue}
                onInputChange={onInputChange}
                onSendMessage={onSendMessage}
                onVoiceToggle={onVoiceToggle}
                isListening={isListening}
                isLoading={isLoading}
                isLoadingHistory={isLoadingHistory}
                hasMoreMessages={hasMoreMessages}
                showTips={showTips}
                exampleCommands={exampleCommands}
                onExampleClick={onExampleClick}
                pendingConfirmation={pendingConfirmation}
                onConfirmation={onConfirmation}
                onScroll={onScroll}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ARIAPanel;
