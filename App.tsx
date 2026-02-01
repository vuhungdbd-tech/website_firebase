
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
import { Loader2, AlertTriangle } from 'lucide-react';

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

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    refreshData();
    DatabaseService.trackVisit();

    // Safety timeout: Tắt màn hình loading sau 4 giây dù có lỗi hay không
    const timer = setTimeout(() => {
      setLoading(false);
      if (!config) setConfig(FALLBACK_CONFIG);
    }, 4000);

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

        // Trích xuất dữ liệu an toàn từ các promise đã settled
        const fetchedConfig = results[0].status === 'fulfilled' ? results[0].value : null;
        const fetchedPosts = results[1].status === 'fulfilled' ? results[1].value : [];
        const fetchedDocs = results[2].status === 'fulfilled' ? results[2].value : [];
        const fetchedCats = results[3].status === 'fulfilled' ? results[3].value : [];
        const fetchedGallery = results[4].status === 'fulfilled' ? results[4].value : [];
        const fetchedAlbums = results[5].status === 'fulfilled' ? results[5].value : [];
        const fetchedVideos = results[6].status === 'fulfilled' ? results[6].value : [];
        const fetchedBlocks = results[7].status === 'fulfilled' ? results[7].value : [];
        const fetchedMenu = results[8].status === 'fulfilled' ? results[8].value : [];
        const fetchedStaff = results[9].status === 'fulfilled' ? results[9].value : [];
        const fetchedIntros = results[10].status === 'fulfilled' ? results[10].value : [];
        const fetchedPostCats = results[11].status === 'fulfilled' ? results[11].value : [];

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
        setError("Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.");
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

    // FIX: Sử dụng try-catch cho pushState vì một số môi trường iframe (như AI Studio sandbox) chặn tính năng này
    const newUrl = `/?page=${path}${id ? `&id=${id}` : ''}`;
    try {
        window.history.pushState({}, '', newUrl);
    } catch (e) {
        console.warn("Lệnh pushState bị chặn bởi chính sách bảo mật của trình duyệt/iframe:", e);
    }
  };

  // Màn hình loading an toàn
  if (loading && !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col gap-6 p-4 text-center">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <div className="space-y-2">
            <p className="text-gray-900 font-bold text-lg animate-pulse">Đang kết nối đến hệ thống...</p>
            <p className="text-gray-400 text-sm max-w-xs">Nếu chờ quá lâu, vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.</p>
        </div>
      </div>
    );
  }

  const activeConfig = config || FALLBACK_CONFIG;

  if (currentPage === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
  }

  if (currentPage.startsWith('admin-')) {
    if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    
    return (
      <AdminLayout activePage={currentPage} onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout}>
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
      {error && (
        <div className="bg-red-600 text-white p-2 text-center text-sm font-bold flex items-center justify-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      <Header config={activeConfig} menuItems={menuItems} onNavigate={navigate} activePath={currentPage} />
      <NewsTicker posts={posts} onNavigate={navigate} primaryColor={activeConfig.primaryColor} />
      <main className="flex-grow w-full">
        {currentPage === 'home' && <Home posts={posts} postCategories={postCategories} docCategories={docCategories} config={activeConfig} gallery={galleryImages} videos={videos} blocks={blocks} introductions={introductions} onNavigate={navigate} />}
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
                        <article className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
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
