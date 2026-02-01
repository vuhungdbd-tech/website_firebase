
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  increment,
  Timestamp,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { 
  Post, 
  SchoolConfig, 
  SchoolDocument, 
  DocumentCategory, 
  User, 
  DisplayBlock, 
  MenuItem, 
  GalleryAlbum, 
  GalleryImage, 
  Video, 
  StaffMember, 
  IntroductionArticle, 
  PostCategory 
} from '../types';

// Thử bật chế độ Offline
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Chỉ có thể bật offline trên 1 tab duy nhất.");
        } else if (err.code == 'unimplemented') {
            console.warn("Trình duyệt không hỗ trợ offline.");
        }
    });
} catch(e) {}

/**
 * Helper to handle Firebase specific errors
 */
const handleFirebaseError = (error: any, context: string) => {
  console.error(`Lỗi Firestore (${context}):`, error);
  
  if (error.code === 'permission-denied') {
    const snippet = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;
    console.warn("%c HƯỚNG DẪN CẤU HÌNH FIREBASE RULES:", "color: yellow; background: red; font-weight: bold; padding: 4px;");
    console.warn("Bạn cần dán đoạn mã sau vào tab 'Rules' của Firestore trong Firebase Console:");
    console.warn(snippet);
    
    // Create a custom error that the UI can recognize
    const permError = new Error("Permission Denied");
    (permError as any).code = 'permission-denied';
    throw permError;
  }
  throw error;
};

/**
 * DatabaseService: Quản lý toàn bộ giao tiếp với Cloud Firestore
 */
export const DatabaseService = {
  
  // --- POSTS ---
  savePost: async (postData: Partial<Post>) => {
    try {
      const postsRef = collection(db, 'posts');
      const payload = {
        ...postData,
        updatedAt: serverTimestamp(),
        status: postData.status || 'published',
        views: postData.views || 0
      };

      if (postData.id && postData.id.length > 5) {
        const docRef = doc(db, 'posts', postData.id);
        await setDoc(docRef, payload, { merge: true });
        return postData.id;
      } else {
        const docRef = await addDoc(postsRef, {
          ...payload,
          createdAt: serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      return handleFirebaseError(error, 'savePost');
    }
  },

  getPosts: async (): Promise<Post[]> => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
    } catch (error) {
      return handleFirebaseError(error, 'getPosts');
    }
  },

  deletePost: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (e) { 
      handleFirebaseError(e, 'deletePost');
    }
  },

  getPostCategories: async (): Promise<PostCategory[]> => {
    try {
      const snap = await getDocs(collection(db, 'post_categories'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PostCategory));
    } catch (e) { 
      return handleFirebaseError(e, 'getPostCategories');
    }
  },

  savePostCategory: async (catData: Partial<PostCategory>) => {
    try {
      const docRef = catData.id ? doc(db, 'post_categories', catData.id) : doc(collection(db, 'post_categories'));
      await setDoc(docRef, catData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'savePostCategory');
    }
  },

  deletePostCategory: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'post_categories', id));
    } catch (e) {
      handleFirebaseError(e, 'deletePostCategory');
    }
  },

  saveDocument: async (docData: Partial<SchoolDocument>) => {
    try {
      const docRef = docData.id ? doc(db, 'documents', docData.id) : doc(collection(db, 'documents'));
      await setDoc(docRef, { ...docData, createdAt: serverTimestamp() }, { merge: true });
    } catch(e) { 
      handleFirebaseError(e, 'saveDocument');
    }
  },

  getDocuments: async (): Promise<SchoolDocument[]> => {
    try {
      const snap = await getDocs(collection(db, 'documents'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolDocument));
    } catch (e) { 
      return handleFirebaseError(e, 'getDocuments');
    }
  },

  deleteDocument: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteDocument');
    }
  },

  getDocCategories: async (): Promise<DocumentCategory[]> => {
    try {
      const snap = await getDocs(collection(db, 'document_categories'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentCategory));
    } catch (e) { 
      return handleFirebaseError(e, 'getDocCategories');
    }
  },

  saveDocCategory: async (catData: Partial<DocumentCategory>) => {
    try {
      const docRef = catData.id ? doc(db, 'document_categories', catData.id) : doc(collection(db, 'document_categories'));
      await setDoc(docRef, catData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveDocCategory');
    }
  },

  deleteDocCategory: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'document_categories', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteDocCategory');
    }
  },

  saveDocCategoriesOrder: async (categories: DocumentCategory[]) => {
    try {
      for (const cat of categories) {
        await setDoc(doc(db, 'document_categories', cat.id), { order: cat.order }, { merge: true });
      }
    } catch (e) {
      handleFirebaseError(e, 'saveDocCategoriesOrder');
    }
  },

  getAlbums: async (): Promise<GalleryAlbum[]> => {
    try {
      const snap = await getDocs(collection(db, 'albums'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryAlbum));
    } catch (e) { 
      return handleFirebaseError(e, 'getAlbums');
    }
  },

  saveAlbum: async (albumData: Partial<GalleryAlbum>) => {
    try {
      const docRef = albumData.id ? doc(db, 'albums', albumData.id) : doc(collection(db, 'albums'));
      await setDoc(docRef, albumData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveAlbum');
    }
  },

  deleteAlbum: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'albums', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteAlbum');
    }
  },

  getGallery: async (): Promise<GalleryImage[]> => {
    try {
      const snap = await getDocs(collection(db, 'gallery'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
    } catch (e) { 
      return handleFirebaseError(e, 'getGallery');
    }
  },

  saveImage: async (imageData: Partial<GalleryImage>) => {
    try {
      const docRef = imageData.id ? doc(db, 'gallery', imageData.id) : doc(collection(db, 'gallery'));
      await setDoc(docRef, imageData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveImage');
    }
  },

  deleteImage: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteImage');
    }
  },

  getVideos: async (): Promise<Video[]> => {
    try {
      const snap = await getDocs(collection(db, 'videos'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
    } catch (e) { 
      return handleFirebaseError(e, 'getVideos');
    }
  },

  saveVideo: async (videoData: Partial<Video>) => {
    try {
      const docRef = videoData.id ? doc(db, 'videos', videoData.id) : doc(collection(db, 'videos'));
      await setDoc(docRef, videoData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveVideo');
    }
  },

  deleteVideo: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteVideo');
    }
  },

  getBlocks: async (): Promise<DisplayBlock[]> => {
    try {
      const snap = await getDocs(collection(db, 'blocks'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as DisplayBlock));
    } catch (e) { 
      return handleFirebaseError(e, 'getBlocks');
    }
  },

  saveBlock: async (blockData: Partial<DisplayBlock>) => {
    try {
      const docRef = blockData.id ? doc(db, 'blocks', blockData.id) : doc(collection(db, 'blocks'));
      await setDoc(docRef, blockData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveBlock');
    }
  },

  deleteBlock: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blocks', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteBlock');
    }
  },

  saveBlocksOrder: async (blocks: DisplayBlock[]) => {
    try {
      for (const block of blocks) {
        await setDoc(doc(db, 'blocks', block.id), { order: block.order }, { merge: true });
      }
    } catch (e) {
      handleFirebaseError(e, 'saveBlocksOrder');
    }
  },

  getMenu: async (): Promise<MenuItem[]> => {
    try {
      const snap = await getDocs(collection(db, 'menu'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
    } catch (e) { 
      return handleFirebaseError(e, 'getMenu');
    }
  },

  saveMenu: async (items: MenuItem[]) => {
    try {
      for (const item of items) {
        const docRef = item.id ? doc(db, 'menu', item.id) : doc(collection(db, 'menu'));
        await setDoc(docRef, item, { merge: true });
      }
    } catch (e) {
      handleFirebaseError(e, 'saveMenu');
    }
  },

  deleteMenu: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteMenu');
    }
  },

  getStaff: async (): Promise<StaffMember[]> => {
    try {
      const snap = await getDocs(collection(db, 'staff'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember));
    } catch (e) { 
      return handleFirebaseError(e, 'getStaff');
    }
  },

  saveStaff: async (staffData: Partial<StaffMember>) => {
    try {
      const docRef = staffData.id ? doc(db, 'staff', staffData.id) : doc(collection(db, 'staff'));
      await setDoc(docRef, staffData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveStaff');
    }
  },

  deleteStaff: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteStaff');
    }
  },

  getIntroductions: async (): Promise<IntroductionArticle[]> => {
    try {
      const snap = await getDocs(collection(db, 'introductions'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as IntroductionArticle));
    } catch (e) { 
      return handleFirebaseError(e, 'getIntroductions');
    }
  },

  saveIntroduction: async (introData: Partial<IntroductionArticle>) => {
    try {
      const docRef = introData.id ? doc(db, 'introductions', introData.id) : doc(collection(db, 'introductions'));
      await setDoc(docRef, introData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveIntroduction');
    }
  },

  deleteIntroduction: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'introductions', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteIntroduction');
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    } catch (e) { 
      return handleFirebaseError(e, 'getUsers');
    }
  },

  saveUser: async (userData: Partial<User>) => {
    try {
      const docRef = userData.id ? doc(db, 'users', userData.id) : doc(collection(db, 'users'));
      await setDoc(docRef, userData, { merge: true });
    } catch (e) {
      handleFirebaseError(e, 'saveUser');
    }
  },

  deleteUser: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirebaseError(e, 'deleteUser');
    }
  },

  getConfig: async (): Promise<SchoolConfig | null> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'school_config'));
      return snap.exists() ? (snap.data() as SchoolConfig) : null;
    } catch (e) { 
      return handleFirebaseError(e, 'getConfig');
    }
  },

  saveConfig: async (config: SchoolConfig) => {
    try {
      await setDoc(doc(db, 'settings', 'school_config'), config);
    } catch (e) {
      handleFirebaseError(e, 'saveConfig');
    }
  },

  trackVisit: async () => {
    try {
      const statsRef = doc(db, 'site_stats', 'counters');
      await setDoc(statsRef, {
        total_visits: increment(1),
        last_visit: serverTimestamp()
      }, { merge: true });
    } catch(e) {
      // Non-critical error
    }
  },

  getVisitorStats: async () => {
    try {
      const snap = await getDoc(doc(db, 'site_stats', 'counters'));
      const data = snap.data() || {};
      return {
        total: data.total_visits || 0,
        today: data.today_visits || 0,
        month: data.month_visits || 0,
        online: Math.floor(Math.random() * 5) + 1 
      };
    } catch (e) { 
      return { total: 0, today: 0, month: 0, online: 1 }; 
    }
  }
};
