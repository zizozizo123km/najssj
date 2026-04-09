import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, collection, query, where, onSnapshot, doc, getDoc, getCountFromServer, signOut, onAuthStateChanged, Timestamp } from '../../lib/firebase';
import { LogOut, LayoutDashboard, Users, Settings, Bell } from 'lucide-react';
import StatsCard from '../../components/admin/StatsCard';
import StudentTable from '../../components/admin/StudentTable';
import NotificationForm from '../../components/admin/NotificationForm';
import ApiKeysForm from '../../components/admin/ApiKeysForm';
import MaintenanceToggle from '../../components/admin/MaintenanceToggle';
import BookUploadForm from '../../components/admin/BookUploadForm';
import SummaryUploadForm from '../../components/admin/SummaryUploadForm';
import { BookOpen, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeToday: 0,
    notificationsSent: 0,
    appStatus: 'مفتوح'
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin');
        return;
      }

      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (!profileDoc.exists() || profileDoc.data().role !== 'admin') {
        // Double check with email if profile doesn't exist yet or role is not set
        if (user.email !== "dzs325105@gmail.com" && user.email !== "nacero123@gmail.com") {
          navigate('/admin');
          return;
        }
      }
    });

    // Stats fetching
    const fetchStats = async () => {
      // Total students
      const studentQuery = query(collection(db, 'profiles'), where('role', '!=', 'admin'));
      const studentSnapshot = await getCountFromServer(studentQuery);
      setStats(prev => ({ ...prev, totalStudents: studentSnapshot.data().count }));

      // Active Today (simplified: profiles created today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeQuery = query(
        collection(db, 'profiles'), 
        where('role', '!=', 'admin'),
        where('created_at', '>=', Timestamp.fromDate(today))
      );
      const activeSnapshot = await getCountFromServer(activeQuery);
      setStats(prev => ({ ...prev, activeToday: activeSnapshot.data().count }));

      // Notifications sent
      const notifQuery = collection(db, 'notifications');
      const notifSnapshot = await getCountFromServer(notifQuery);
      setStats(prev => ({ ...prev, notificationsSent: notifSnapshot.data().count }));

      // App status
      const unsubscribeSettings = onSnapshot(doc(db, 'admin_settings', 'general'), (doc) => {
        if (doc.exists()) {
          setStats(prev => ({ 
            ...prev, 
            appStatus: doc.data().maintenance_mode ? 'صيانة' : 'مفتوح' 
          }));
        }
      }, (error) => {
        console.error("Error fetching admin settings:", error);
      });

      return unsubscribeSettings;
    };

    let unsubscribeSettings: any;
    fetchStats().then(unsub => unsubscribeSettings = unsub);

    return () => {
      unsubscribeAuth();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin');
  };

  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'books', label: 'المكتبة', icon: BookOpen },
    { id: 'summaries', label: 'الملخصات', icon: FileText },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans dir-rtl flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-gray-800 border-b md:border-b-0 md:border-l border-gray-700 p-4 flex flex-col">
        <div className="flex items-center justify-between md:justify-center mb-8">
          <h1 className="text-xl font-black text-blue-500">لوحة التحكم</h1>
          <button onClick={handleLogout} className="md:hidden text-gray-400 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden md:block pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-[100dvh]">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black mb-6">نظرة عامة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="إجمالي الطلاب" value={stats.totalStudents} icon="users" color="blue" />
              <StatsCard title="نشط اليوم" value={stats.activeToday || 'N/A'} icon="activity" color="green" />
              <StatsCard title="الإشعارات المرسلة" value={stats.notificationsSent} icon="bell" color="purple" />
              <StatsCard title="حالة التطبيق" value={stats.appStatus} icon="server" color={stats.appStatus === 'مفتوح' ? 'green' : 'orange'} />
            </div>
            <div className="mt-8">
              <MaintenanceToggle />
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <StudentTable />
          </div>
        )}

        {activeTab === 'books' && (
          <div className="space-y-6">
            <BookUploadForm />
          </div>
        )}

        {activeTab === 'summaries' && (
          <div className="space-y-6">
            <SummaryUploadForm />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl">
            <NotificationForm />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <ApiKeysForm />
          </div>
        )}
      </div>
    </div>
  );
}
