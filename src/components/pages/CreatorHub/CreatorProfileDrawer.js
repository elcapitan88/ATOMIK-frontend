import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Button, Input, Textarea, FormControl,
  FormLabel, useToast, Spinner, Drawer, DrawerOverlay, DrawerContent,
  DrawerHeader, DrawerBody, DrawerCloseButton, FormHelperText
} from '@chakra-ui/react';
import { Save, Globe, MessageCircle } from 'lucide-react';
import axiosInstance from '@/services/axiosConfig';

const CreatorProfileDrawer = ({ isOpen, onClose, creatorProfile }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    trading_experience: 'intermediate',
    website: '',
    twitter: '',
    linkedin: '',
    discord: ''
  });

  useEffect(() => {
    if (creatorProfile) {
      setFormData({
        bio: creatorProfile.bio || '',
        trading_experience: creatorProfile.trading_experience || 'intermediate',
        website: creatorProfile.website || '',
        twitter: creatorProfile.social_links?.twitter || creatorProfile.twitter || '',
        linkedin: creatorProfile.social_links?.linkedin || creatorProfile.linkedin || '',
        discord: creatorProfile.social_links?.discord || creatorProfile.discord || ''
      });
    }
  }, [creatorProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch('/api/v1/creators/profile', {
        bio: formData.bio,
        trading_experience: formData.trading_experience,
        website: formData.website,
        social_links: {
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          discord: formData.discord
        }
      });

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputStyles = {
    bg: '#1a1a1a',
    border: '1px solid #333',
    color: 'white',
    _hover: { borderColor: '#444' },
    _focus: { borderColor: '#00C6E0', boxShadow: 'none' },
    fontSize: 'sm'
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <DrawerContent bg="#121212" borderLeft="1px solid #333">
        <DrawerCloseButton color="whiteAlpha.600" />
        <DrawerHeader
          color="white"
          fontSize="lg"
          fontWeight="700"
          letterSpacing="-0.02em"
          borderBottom="1px solid rgba(255,255,255,0.06)"
          pb={4}
        >
          Edit Profile
        </DrawerHeader>

        <DrawerBody py={6}>
          <VStack spacing={5} align="stretch">
            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">Bio</FormLabel>
              <Textarea
                {...inputStyles}
                rows={4}
                maxLength={500}
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell your audience about your trading experience..."
              />
              <FormHelperText color="whiteAlpha.400" fontSize="xs">
                {formData.bio.length}/500 characters
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">Trading Experience</FormLabel>
              <HStack spacing={2}>
                {['beginner', 'intermediate', 'expert'].map((level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={formData.trading_experience === level ? 'solid' : 'outline'}
                    bg={formData.trading_experience === level ? '#00C6E0' : 'transparent'}
                    color={formData.trading_experience === level ? 'white' : 'whiteAlpha.600'}
                    borderColor="#333"
                    _hover={{
                      bg: formData.trading_experience === level ? '#00A3B8' : 'rgba(0,198,224,0.08)',
                      borderColor: '#00C6E0'
                    }}
                    onClick={() => setFormData(prev => ({ ...prev, trading_experience: level }))}
                    textTransform="capitalize"
                    flex={1}
                  >
                    {level}
                  </Button>
                ))}
              </HStack>
            </FormControl>

            <Box h="1px" bg="rgba(255,255,255,0.06)" my={1} />

            <Text color="whiteAlpha.400" fontSize="11px" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
              Social Links
            </Text>

            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">Website</FormLabel>
              <Input
                {...inputStyles}
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </FormControl>

            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">Twitter / X</FormLabel>
              <Input
                {...inputStyles}
                value={formData.twitter}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="@handle"
              />
            </FormControl>

            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">LinkedIn</FormLabel>
              <Input
                {...inputStyles}
                value={formData.linkedin}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="linkedin.com/in/yourprofile"
              />
            </FormControl>

            <FormControl>
              <FormLabel color="whiteAlpha.800" fontSize="sm" fontWeight="600">Discord</FormLabel>
              <Input
                {...inputStyles}
                value={formData.discord}
                onChange={(e) => setFormData(prev => ({ ...prev, discord: e.target.value }))}
                placeholder="username#1234"
              />
            </FormControl>

            <Button
              bg="#00C6E0"
              color="white"
              _hover={{ bg: '#00A3B8' }}
              leftIcon={saving ? <Spinner size="xs" /> : <Save size={16} />}
              onClick={handleSave}
              isLoading={saving}
              loadingText="Saving..."
              mt={4}
              borderRadius="10px"
              fontWeight="600"
            >
              Save Changes
            </Button>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default CreatorProfileDrawer;
