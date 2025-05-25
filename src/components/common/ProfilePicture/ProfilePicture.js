import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  Text,
  Progress,
  useDisclosure,
  Image,
  Flex,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import { Camera, Upload, Trash2, User, Edit2 } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useProfilePicture } from '@/hooks/useProfilePicture';

const ProfilePicture = ({ 
  user, 
  size = 'xl', 
  editable = true,
  showStatus = false,
  status = 'online' // online, idle, dnd, offline
}) => {
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
    aspect: 1
  });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const imageRef = useRef(null);
  
  const { uploadProfilePicture, deleteProfilePicture, uploading, uploadProgress } = useProfilePicture();

  // Get profile picture URL from either field name
  const profilePictureUrl = user?.profile_picture || user?.profilePicture;

  // Avatar sizes mapping
  const sizeMap = {
    xs: '32px',
    sm: '40px',
    md: '48px',
    lg: '64px',
    xl: '96px',
    '2xl': '128px'
  };

  // Status colors
  const statusColors = {
    online: '#3BA55C',
    idle: '#FAA61A',
    dnd: '#ED4245',
    offline: '#747F8D'
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        onOpen();
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async () => {
    if (!imageRef.current || !crop.width || !crop.height) return null;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = 'profile-picture.jpg';
        const croppedImageUrl = URL.createObjectURL(blob);
        setCroppedImageUrl(croppedImageUrl);
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleUpload = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' });
      await uploadProfilePicture(file);
      onClose();
      setSelectedImage(null);
      setCroppedImageUrl(null);
    }
  };

  const handleDelete = async () => {
    await deleteProfilePicture();
  };

  const resetModal = () => {
    setSelectedImage(null);
    setCroppedImageUrl(null);
    setCrop({
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
      aspect: 1
    });
  };

  const handleImageLoad = () => {
    // This function is now empty as the image load handling is done in the ReactCrop component
  };

  const handleCropComplete = async () => {
    const croppedBlob = await getCroppedImg();
    if (croppedBlob) {
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' });
      await uploadProfilePicture(file);
      onClose();
      setSelectedImage(null);
      setCroppedImageUrl(null);
    }
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  return (
    <>
      <Box position="relative" display="inline-block">
        {/* Main Avatar */}
        <Avatar
          size={size}
          src={profilePictureUrl}
          name={user?.full_name || user?.fullName || user?.username}
          bg="#1a1a1a"
          color="white"
          icon={<User size={size === '2xl' ? 64 : size === 'xl' ? 48 : 32} />}
          sx={{
            width: sizeMap[size],
            height: sizeMap[size],
            border: '3px solid',
            borderColor: '#000',
            cursor: editable ? 'pointer' : 'default',
            transition: 'all 0.2s',
            _hover: editable ? {
              opacity: 0.8,
              transform: 'scale(1.05)'
            } : {}
          }}
          onClick={editable ? () => fileInputRef.current?.click() : undefined}
        />

        {/* Status Indicator */}
        {showStatus && (
          <Box
            position="absolute"
            bottom="-2px"
            right="-2px"
            width={size === '2xl' ? '32px' : size === 'xl' ? '28px' : '20px'}
            height={size === '2xl' ? '32px' : size === 'xl' ? '28px' : '20px'}
            bg={statusColors[status]}
            borderRadius="full"
            border="3px solid #000"
          />
        )}

        {/* Edit Button Overlay */}
        {editable && (
          <Box
            position="absolute"
            inset="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="blackAlpha.600"
            borderRadius="full"
            opacity="0"
            transition="opacity 0.2s"
            cursor="pointer"
            _hover={{ opacity: 1 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <VStack spacing={1}>
              <Camera size={24} color="white" />
              <Text fontSize="xs" color="white" fontWeight="medium">
                CHANGE
              </Text>
            </VStack>
          </Box>
        )}

        {/* Action Menu */}
        {editable && profilePictureUrl && (
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<Edit2 size={14} />}
              size="xs"
              isRound
              position="absolute"
              top="-4px"
              right="-4px"
              bg="#00C6E0"
              color="white"
              _hover={{ bg: "#00A3B8" }}
              aria-label="Edit profile picture"
            />
            <MenuList bg="#1a1a1a" borderColor="#333">
              <MenuItem
                icon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Upload new picture
              </MenuItem>
              <MenuItem
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                color="red.400"
                _hover={{ bg: "red.900" }}
              >
                Remove picture
              </MenuItem>
            </MenuList>
          </Menu>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </Box>

      {/* Crop Modal */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#0a0a0a" border="1px solid #333">
          <ModalHeader color="white">Crop Profile Picture</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {selectedImage && (
                <>
                  <Box 
                    position="relative" 
                    maxH="500px" 
                    overflow="hidden"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    bg="#1a1a1a"
                    borderRadius="lg"
                    border="1px solid #333"
                    p={4}
                  >
                    <ReactCrop
                      crop={crop}
                      onChange={setCrop}
                      aspect={1}
                      circularCrop
                      minWidth={100}
                      minHeight={100}
                    >
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="Crop preview"
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '450px',
                          display: 'block'
                        }}
                        onLoad={handleImageLoad}
                      />
                    </ReactCrop>
                  </Box>
                  
                  {/* Upload Progress */}
                  {uploading && (
                    <Box w="full">
                      <Text color="whiteAlpha.700" fontSize="sm" mb={2}>
                        Uploading... {uploadProgress}%
                      </Text>
                      <Progress
                        value={uploadProgress}
                        size="sm"
                        colorScheme="cyan"
                        borderRadius="full"
                      />
                    </Box>
                  )}
                  
                  <Box textAlign="center">
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Tip: Drag to reposition • Square images work best • Max size: 5MB
                    </Text>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={handleClose}
              color="white"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="cyan" 
              onClick={handleCropComplete}
              isLoading={uploading}
              loadingText="Uploading..."
            >
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfilePicture; 