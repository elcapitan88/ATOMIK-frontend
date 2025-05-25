import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import axiosInstance from '@/services/axiosConfig';

export const useProfilePicture = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user, updateUserProfile } = useAuth();
  const toast = useToast();

  // Generate a unique filename for the profile picture
  const generateFileName = (userId, file) => {
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    return `profile-pictures/${userId}/${timestamp}.${extension}`;
  };

  // Upload profile picture to Firebase Storage
  const uploadProfilePicture = useCallback(async (file) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a storage reference
      const fileName = generateFileName(user.id, file);
      const storageRef = ref(storage, fileName);

      // Delete old profile picture if exists
      if (user.profile_picture && user.profile_picture.includes('firebasestorage.googleapis.com')) {
        try {
          // Extract the path from the full URL
          const oldUrl = new URL(user.profile_picture);
          const oldPath = decodeURIComponent(oldUrl.pathname.split('/o/')[1].split('?')[0]);
          const oldPictureRef = ref(storage, oldPath);
          await deleteObject(oldPictureRef);
        } catch (error) {
          console.log('No previous profile picture to delete or error deleting:', error);
        }
      }

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          },
          (error) => {
            // Handle upload errors
            console.error('Upload error:', error);
            setUploading(false);
            setUploadProgress(0);
            
            toast({
              title: 'Upload failed',
              description: 'Failed to upload profile picture. Please try again.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            reject(error);
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Update user profile in backend
              const response = await axiosInstance.patch('/api/v1/auth/profile', {
                profile_picture: downloadURL
              });

              // Update local user context
              updateUserProfile({
                profile_picture: downloadURL,
                profilePicture: downloadURL // Support both naming conventions
              });

              setUploading(false);
              setUploadProgress(0);

              toast({
                title: 'Profile picture updated',
                description: 'Your profile picture has been updated successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });

              resolve(downloadURL);
            } catch (error) {
              console.error('Error updating profile:', error);
              setUploading(false);
              setUploadProgress(0);
              
              toast({
                title: 'Update failed',
                description: 'Failed to update profile picture. Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      setUploadProgress(0);
      
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  }, [user, updateUserProfile, toast]);

  // Delete profile picture
  const deleteProfilePicture = useCallback(async () => {
    if (!user?.profile_picture && !user?.profilePicture) return;

    const profilePictureUrl = user.profile_picture || user.profilePicture;

    try {
      // Delete from Firebase Storage if it's a Firebase URL
      if (profilePictureUrl.includes('firebasestorage.googleapis.com')) {
        // Extract the path from the full URL
        const url = new URL(profilePictureUrl);
        const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        const pictureRef = ref(storage, path);
        await deleteObject(pictureRef);
      }

      // Update backend
      await axiosInstance.patch('/api/v1/auth/profile', {
        profile_picture: null
      });

      // Update local user context
      updateUserProfile({
        profile_picture: null,
        profilePicture: null // Support both naming conventions
      });

      toast({
        title: 'Profile picture removed',
        description: 'Your profile picture has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to remove profile picture. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [user, updateUserProfile, toast]);

  return {
    uploadProfilePicture,
    deleteProfilePicture,
    uploading,
    uploadProgress
  };
}; 