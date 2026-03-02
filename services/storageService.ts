import { createClient } from "@supabase/supabase-js";

// Initialize Supabase (Using placeholder keys as they are not in the provided env context yet)
// In a real app, these would come from process.env or a centralized config
const supabaseUrl = 'https://xyzcompany.supabase.co'; 
const supabaseKey = 'public-anon-key'; 
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a local image file to Supabase Storage
 * @param localUri - The URI of the image on the device (or blob URL in web)
 * @param familyId - The family ID to organize folders
 * @returns The path of the uploaded file in the 'receipts' bucket
 */
export const uploadReceiptImage = async (localUri: string, familyId: string): Promise<string> => {
  try {
    // 1. Convert URI to Blob (Works for both Expo Native and Web)
    const response = await fetch(localUri);
    const blob = await response.blob();

    // 2. Generate Unique Filename with correct extension logic for Data URIs
    let fileExt = 'jpg';
    if (localUri.startsWith('data:')) {
       // Handle Data URI (e.g. from Web FileReader)
       // format: data:image/png;base64,...
       const mimeType = localUri.split(';')[0].split(':')[1];
       if (mimeType) fileExt = mimeType.split('/')[1] || 'jpg';
    } else {
       // Handle File Path
       const parts = localUri.split('.');
       if (parts.length > 1) fileExt = parts.pop() || 'jpg';
    }

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${familyId}/${fileName}`;

    // 3. Upload to Supabase
    // Note: We're using the standard upload method. 
    // In React Native, 'formData' is often used, but fetch+blob is cleaner for cross-platform logic here.
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
      });

    if (error) {
      throw error;
    }

    return data.path; // Returns the storage path (e.g., "family_123/image.jpg")
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Image upload failed");
  }
};