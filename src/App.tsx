import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Posts from './pages/Posts';
import Reels from './pages/Reels';
import YouTubeVideoAnalyzer from './pages/YouTubeVideoAnalyzer';
import Login from './pages/Login';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import VirtualTeacher from './pages/VirtualTeacher';
import { auth } from './firebase';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {user && <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />}
        <div className="flex-1 flex flex-col">
          {user && (
            <header className="md:hidden bg-white p-4 flex items-center justify-between shadow-sm">
              <button onClick={toggleSidebar}><Menu /></button>
              <h1 className="font-bold text-lg">Bac DZ AI</h1>
              <div className="w-6" />
            </header>
          )}
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={() => {}} />} />
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
              <Route path="/chat/:id" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/ai" element={user ? <VirtualTeacher /> : <Navigate to="/login" />} />
              <Route path="/posts" element={user ? <Posts /> : <Navigate to="/login" />} />
              <Route path="/reels" element={user ? <Reels /> : <Navigate to="/login" />} />
              <Route path="/youtube" element={user ? <YouTubeVideoAnalyzer /> : <Navigate to="/login" />} />
              <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" />} />
              <Route path="/search" element={user ? <div>البحث</div> : <Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
