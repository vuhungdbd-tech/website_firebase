
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * StorageService: Xử lý lưu trữ file (Ảnh tin tức, File PDF tài liệu)
 */
export const StorageService = {
  /**
   * Upload file lên Firebase Cloud Storage
   * @param file Đối tượng File lấy từ <input type="file">
   * @param folder Thư mục đích ('news' hoặc 'documents')
   * @returns Public URL để truy cập file
   */
  uploadFile: async (file: File, folder: string): Promise<string> => {
    try {
      // Tạo đường dẫn file duy nhất bằng timestamp
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      // Tiến hành upload
      const snapshot = await uploadBytes(storageRef, file);
      
      // Lấy URL công khai sau khi upload thành công
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`File uploaded to ${folder}:`, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("Lỗi upload file:", error);
      throw new Error("Không thể tải file lên bộ lưu trữ.");
    }
  },

  /**
   * Fix: Added deleteFile method to StorageService
   * Xóa file khỏi Firebase Storage dựa trên URL.
   */
  deleteFile: async (fileUrl: string): Promise<void> => {
    try {
      if (!fileUrl || !fileUrl.includes('firebasestorage')) return;
      // Trích xuất path từ URL Firebase hoặc dùng URL trực tiếp (ref accepts both)
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Lỗi xóa file:", error);
    }
  }
};
