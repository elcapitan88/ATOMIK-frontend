import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Tooltip,
  SimpleGrid,
  Divider
} from '@chakra-ui/react';
import { Search, Clock, Heart } from 'lucide-react';

// Common emoji categories
const EMOJI_CATEGORIES = {
  smileys: {
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
      '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
      '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸'
    ]
  },
  gestures: {
    name: 'People & Body',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'
    ]
  },
  objects: {
    name: 'Objects',
    icon: '📱',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
      '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋'
    ]
  },
  nature: {
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'
    ]
  },
  food: {
    name: 'Food & Drink',
    icon: '🍎',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
      '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞'
    ]
  },
  travel: {
    name: 'Travel & Places',
    icon: '✈️',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
      '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️',
      '⭐', '🌟', '💫', '✨', '☄️', '🌍', '🌎', '🌏', '🌐', '🗺️'
    ]
  },
  symbols: {
    name: 'Symbols',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'
    ]
  }
};

const EmojiPicker = ({ onEmojiSelect, isOpen, onClose, children }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(() => {
    const stored = localStorage.getItem('atomik-recent-emojis');
    return stored ? JSON.parse(stored) : ['👍', '❤️', '😂', '🎉', '😊', '👏', '🔥', '💯'];
  });
  const [favoriteEmojis, setFavoriteEmojis] = useState(() => {
    const stored = localStorage.getItem('atomik-favorite-emojis');
    return stored ? JSON.parse(stored) : [];
  });
  const popoverRef = useRef();
  const searchInputRef = useRef();

  const bgColor = '#2D3748'; // Dark background
  const borderColor = '#4A5568'; // Gray border
  const categoryBgColor = '#1A202C'; // Darker category background
  const categoryActiveColor = '#3182CE'; // Blue for active category
  const hoverBgColor = '#4A5568'; // Gray hover

  // Enhanced emoji search with names and keywords
  const EMOJI_KEYWORDS = {
    '😀': ['happy', 'smile', 'joy', 'face'],
    '😂': ['laugh', 'crying', 'funny', 'tears'],
    '❤️': ['love', 'heart', 'red'],
    '🎉': ['party', 'celebration', 'confetti'],
    '👍': ['thumbs', 'up', 'good', 'like', 'approve'],
    '👎': ['thumbs', 'down', 'bad', 'dislike'],
    '🔥': ['fire', 'hot', 'lit', 'awesome'],
    '💯': ['hundred', 'perfect', 'score', 'complete'],
    // Add more as needed
  };
  
  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (!searchTerm) {
      return EMOJI_CATEGORIES[activeCategory].emojis;
    }
    
    const term = searchTerm.toLowerCase();
    return EMOJI_CATEGORIES[activeCategory].emojis.filter(emoji => {
      const keywords = EMOJI_KEYWORDS[emoji] || [];
      return emoji.includes(searchTerm) || 
             keywords.some(keyword => keyword.includes(term));
    });
  };
  
  // Search across all categories
  const getGlobalSearchResults = () => {
    if (!searchTerm) return [];
    
    const term = searchTerm.toLowerCase();
    const results = [];
    
    Object.values(EMOJI_CATEGORIES).forEach(category => {
      category.emojis.forEach(emoji => {
        const keywords = EMOJI_KEYWORDS[emoji] || [];
        if (emoji.includes(searchTerm) || 
            keywords.some(keyword => keyword.includes(term))) {
          results.push(emoji);
        }
      });
    });
    
    return [...new Set(results)]; // Remove duplicates
  };

  const handleEmojiClick = (emoji) => {
    // Add to recent emojis
    const updatedRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 16);
    setRecentEmojis(updatedRecent);
    localStorage.setItem('atomik-recent-emojis', JSON.stringify(updatedRecent));
    
    onEmojiSelect(emoji);
    onClose();
    setSearchTerm(''); // Clear search
  };
  
  const toggleFavorite = (emoji, e) => {
    e.stopPropagation();
    const isFavorite = favoriteEmojis.includes(emoji);
    const updatedFavorites = isFavorite 
      ? favoriteEmojis.filter(e => e !== emoji)
      : [...favoriteEmojis, emoji];
    
    setFavoriteEmojis(updatedFavorites);
    localStorage.setItem('atomik-favorite-emojis', JSON.stringify(updatedFavorites));
  };
  
  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="top-start"
      closeOnBlur={true}
      initialFocusRef={popoverRef}
    >
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent
        bg={bgColor}
        borderColor={borderColor}
        w="380px"
        h="450px"
        ref={popoverRef}
        boxShadow="xl"
      >
        <PopoverArrow />
        <PopoverBody p={0}>
          <VStack spacing={0} h="100%">
            {/* Search Bar */}
            <Box w="100%" p={3} borderBottom="1px" borderColor={borderColor}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Search size={14} color="gray" />
                </InputLeftElement>
                <Input
                  ref={searchInputRef}
                  placeholder="Search emojis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  _focus={{
                    borderColor: "rgba(0, 198, 224, 0.5)",
                    boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.3)"
                  }}
                  _placeholder={{ color: "whiteAlpha.500" }}
                  color="white"
                />
              </InputGroup>
            </Box>

            {/* Show search results or tabs */}
            {searchTerm ? (
              <Box flex={1} w="100%" overflowY="auto" p={3}>
                <Text fontSize="xs" fontWeight="medium" mb={2} color="gray.500">
                  Search Results ({getGlobalSearchResults().length})
                </Text>
                {getGlobalSearchResults().length > 0 ? (
                  <Grid templateColumns="repeat(8, 1fr)" gap={1}>
                    {getGlobalSearchResults().map((emoji, index) => (
                      <Box key={index} position="relative">
                        <IconButton
                          size="sm"
                          variant="ghost"
                          fontSize="lg"
                          h="32px"
                          w="32px"
                          minW="32px"
                          onClick={() => handleEmojiClick(emoji)}
                          _hover={{ bg: hoverBgColor, transform: 'scale(1.1)' }}
                          transition="all 0.2s"
                          aria-label={`Emoji ${emoji}`}
                        >
                          {emoji}
                        </IconButton>
                        <IconButton
                          size="xs"
                          position="absolute"
                          top="-2px"
                          right="-2px"
                          bg="transparent"
                          color={favoriteEmojis.includes(emoji) ? "red.400" : "whiteAlpha.400"}
                          _hover={{ color: "red.400" }}
                          onClick={(e) => toggleFavorite(emoji, e)}
                          aria-label="Toggle favorite"
                          opacity={0}
                          _groupHover={{ opacity: 1 }}
                        >
                          <Heart size={8} fill={favoriteEmojis.includes(emoji) ? "currentColor" : "none"} />
                        </IconButton>
                      </Box>
                    ))}
                  </Grid>
                ) : (
                  <Text color="whiteAlpha.600" textAlign="center" py={8}>
                    No emojis found for "{searchTerm}"
                  </Text>
                )}
              </Box>
            ) : (
              <Tabs
                index={Object.keys(EMOJI_CATEGORIES).indexOf(activeCategory)}
                onChange={(index) => setActiveCategory(Object.keys(EMOJI_CATEGORIES)[index])}
                flex={1}
                display="flex"
                flexDirection="column"
                variant="unstyled"
              >
                {/* Category Tabs */}
                <TabList bg={categoryBgColor} px={2} py={1} borderBottom="1px" borderColor={borderColor}>
                  <HStack spacing={1} overflowX="auto" w="100%">
                    {/* Recent Tab */}
                    <Tooltip label="Recent" placement="top">
                      <Tab
                        minW="32px"
                        h="32px"
                        p={0}
                        fontSize="sm"
                        bg={activeCategory === 'recent' ? categoryActiveColor : 'transparent'}
                        color={activeCategory === 'recent' ? 'white' : 'inherit'}
                        _hover={{ bg: activeCategory === 'recent' ? categoryActiveColor : hoverBgColor }}
                        onClick={() => setActiveCategory('recent')}
                        borderRadius="md"
                      >
                        <Clock size={14} />
                      </Tab>
                    </Tooltip>
                    
                    {/* Favorites Tab */}
                    <Tooltip label="Favorites" placement="top">
                      <Tab
                        minW="32px"
                        h="32px"
                        p={0}
                        fontSize="sm"
                        bg={activeCategory === 'favorites' ? categoryActiveColor : 'transparent'}
                        color={activeCategory === 'favorites' ? 'white' : 'inherit'}
                        _hover={{ bg: activeCategory === 'favorites' ? categoryActiveColor : hoverBgColor }}
                        onClick={() => setActiveCategory('favorites')}
                        borderRadius="md"
                      >
                        <Heart size={14} fill={favoriteEmojis.length > 0 ? "currentColor" : "none"} />
                      </Tab>
                    </Tooltip>
                    
                    <Divider orientation="vertical" h="20px" borderColor="whiteAlpha.300" />
                    
                    {/* Category Tabs */}
                    {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                      <Tooltip key={key} label={category.name} placement="top">
                        <Tab
                          minW="32px"
                          h="32px"
                          p={0}
                          fontSize="sm"
                          bg={activeCategory === key ? categoryActiveColor : 'transparent'}
                          color={activeCategory === key ? 'white' : 'inherit'}
                          _hover={{ bg: activeCategory === key ? categoryActiveColor : hoverBgColor }}
                          borderRadius="md"
                        >
                          {category.icon}
                        </Tab>
                      </Tooltip>
                    ))}
                  </HStack>
                </TabList>

                {/* Emoji Content */}
                <Box flex={1} w="100%" overflowY="auto" p={3}>
                  {activeCategory === 'recent' ? (
                    <>
                      <HStack justify="space-between" align="center" mb={3}>
                        <Text fontSize="xs" fontWeight="medium" color="gray.500">
                          Recently Used
                        </Text>
                        <Badge size="sm" colorScheme="blue">
                          {recentEmojis.length}
                        </Badge>
                      </HStack>
                      {recentEmojis.length > 0 ? (
                        <Grid templateColumns="repeat(8, 1fr)" gap={1}>
                          {recentEmojis.map((emoji, index) => (
                            <IconButton
                              key={index}
                              size="sm"
                              variant="ghost"
                              fontSize="lg"
                              h="32px"
                              w="32px"
                              minW="32px"
                              onClick={() => handleEmojiClick(emoji)}
                              _hover={{ bg: hoverBgColor, transform: 'scale(1.1)' }}
                              transition="all 0.2s"
                              aria-label={`Emoji ${emoji}`}
                            >
                              {emoji}
                            </IconButton>
                          ))}
                        </Grid>
                      ) : (
                        <Text color="whiteAlpha.600" textAlign="center" py={8} fontSize="sm">
                          No recent emojis yet
                        </Text>
                      )}
                    </>
                  ) : activeCategory === 'favorites' ? (
                    <>
                      <HStack justify="space-between" align="center" mb={3}>
                        <Text fontSize="xs" fontWeight="medium" color="gray.500">
                          Favorite Emojis
                        </Text>
                        <Badge size="sm" colorScheme="red">
                          {favoriteEmojis.length}
                        </Badge>
                      </HStack>
                      {favoriteEmojis.length > 0 ? (
                        <Grid templateColumns="repeat(8, 1fr)" gap={1}>
                          {favoriteEmojis.map((emoji, index) => (
                            <IconButton
                              key={index}
                              size="sm"
                              variant="ghost"
                              fontSize="lg"
                              h="32px"
                              w="32px"
                              minW="32px"
                              onClick={() => handleEmojiClick(emoji)}
                              _hover={{ bg: hoverBgColor, transform: 'scale(1.1)' }}
                              transition="all 0.2s"
                              aria-label={`Emoji ${emoji}`}
                            >
                              {emoji}
                            </IconButton>
                          ))}
                        </Grid>
                      ) : (
                        <Text color="whiteAlpha.600" textAlign="center" py={8} fontSize="sm">
                          No favorite emojis yet<br />
                          <Text fontSize="xs" mt={1}>Heart an emoji to add it to favorites</Text>
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text fontSize="xs" fontWeight="medium" mb={2} color="gray.500">
                        {EMOJI_CATEGORIES[activeCategory].name}
                      </Text>
                      <Grid templateColumns="repeat(8, 1fr)" gap={1}>
                        {getFilteredEmojis().map((emoji, index) => (
                          <Box key={index} position="relative" className="group">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              fontSize="lg"
                              h="32px"
                              w="32px"
                              minW="32px"
                              onClick={() => handleEmojiClick(emoji)}
                              _hover={{ bg: hoverBgColor, transform: 'scale(1.1)' }}
                              transition="all 0.2s"
                              aria-label={`Emoji ${emoji}`}
                            >
                              {emoji}
                            </IconButton>
                            <IconButton
                              size="xs"
                              position="absolute"
                              top="-2px"
                              right="-2px"
                              bg="transparent"
                              color={favoriteEmojis.includes(emoji) ? "red.400" : "whiteAlpha.400"}
                              _hover={{ color: "red.400" }}
                              onClick={(e) => toggleFavorite(emoji, e)}
                              aria-label="Toggle favorite"
                              opacity={0}
                              _groupHover={{ opacity: 1 }}
                              transition="opacity 0.2s"
                            >
                              <Heart size={8} fill={favoriteEmojis.includes(emoji) ? "currentColor" : "none"} />
                            </IconButton>
                          </Box>
                        ))}
                      </Grid>
                    </>
                  )}
                </Box>
              </Tabs>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;