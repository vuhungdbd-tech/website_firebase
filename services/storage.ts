
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
      // Kiểm tra file
      if (!file) throw new Error("Không có file để tải lên.");
      
      // Giới hạn kích thước file mới: 50MB (50 * 1024 * 1024 bytes)
      const MAX_SIZE = 50 * 1024 * 1024; 
      if (file.size > MAX_SIZE) {
        throw new Error("Dung lượng file quá lớn. Vui lòng chọn file dưới 50MB.");
      }

      // Tạo đường dẫn file duy nhất bằng timestamp
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      // Thêm Metadata để tránh lỗi MIME type khi hiển thị
      const metadata = {
        contentType: file.type,
      };
      
      console.log(`Bắt đầu tải lên: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      
      // Tiến hành upload
      const snapshot = await uploadBytes(storageRef, file, metadata);
      
      // Lấy URL công khai sau khi upload thành công
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`Tải lên thành công! URL:`, downloadURL);
      return downloadURL;
    } catch (error: any) {
      console.error("Lỗi Storage chi tiết:", error);
      
      let friendlyMessage = error.message || "Không thể tải file lên bộ lưu trữ.";
      
      if (error.code === 'storage/unauthorized') {
        friendlyMessage = "Lỗi bảo mật: Bạn không có quyền tải file lên (Hãy kiểm tra Rules trên Firebase).";
      } else if (error.code === 'storage/retry-limit-exceeded') {
        friendlyMessage = "Lỗi kết nối: Quá thời gian chờ. Hãy kiểm tra mạng hoặc thử lại.";
      } else if (error.code === 'storage/canceled') {
        friendlyMessage = "Tải lên đã bị hủy.";
      }

      throw new Error(friendlyMessage);
    }
  },

  /**
   * Xóa file khỏi Firebase Storage dựa trên URL.
   */
  deleteFile: async (fileUrl: string): Promise<void> => {
    try {
      if (!fileUrl || !fileUrl.includes('firebasestorage')) return;
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error("Lỗi xóa file:", error);
    }
  }
};
