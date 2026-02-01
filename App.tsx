
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar'; 
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { Introduction } from './pages/Introduction';
import { Documents } from './pages/Documents';
import { Gallery } from './pages/Gallery';
import { Staff } from './pages/Staff'; 
import { Login } from './pages/Login'; 
import { FloatingContact } from './components/FloatingContact';
import { NewsTicker } from './components/NewsTicker'; 
import { ManageNews } from './pages/admin/ManageNews';
import { ManageDocuments } from './pages/admin/ManageDocuments';
import { ManageGallery } from './pages/admin/ManageGallery';
import { ManageVideos } from './pages/admin/ManageVideos';
import { ManageUsers } from './pages/admin/ManageUsers';
import { ManageMenu } from './pages/admin/ManageMenu';
import { ManageSettings } from './pages/admin/ManageSettings';
import { ManageBlocks } from './pages/admin/ManageBlocks';
import { ManageStaff } from './pages/admin/ManageStaff';
import { ManageIntro } from './pages/admin/ManageIntro';
import { ManagePostCategories } from './pages/admin/ManagePostCategories'; 
import { Dashboard } from './pages/admin/Dashboard';
import { DatabaseService } from './services/database'; 
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { PageRoute, Post, SchoolConfig, SchoolDocument, GalleryImage, GalleryAlbum, User, UserRole, DisplayBlock, MenuItem, DocumentCategory, StaffMember, IntroductionArticle, PostCategory, Video } from './types';
// Fixed: Added RotateCcw to the imports from lucide-react to resolve the reference error in the PermissionErrorBanner
import { Loader2, AlertTriangle, ShieldAlert, Code, RotateCcw } from 'lucide-react';

const FALLBACK_CONFIG: SchoolConfig = {
  name: 'Trường PTDTBT TH và THCS Suối Lư',
  slogan: 'Trách nhiệm - Yêu thương - Sáng tạo',
  logoUrl: '',
  bannerUrl: '',
  principalName: '',
  address: 'Huyện Điện Biên Đông, Tỉnh Điện Biên',
  phone: '',
  email: 'suoilu@gmail.com',
  hotline: '0123456789',
  mapUrl: '',
  facebook: '',
  youtube: '',
  zalo: '',
  website: '',
  showWelcomeBanner: true,
  homeNewsCount: 6,
  homeShowProgram: true,
  primaryColor: '#1e3a8a',
  titleColor: '#fbbf24',
  titleShadowColor: 'rgba(0,0,0,0.8)',
  metaTitle: 'Trường PTDTBT TH và THCS Suối Lư',
  metaDescription: 'Cổng thông tin điện tử Trường PTDTBT TH và THCS Suối Lư'
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCategories, setPostCategories] = useState<PostCategory[]>([]);
  const [introductions, setIntroductions] = useState<IntroductionArticle[]>([]); 
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [docCategories, setDocCategories] = useState<DocumentCategory[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [blocks, setBlocks] = useState<DisplayBlock[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    refreshData();
    DatabaseService.trackVisit();

    const timer = setTimeout(() => {
      setLoading(false);
      if (!config) setConfig(FALLBACK_CONFIG);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || 'Admin User',
          username: user.email?.split('@')[0] || 'admin',
          role: UserRole.ADMIN
        });
      } else {
        setCurrentUser(null);
      }
    });

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => {
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, []);

  const handleUrlRouting = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const pageParam = searchParams.get('page');
      const idParam = searchParams.get('id');

      if (pageParam) {
        setCurrentPage(pageParam as PageRoute);
        if (idParam) setDetailId(idParam);
      } else {
        setCurrentPage('home');
      }
    } catch (e) {
      setCurrentPage('home');
    }
  };

  const refreshData = async (showLoader: boolean = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    setIsPermissionError(false);
    
    try {
        const results = await Promise.allSettled([
            DatabaseService.getConfig(),
            DatabaseService.getPosts(),
            DatabaseService.getDocuments(),
            DatabaseService.getDocCategories(),
            DatabaseService.getGallery(),
            DatabaseService.getAlbums(),
            DatabaseService.getVideos(),
            DatabaseService.getBlocks(),
            DatabaseService.getMenu(),
            DatabaseService.getStaff(),
            DatabaseService.getIntroductions(),
            DatabaseService.getPostCategories()
        ]);

        // Helper function to extract value from SettledResult
        const getValue = <T,>(result: PromiseSettledResult<T>, defaultValue: T): T => {
            if (result.status === 'rejected') {
                if (result.reason?.code === 'permission-denied' || result.reason?.message?.includes('Permission Denied')) {
                    setIsPermissionError(true);
                }
                return defaultValue;
            }
            return result.value;
        };

        const fetchedConfig = getValue(results[0], null);
        const fetchedPosts = getValue(results[1], []);
        const fetchedDocs = getValue(results[2], []);
        const fetchedCats = getValue(results[3], []);
        const fetchedGallery = getValue(results[4], []);
        const fetchedAlbums = getValue(results[5], []);
        const fetchedVideos = getValue(results[6], []);
        const fetchedBlocks = getValue(results[7], []);
        const fetchedMenu = getValue(results[8], []);
        const fetchedStaff = getValue(results[9], []);
        const fetchedIntros = getValue(results[10], []);
        const fetchedPostCats = getValue(results[11], []);

        setConfig(fetchedConfig || FALLBACK_CONFIG);
        setPosts(fetchedPosts);
        setDocuments(fetchedDocs);
        setDocCategories(fetchedCats);
        setGalleryImages(fetchedGallery);
        setAlbums(fetchedAlbums);
        setVideos(fetchedVideos);
        setBlocks(fetchedBlocks.filter((b:any) => b.isVisible).sort((a:any,b:any) => a.order - b.order));
        
        if (fetchedMenu.length === 0) {
           setMenuItems([
              { id: '1', label: 'Trang chủ', path: 'home', order: 1 },
              { id: '2', label: 'Giới thiệu', path: 'intro', order: 2 },
              { id: '3', label: 'Tin tức', path: 'news', order: 3 }
           ]);
        } else {
           setMenuItems(fetchedMenu.sort((a:any,b:any) => a.order - b.order));
        }

        setStaffList(fetchedStaff);
        setIntroductions(fetchedIntros.filter((i:any) => i.isVisible).sort((a:any,b:any) => a.order - b.order));
        setPostCategories(fetchedPostCats);
    } catch (err: any) {
        console.error("Lỗi dữ liệu:", err);
        setError("Có lỗi khi kết nối dữ liệu.");
        if (!config) setConfig(FALLBACK_CONFIG);
    } finally {
        if (showLoader) setLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    navigate('admin-dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    navigate('login');
  };

  const navigate = (path: string, id?: string) => {
    if (id) setDetailId(id);
    else setDetailId(undefined);
    
    setCurrentPage(path as PageRoute);
    window.scrollTo(0, 0);

    const newUrl = `/?page=${path}${id ? `&id=${id}` : ''}`;
    try {
        window.history.pushState({}, '', newUrl);
    } catch (e) {
        console.warn("Lệnh pushState bị chặn bởi chính sách bảo mật của trình duyệt/iframe:", e);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col gap-6 p-4 text-center">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <div className="space-y-2">
            <p className="text-gray-900 font-bold text-lg animate-pulse">Đang kết nối hệ thống...</p>
            <p className="text-gray-400 text-sm max-w-xs italic">Hãy đảm bảo bạn đã cấu hình tab Rules trên Firebase Console.</p>
        </div>
      </div>
    );
  }

  const activeConfig = config || FALLBACK_CONFIG;

  if (currentPage === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
  }

  const PermissionErrorBanner = () => (
    <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-2 border-red-500 rounded-3xl p-8 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="bg-red-600 p-6 rounded-2xl text-white shadow-lg shrink-0">
                    <ShieldAlert size={48} />
                </div>
                <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-black text-red-900 uppercase tracking-tight">Hệ thống bị chặn truy cập (Firebase Rules)</h3>
                    <p className="text-red-800 font-medium leading-relaxed">
                        Dữ liệu không thể hiển thị vì quy tắc bảo mật của Firebase đang chặn quyền đọc. 
                        Bạn cần thực hiện các bước sau để mở khóa website:
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-red-900 font-bold">
                        <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" className="underline text-blue-700">Firebase Console</a>.</li>
                        <li>Vào mục <b>Firestore Database</b> &gt; Tab <b>Rules</b>.</li>
                        <li>Dán đoạn mã dưới đây và nhấn <b>Publish</b>:</li>
                    </ol>
                    <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm relative group shadow-inner">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText("rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}");
                                alert("Đã sao chép mã Rules!");
                            }}
                            className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <Code size={14}/> Sao chép mã
                        </button>
                        <pre className="overflow-x-auto">
                            {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}`}
                        </pre>
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 bg-red-700 text-white px-8 py-3 rounded-xl font-black uppercase text-sm hover:bg-red-800 transition shadow-lg active:scale-95 flex items-center gap-3"
                    >
                        <RotateCcw size={20}/> Đã xong, tải lại trang
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  if (currentPage.startsWith('admin-')) {
    if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    
    return (
      <AdminLayout activePage={currentPage} onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout}>
        {isPermissionError && <PermissionErrorBanner />}
        {currentPage === 'admin-dashboard' && <Dashboard posts={posts} />}
        {currentPage === 'admin-news' && <ManageNews posts={posts} categories={postCategories} refreshData={refreshData} />}
        {currentPage === 'admin-categories' && <ManagePostCategories refreshData={refreshData} />}
        {currentPage === 'admin-videos' && <ManageVideos refreshData={refreshData} />}
        {currentPage === 'admin-intro' && <ManageIntro refreshData={refreshData} />}
        {currentPage === 'admin-blocks' && <ManageBlocks />}
        {currentPage === 'admin-docs' && <ManageDocuments documents={documents} categories={docCategories} refreshData={refreshData} />}
        {currentPage === 'admin-gallery' && <ManageGallery images={galleryImages} albums={albums} refreshData={refreshData} />}
        {currentPage === 'admin-staff' && <ManageStaff refreshData={refreshData} />} 
        {currentUser.role === UserRole.ADMIN && (
          <>
            {currentPage === 'admin-users' && <ManageUsers refreshData={refreshData} />}
            {currentPage === 'admin-menu' && <ManageMenu refreshData={refreshData} />}
            {currentPage === 'admin-settings' && <ManageSettings />}
          </>
        )}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      <Header config={activeConfig} menuItems={menuItems} onNavigate={navigate} activePath={currentPage} />
      <NewsTicker posts={posts} onNavigate={navigate} primaryColor={activeConfig.primaryColor} />
      <main className="flex-grow w-full">
        {isPermissionError && currentPage === 'home' && <PermissionErrorBanner />}
        {currentPage === 'home' && !isPermissionError && <Home posts={posts} postCategories={postCategories} docCategories={docCategories} config={activeConfig} gallery={galleryImages} videos={videos} blocks={blocks} introductions={introductions} onNavigate={navigate} />}
        {currentPage === 'intro' && <Introduction config={activeConfig} />}
        {currentPage === 'staff' && <Staff staffList={staffList} />}
        {currentPage === 'documents' && <Documents documents={documents} categories={docCategories} initialCategorySlug="official" />}
        {currentPage === 'resources' && <Documents documents={documents} categories={docCategories} initialCategorySlug="resource" />}
        {currentPage === 'gallery' && <Gallery images={galleryImages} albums={albums} />}
        {currentPage === 'news-detail' && detailId && (
          <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    {(() => {
                      const post = posts.find(p => p.id === detailId);
                      if (!post) return <div className="p-10 text-center">Bài viết không tồn tại</div>;
                      return (
                        <article className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200 animate-fade-in">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
                            <div className="prose prose-blue prose-lg max-w-none text-gray-900 leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </article>
                      );
                    })()}
                </div>
                <div className="lg:col-span-4">
                    <Sidebar blocks={blocks.filter(b => b.position === 'sidebar')} posts={posts} postCategories={postCategories} docCategories={docCategories} documents={documents} onNavigate={navigate} currentPage="news-detail" videos={videos} />
                </div>
              </div>
          </div>
        )}
      </main>
      <Footer config={activeConfig} />
      <FloatingContact config={activeConfig} />
    </div>
  );
};

export default App;
