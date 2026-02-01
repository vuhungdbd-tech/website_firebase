
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock, User as UserIcon, GraduationCap, AlertCircle, ArrowLeft, Info, ExternalLink } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
          const user: User = {
             id: firebaseUser.uid,
             username: email.split('@')[0],
             email: email,
             fullName: firebaseUser.displayName || 'Quản trị viên',
             role: UserRole.ADMIN
          };
          onLoginSuccess(user);
      }
    } catch (err: any) {
        console.error("Login error:", err);
        let errorMsg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
            errorMsg = 'Email hoặc mật khẩu không chính xác.';
        } else if (err.code === 'auth/network-request-failed') {
            errorMsg = 'Lỗi kết nối mạng. Vui lòng thử lại.';
        }
        setError(errorMsg);
        // Nếu sai thông tin, gợi ý mở bảng hướng dẫn
        setShowGuide(true);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative font-sans text-slate-900 px-4">
      {/* Nút về trang chủ */}
      <button 
        onClick={() => onNavigate('home')}
        className="absolute top-6 left-6 flex items-center text-gray-500 hover:text-blue-700 transition font-bold uppercase text-xs tracking-wider"
      >
        <ArrowLeft size={18} className="mr-2" /> Về trang chủ
      </button>

      <div className="w-full max-w-md">
        {/* Hướng dẫn tạo tài khoản (Chỉ hiện khi có lỗi hoặc nhấn vào) */}
        {showGuide && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 p-4 rounded-xl shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 text-blue-800 font-black uppercase text-xs mb-2">
              <Info size={16} /> Hướng dẫn đăng nhập
            </div>
            <p className="text-xs text-blue-700 leading-relaxed mb-3">
              Bạn cần tạo tài khoản quản trị trên <b>Firebase Console</b> trước khi đăng nhập tại đây:
            </p>
            <ol className="text-[11px] text-blue-900 space-y-1.5 list-decimal ml-4 font-medium">
              <li>Truy cập <a href="https://console.firebase.google.com/u/0/project/websitesuoilu-a10fa/authentication/users" target="_blank" className="underline font-bold text-blue-700 inline-flex items-center gap-0.5">Firebase Console <ExternalLink size={10}/></a></li>
              <li>Nhấn nút <b>Add User</b>.</li>
              <li>Nhập Email và Mật khẩu (VD: <code className="bg-white px-1">admin@gmail.com</code> / <code className="bg-white px-1">123456</code>).</li>
              <li>Dùng tài khoản vừa tạo để đăng nhập vào ô dưới đây.</li>
            </ol>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Thanh màu trang trí */}
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-900"></div>

          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
               <GraduationCap size={40} className="text-blue-900" />
             </div>
             <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Quản trị hệ thống</h2>
             <p className="text-sm text-gray-400 font-medium mt-1">Sử dụng tài khoản Google Firebase</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-xs flex items-start border border-red-100 animate-pulse">
               <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
               <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
             <div>
               <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Email tài khoản</label>
               <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-slate-900 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-300"
                    placeholder="admin@school.edu.vn"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
               </div>
             </div>

             <div>
               <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Mật khẩu bảo mật</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-slate-900 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
               </div>
             </div>

             <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full bg-blue-900 text-white font-black py-4 rounded-xl hover:bg-blue-800 transition shadow-xl transform active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                </button>
             </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
             <button 
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
             >
                {showGuide ? 'Ẩn hướng dẫn' : 'Làm sao để có tài khoản?'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
