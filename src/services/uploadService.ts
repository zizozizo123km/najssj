export const uploadFile = async (file: File | string, type: 'image' | 'video' = 'image') => {
  // Hardcoding the values to ensure old settings don't override them
  const cloudName = 'dbmokwazr';
  const uploadPreset = 'neverm';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in the settings.');
  }

  let isVideo = type === 'video';
  
  if (file instanceof File) {
    isVideo = file.type.startsWith('video/');
    if (isVideo && file.size > 50 * 1024 * 1024) {
      throw new Error('Video file size exceeds 50MB limit.');
    }
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (isVideo) {
    formData.append('resource_type', 'video');
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
  } catch (error: any) {
    console.error('Network error during Cloudinary upload:', error);
    throw new Error(`Network error (Failed to fetch). This usually means the Cloud Name '${cloudName}' is incorrect, or an adblocker is blocking the request.`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Cloudinary upload error:', errorData);
    throw new Error(`Failed to upload file to Cloudinary: ${errorData.error?.message || response.statusText || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.secure_url;
};
