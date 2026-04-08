import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Posts from './pages/Posts';
import YouTubeVideoAnalyzer from './pages/YouTubeVideoAnalyzer';
import Login from './pages/Login';
import StudyGroups from './pages/StudyGroups';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Library from './pages/Library';
import VirtualTeacher from './pages/VirtualTeacher';
import StudyPlanner from './pages/StudyPlanner';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import MaintenanceScreen from './components/MaintenanceScreen';
import { auth, db, onAuthStateChanged, doc, onSnapshot, User } from './lib/firebase';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isFirebaseError = this.state.error?.message.includes('Firebase') || 
                             this.state.error?.message.includes('Firestore') ||
                             this.state.error?.message.includes('fetch') ||
                             this.state.error?.message.includes('Network');
      
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-4">عذراً، حدث خطأ في الاتصال!</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {isFirebaseError 
                ? "يبدو أن هناك مشكلة في الاتصال بقاعدة البيانات Firebase. يرجى التأكد من إعدادات المشروع."
                : "حدث خطأ غير متوقع في التطبيق. يرجى المحاولة مرة أخرى."}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    // Initialize dark mode
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Maintenance Mode Listener
    const unsubscribeSettings = onSnapshot(doc(db, 'admin_settings', 'general'), (snapshot) => {
      if (snapshot.exists()) {
        setIsMaintenance(snapshot.data().maintenance_mode);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-bold animate-pulse">جاري التحميل...</p>
    </div>
  );

  const isAdmin = user?.email === 'nacero123@gmail.com' || user?.email === 'dzs325105@gmail.com';

  // Show maintenance screen for non-admins if maintenance mode is on
  // But allow access to /admin routes
  const isAppInMaintenance = isMaintenance && !isAdmin && !window.location.pathname.startsWith('/admin');

  if (isAppInMaintenance) {
    return <MaintenanceScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Normal App Routes */}
          <Route path="/*" element={
            <div className="flex h-[100dvh] bg-gray-50 dark:bg-slate-900 overflow-hidden">
              {/* Desktop Sidebar */}
              {user && (
                <div className="hidden md:block">
                  <Sidebar isOpen={true} toggle={() => {}} />
                </div>
              )}
              
              {/* Mobile Sidebar (Drawer) */}
              {user && (
                <div className="md:hidden">
                  <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
                </div>
              )}

              <div className="flex-1 flex flex-col min-w-0 relative">
                <main className="flex-1 overflow-y-auto scroll-smooth">
                  <Routes>
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/groups" element={user ? <StudyGroups /> : <Navigate to="/login" />} />
                    <Route path="/groups/:groupId" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
                    <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                    <Route path="/library" element={user ? <Library /> : <Navigate to="/login" />} />
                    <Route path="/ai" element={user ? <VirtualTeacher /> : <Navigate to="/login" />} />
                    <Route path="/posts" element={user ? <Posts /> : <Navigate to="/login" />} />
                    <Route path="/youtube" element={user ? <YouTubeVideoAnalyzer /> : <Navigate to="/login" />} />
                    <Route path="/planner" element={user ? <StudyPlanner /> : <Navigate to="/login" />} />
                    <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" />} />
                    <Route path="/search" element={user ? <div>البحث</div> : <Navigate to="/login" />} />
                  </Routes>
                </main>

                {user && <BottomNav />}
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
