import React, { useState, useCallback } from 'react';
import {
  Box, Flex, Text, IconButton, Button, Textarea, Badge,
  useClipboard, Collapse, HStack, Tooltip
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiCopy, FiEdit2, FiSave, FiDownload, FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MotionBox = motion(Box);

const CodeArtifact = ({ code, language = 'python', strategyName = 'Generated Strategy', onSave, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const { hasCopied, onCopy } = useClipboard(isEditing ? editedCode : code);

  const lineCount = (code || '').split('\n').length;
  const langLabel = language === 'pinescript' ? 'PineScript' : 'Python';
  const langColor = language === 'pinescript' ? 'orange' : 'blue';

  const handleSave = useCallback(() => {
    if (isEditing) {
      onEdit?.(editedCode);
      setIsEditing(false);
    }
    onSave?.(isEditing ? editedCode : code);
  }, [isEditing, editedCode, code, onSave, onEdit]);

  const handleExport = useCallback(() => {
    const ext = language === 'pinescript' ? 'pine' : 'py';
    const blob = new Blob([isEditing ? editedCode : code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategyName.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, editedCode, isEditing, language, strategyName]);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      bg="rgba(15, 15, 25, 0.9)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      overflow="hidden"
      my={3}
      maxW="100%"
    >
      {/* Header */}
      <Flex
        align="center"
        px={4}
        py={3}
        bg="rgba(255,255,255,0.03)"
        cursor="pointer"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
      >
        <Box mr={3}>
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </Box>
        <Text fontWeight="600" fontSize="sm" flex="1" isTruncated>
          {strategyName}
        </Text>
        <Badge colorScheme={langColor} mr={2} fontSize="xs">
          {langLabel}
        </Badge>
        <Text fontSize="xs" color="whiteAlpha.500">
          {lineCount} lines
        </Text>
      </Flex>

      {/* Code Content */}
      <Collapse in={isExpanded} animateOpacity>
        <Box maxH="60vh" overflowY="auto">
          {isEditing ? (
            <Textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              fontFamily="mono"
              fontSize="13px"
              bg="rgba(0,0,0,0.5)"
              border="none"
              color="gray.100"
              minH="200px"
              p={4}
              resize="vertical"
              _focus={{ border: 'none', boxShadow: 'none' }}
            />
          ) : (
            <SyntaxHighlighter
              language={language === 'pinescript' ? 'javascript' : 'python'}
              style={atomDark}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '16px',
                background: 'transparent',
                fontSize: '13px',
              }}
              lineNumberStyle={{ opacity: 0.4 }}
            >
              {code || ''}
            </SyntaxHighlighter>
          )}
        </Box>

        {/* Action Bar */}
        <HStack px={4} py={2} bg="rgba(255,255,255,0.03)" spacing={2}>
          <Tooltip label={hasCopied ? 'Copied!' : 'Copy code'}>
            <IconButton
              icon={hasCopied ? <FiCheck /> : <FiCopy />}
              size="sm"
              variant="ghost"
              colorScheme={hasCopied ? 'green' : 'gray'}
              onClick={onCopy}
              aria-label="Copy code"
            />
          </Tooltip>
          <Tooltip label={isEditing ? 'Cancel edit' : 'Edit code'}>
            <IconButton
              icon={<FiEdit2 />}
              size="sm"
              variant="ghost"
              colorScheme={isEditing ? 'cyan' : 'gray'}
              onClick={() => {
                if (isEditing) {
                  setEditedCode(code);
                }
                setIsEditing(!isEditing);
              }}
              aria-label="Edit code"
            />
          </Tooltip>
          <Tooltip label="Save strategy">
            <IconButton
              icon={<FiSave />}
              size="sm"
              variant="ghost"
              onClick={handleSave}
              aria-label="Save strategy"
            />
          </Tooltip>
          <Tooltip label="Download file">
            <IconButton
              icon={<FiDownload />}
              size="sm"
              variant="ghost"
              onClick={handleExport}
              aria-label="Export"
            />
          </Tooltip>
        </HStack>
      </Collapse>
    </MotionBox>
  );
};

export default CodeArtifact;
