// components/ARIA/ARIAPanel.jsx
// Right-side sliding panel for ARIA conversations
// Enhanced with polished animations

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
  // Panel slide animation with refined spring physics
  const panelVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
      scale: 0.95
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 28,
        stiffness: 280,
        mass: 0.8,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: {
      x: '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        type: 'spring',
        damping: 35,
        stiffness: 400,
        mass: 0.5
      }
    }
  };

  // Header elements animation
  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  // Sidebar slide animation
  const sidebarVariants = {
    hidden: {
      width: 0,
      opacity: 0,
      x: -20
    },
    visible: {
      width: 220,
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 250,
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    },
    exit: {
      width: 0,
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  // Conversation item animation
  const conversationItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  // Title sparkle animation
  const sparkleVariants = {
    animate: {
      rotate: [0, 10, -10, 5, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Panel - No backdrop for push layout */}
          <motion.div
            className={`aria-panel ${showConversationList ? 'with-sidebar' : ''}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Conversation Sidebar */}
            <AnimatePresence mode="wait">
              {showConversationList && (
                <motion.div
                  className="aria-panel-sidebar"
                  variants={sidebarVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="aria-sidebar-header"
                    variants={headerVariants}
                  >
                    <span>Conversations</span>
                    <motion.button
                      className="aria-sidebar-new-btn"
                      onClick={onNewConversation}
                      whileHover={{ scale: 1.15, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      title="New Chat"
                    >
                      <Plus size={16} />
                    </motion.button>
                  </motion.div>

                  <div className="aria-conversation-list">
                    {conversations.length === 0 ? (
                      <motion.div
                        className="aria-no-conversations"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        No recent conversations
                      </motion.div>
                    ) : (
                      conversations.map((conv, index) => (
                        <motion.div
                          key={conv.id}
                          className={`aria-conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                          onClick={() => onSwitchConversation(conv.id)}
                          variants={conversationItemVariants}
                          whileHover={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            x: 4,
                            transition: { duration: 0.15 }
                          }}
                          whileTap={{ scale: 0.98 }}
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
                              whileHover={{ scale: 1.3, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                              whileTap={{ scale: 0.8 }}
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
              <motion.div
                className="aria-panel-header"
                variants={headerVariants}
              >
                <div className="aria-panel-header-left">
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onToggleConversationList}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={showConversationList ? 'Hide conversations' : 'Show conversations'}
                  >
                    <AnimatePresence mode="wait">
                      {showConversationList ? (
                        <motion.div
                          key="chevron"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                        >
                          <ChevronLeft size={18} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="message"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                        >
                          <MessageSquare size={18} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <div className="aria-panel-title">
                    <motion.div
                      className="aria-panel-icon"
                      variants={sparkleVariants}
                      animate="animate"
                    >
                      <Sparkles size={18} />
                    </motion.div>
                    <span>ARIA</span>
                  </div>
                  {conversations.length > 0 && (
                    <motion.span
                      className="aria-conv-count"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      ({conversations.length})
                    </motion.span>
                  )}
                </div>

                <div className="aria-panel-header-right">
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onNewConversation}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    title="New Chat"
                  >
                    <Plus size={18} />
                  </motion.button>
                  <motion.button
                    className="aria-panel-header-btn"
                    onClick={onMinimize || onClose}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    title="Minimize"
                  >
                    <Minimize2 size={18} />
                  </motion.button>
                  <motion.button
                    className="aria-panel-header-btn close"
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    title="Close"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </motion.div>

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
