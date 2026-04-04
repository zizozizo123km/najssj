import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Posts from './pages/Posts';
import YouTubeVideoAnalyzer from './pages/YouTubeVideoAnalyzer';
import Login from './pages/Login';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Library from './pages/Library';
import VirtualTeacher from './pages/VirtualTeacher';
import StudyPlanner from './pages/StudyPlanner';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import MaintenanceScreen from './components/MaintenanceScreen';
import { auth, db } from './firebase';

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
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">عذراً، حدث خطأ ما!</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            {this.state.error?.message.includes('{') 
              ? "حدث خطأ في الاتصال بقاعدة البيانات. يرجى التحقق من إعدادات Firebase."
              : "حدث خطأ غير متوقع في التطبيق."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'admin_settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenance(docSnap.data().maintenanceMode || false);
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

  const isAdmin = user?.email === 'nacero123@gmail.com';

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
            <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
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
                {user && (
                  <Header 
                    onMenuClick={toggleSidebar} 
                    onSearchClick={() => console.log('Search')} 
                  />
                )}
                
                <main className="flex-1 overflow-y-auto scroll-smooth">
                  <Routes>
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
                    <Route path="/chat/:id" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
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
