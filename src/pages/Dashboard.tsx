import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, Play, Sparkles, TrendingUp, BookOpen, Video, FileText, 
  AlertTriangle, Plus, Trophy, Medal, Star, Flame, Calendar, User, Download, GraduationCap,
  Gem, Check, ArrowRight, ShieldAlert, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth, db, collection, query, orderBy, onSnapshot, doc, deleteDoc, onAuthStateChanged, getDocs, where, limit, updateDoc, addDoc } from '../lib/firebase';
import FeedCard from '../components/feed/FeedCard';
import Loader from '../components/feed/Loader';
import CreatePostModal from '../components/feed/CreatePostModal';
import ProfilePreview from '../components/profile/ProfilePreview';
import { BAC_BRANCHES } from '../data/baccalaureate';

import BacCountdown from '../components/BacCountdown';

export default function Dashboard() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ summaries: 0, videos: 0, successRate: 0, points: 0, level: 'مبتدئ' });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // --- Gamification States ---
  const [diamonds, setDiamonds] = useState(12);
  const [streakDays, setStreakDays] = useState(5);
  const [activeTab, setActiveTab] = useState<'targets' | 'badges'>('targets');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedPlan, setSelectedPlan] = useState<number>(3); // default 3 Months
  const [selectedPayMethod, setSelectedPayMethod] = useState<string>('baridimob');
  const [isPaying, setIsPaying] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'alltime'>('weekly');

  // --- Fully-Fledged Premium Form States ---
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // e.g. 100 for 100% free

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState(false);

  // BaridiMob / CCP details
  const [ccpSenderName, setCcpSenderName] = useState('');
  const [ccpTransactionRef, setCcpTransactionRef] = useState('');
  const [ccpReceiptPreview, setCcpReceiptPreview] = useState<string | null>(null);

  // PayPal details
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [missions, setMissions] = useState([
    { id: 1, title: 'احصل على 25 جوهرة', desc: 'كل دقيقة مراجعة تمنحك فرصة', target: 25, current: 12, xp: 40, icon: '💎', type: 'diamonds', claimed: false },
    { id: 2, title: 'احصل على 40 نقطة مراجعة', desc: 'أكمل التحديات والوسائط لزيادة XP', target: 40, current: 24, xp: 40, icon: '⚡', type: 'xp', claimed: false },
    { id: 3, title: 'حل اختبارين بالكامل', desc: 'تساعدك على ترسيخ الأساسيات والدروس', target: 2, current: 0, xp: 80, icon: '🎯', type: 'lessons', claimed: false },
    { id: 4, title: 'أكمل تحدي اليوم بامتياز', desc: 'حل أسئلة البكالوريا المصغرة', target: 1, current: 1, xp: 120, icon: '🔥', type: 'challenge', claimed: false } // Ready to claim!
  ]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
      if (user) {
        fetchStudentStats(user.uid);
        
        // Listen to active user's profile with real-time streak updating
        const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const pData = docSnap.data();
            setProfile(pData);
            if (pData.points !== undefined) {
              setStats(prev => ({ ...prev, points: pData.points }));
            }
            if (pData.diamonds !== undefined) {
              setDiamonds(pData.diamonds);
            } else {
              await updateDoc(doc(db, 'profiles', user.uid), { diamonds: 15 });
            }
            if (pData.streak_days !== undefined) {
              setStreakDays(pData.streak_days);
            } else {
              await updateDoc(doc(db, 'profiles', user.uid), { streak_days: 1 });
            }

            // Streak check logic using local timezone date (real days)
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
            const lastActive = pData.last_active_date;
            if (!lastActive) {
              await updateDoc(doc(db, 'profiles', user.uid), {
                streak_days: 1,
                last_active_date: today
              });
            } else if (lastActive !== today) {
              const [y1, m1, d1] = lastActive.split('-').map(Number);
              const [y2, m2, d2] = today.split('-').map(Number);
              
              const d1Obj = new Date(y1, m1 - 1, d1);
              const d2Obj = new Date(y2, m2 - 1, d2);
              
              const diffTime = Math.abs(d2Obj.getTime() - d1Obj.getTime());
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                const newStreak = (pData.streak_days || 0) + 1;
                const currentDiamonds = pData.diamonds !== undefined ? pData.diamonds : 15;
                await updateDoc(doc(db, 'profiles', user.uid), {
                  streak_days: newStreak,
                  last_active_date: today,
                  diamonds: currentDiamonds + 2
                });
                alert(`🔥 ممتاز! حافظت على سلسلة دراستك لليوم الـ ${newStreak} على التوالي! حصلت على جوهرتين إضافيتين! 💎💎`);
              } else if (diffDays > 1) {
                await updateDoc(doc(db, 'profiles', user.uid), {
                  streak_days: 1,
                  last_active_date: today
                });
              }
            }
          }
        });
        return () => unsubProfile();
      }
    });

    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        authorId: doc.data().author_id,
        authorName: doc.data().author_name,
        authorAvatar: doc.data().author_avatar
      }));
      setFeed(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    // Fetch Leaderboard for Honor Roll
    const fetchLeaderboard = async () => {
      try {
        const lbQuery = query(collection(db, 'profiles'), orderBy('points', 'desc'), limit(15));
        const lbSnapshot = await getDocs(lbQuery);
        const lbData = lbSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaderboard(lbData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };
    fetchLeaderboard();

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const fetchStudentStats = async (userId: string) => {
    try {
      const summariesSnapshot = await getDocs(query(collection(db, 'summaries'), where('user_id', '==', userId)));
      const summariesCount = summariesSnapshot.size;

      const videosSnapshot = await getDocs(query(collection(db, 'watched_videos'), where('user_id', '==', userId)));
      const videosCount = videosSnapshot.size;

      const quizSnapshot = await getDocs(query(collection(db, 'quiz_sessions'), where('user_id', '==', userId)));
      let totalScore = 0;
      let totalQuestions = 0;
      quizSnapshot.forEach(doc => {
        totalScore += doc.data().score;
        totalQuestions += doc.data().total_questions;
      });
      const successRate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 105) : 0;

      const profileDoc = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', userId)));
      let points = 0;
      let level = 'مبتدئ';
      let userDiamonds = 12;
      let claimedMissions: number[] = [];
      let claimedMissionsDate = '';
      let branch = 'sciences';

      if (!profileDoc.empty) {
        const pData = profileDoc.docs[0].data();
        points = pData.points || 0;
        level = pData.level || 'مبتدئ';
        userDiamonds = pData.diamonds !== undefined ? pData.diamonds : 15;
        claimedMissions = pData.claimed_missions || [];
        claimedMissionsDate = pData.claimed_missions_date || '';
        branch = pData.branch || 'sciences';
      }

      setStats({ summaries: summariesCount, videos: videosCount, successRate: successRate > 100 ? 100 : successRate, points, level });

      // Daily missions logic calculated dynamically
      const todayStr = new Date().toISOString().split('T')[0];
      const todayQuizzes = quizSnapshot.docs.filter(d => d.data().date === todayStr);
      
      const todaySummaries = summariesSnapshot.docs.filter(d => {
        const ts = d.data().created_at;
        if (!ts) return false;
        const dDate = new Date(ts.seconds * 1000).toISOString().split('T')[0];
        return dDate === todayStr;
      });
      const todaySummariesCount = todaySummaries.length;

      // Calculate today's watched videos dynamically
      const todayVideos = videosSnapshot.docs.filter(d => {
        const ts = d.data().created_at;
        if (!ts) return false;
        let dDate = '';
        if (ts.seconds) {
          dDate = new Date(ts.seconds * 1000).toISOString().split('T')[0];
        } else {
          dDate = new Date(ts).toISOString().split('T')[0];
        }
        return dDate === todayStr;
      });
      const todayVideosCount = todayVideos.length;

      // Total XP today = (quizzes points) + (summaries * 20) + (completed video lessons * 20)
      const todayXpPoints = todayQuizzes.reduce((sum, d) => sum + (d.data().points || 0), 0) + (todaySummariesCount * 20) + (todayVideosCount * 20);

      const todayQuizzesCount = todayQuizzes.length;
      const todayChallengesCount = todayQuizzes.filter(d => d.data().mode === 'challenge').length;

      // Auto-reset claimed missions list if day transitioned
      if (claimedMissionsDate !== todayStr && userId) {
        claimedMissions = [];
        await updateDoc(doc(db, 'profiles', userId), {
          claimed_missions: [],
          claimed_missions_date: todayStr
        }).catch(err => console.error("Error updating claimed missions reset:", err));
      }

      // Map level to target multipliers
      let diamondTarget = 25;
      let xpTarget = 40;
      let quizzesTarget = 2;
      let challengesTarget = 1;

      if (level === 'بطل') {
        diamondTarget = 50;
        xpTarget = 150;
        quizzesTarget = 3;
        challengesTarget = 2;
      } else if (level === 'خبير') {
        diamondTarget = 40;
        xpTarget = 100;
        quizzesTarget = 2;
        challengesTarget = 2;
      } else if (level === 'متقدم') {
        diamondTarget = 30;
        xpTarget = 60;
        quizzesTarget = 2;
        challengesTarget = 1;
      } else { // 'مبتدئ'
        diamondTarget = 20;
        xpTarget = 30;
        quizzesTarget = 1;
        challengesTarget = 1;
      }

      // Helper to identify core subjects according to the branch/coordination
      const getBranchCoreSubjects = (b: string): string[] => {
        switch (b) {
          case 'sciences':
            return ['علوم الطبيعة والحياة', 'الفيزياء', 'الرياضيات', 'svt', 'physics', 'math'];
          case 'math':
            return ['الرياضيات', 'الفيزياء', 'math', 'physics'];
          case 'tech_math':
            return ['الرياضيات', 'الفيزياء', 'التكنولوجيا', 'math', 'physics', 'tech'];
          case 'literature':
            return ['الفلسفة', 'اللغة العربية وآدابها', 'اللغة العربية', 'philosophy', 'arabic'];
          case 'languages':
            return ['اللغة الإنجليزية', 'اللغة الفرنسية', 'اللغة الألمانية', 'اللغة الإسبانية', 'اللغة الإيطالية', 'english', 'french', 'german', 'spanish', 'italian'];
          case 'economy':
            return ['التسيير والمحاسبة', 'الاقتصاد', 'القانون', 'accounting', 'economy', 'law'];
          case 'arts':
            return ['الفنون', 'arts'];
          default:
            return ['علوم الطبيعة والحياة', 'الرياضيات', 'الفيزياء', 'svt', 'math', 'physics'];
        }
      };

      const branchName = BAC_BRANCHES.find(b => b.id === branch)?.name || 'علوم تجريبية';
      
      const coreSubjectsMap: Record<string, { name: string; id: string }> = {
        'sciences': { name: 'علوم الطبيعة والحياة', id: 'svt' },
        'math': { name: 'الرياضيات', id: 'math' },
        'tech_math': { name: 'الرياضيات', id: 'math' },
        'literature': { name: 'الفلسفة', id: 'philosophy' },
        'languages': { name: 'اللغة الإنجليزية', id: 'english' },
        'economy': { name: 'التسيير والمحاسبة', id: 'accounting' },
        'arts': { name: 'الفنون', id: 'arts' }
      };
      const coreInfo = coreSubjectsMap[branch] || { name: 'علوم الطبيعة والحياة', id: 'svt' };
      const coreSubjectName = coreInfo.name;

      const coreSubjectsList = getBranchCoreSubjects(branch);
      const todayCoreQuizzesCount = todayQuizzes.filter(d => {
        const sub = d.data().subject;
        if (!sub) return false;
        return coreSubjectsList.some(coreSub => sub.toLowerCase().includes(coreSub.toLowerCase()));
      }).length;

      setMissions([
        { 
          id: 1, 
          title: `إتمام درس فيديو مادة أساسية`, 
          desc: `شاهد درسًا تعليميًا في مادتك لشعبة ${branchName} وأكمله بالكامل`, 
          target: 1, 
          current: todayVideosCount, 
          xp: 40, 
          icon: '📺', 
          type: 'diamonds', 
          claimed: claimedMissions.includes(1) 
        },
        { 
          id: 2, 
          title: `اكتساب ${xpTarget} نقطة XP اليوم`, 
          desc: `أكمل اختبارات ومراجعات لرفع مستواك الدراسي لليوم الحالي`, 
          target: xpTarget, 
          current: todayXpPoints, 
          xp: 40, 
          icon: '⚡', 
          type: 'xp', 
          claimed: claimedMissions.includes(2) 
        },
        { 
          id: 3, 
          title: `اختبار مادة ${coreSubjectName}`, 
          desc: `حل اختبار في مادتك الأساسية لشعبة ${branchName}`, 
          target: quizzesTarget, 
          current: todayCoreQuizzesCount, 
          xp: 80, 
          icon: '🎯', 
          type: 'lessons', 
          claimed: claimedMissions.includes(3) 
        },
        { 
          id: 4, 
          title: `إكمال ${challengesTarget} تحدي بكالوريا مصغر`, 
          desc: `اجتياز وحل التحديات اليومية المخصصة لمستواك (${level})`, 
          target: challengesTarget, 
          current: todayChallengesCount, 
          xp: 120, 
          icon: '🔥', 
          type: 'challenge', 
          claimed: claimedMissions.includes(4) 
        }
      ]);

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreatePost = (newPost: any) => {};

  const handleDeletePost = async (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditPost = (id: string) => {
    const post = feed.find(p => p.id === id);
    if (post) {
      setEditingPost(post);
      setIsCreateModalOpen(true);
    }
  };

  // --- Gamification Logic ---
  const handleClaimReward = async (missionId: number, xpReward: number) => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981']
    });

    const addedPoints = stats.points + xpReward;
    
    // Update live UX
    setStats(prev => ({ ...prev, points: addedPoints }));
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, claimed: true } : m));

    // Save strictly to firebase db
    if (currentUserId) {
      try {
        let currentClaimed: number[] = [];
        if (profile) {
          currentClaimed = profile.claimed_missions || [];
        }
        
        const nextClaimed = [...currentClaimed.filter(id => id !== missionId), missionId];
        const todayStr = new Date().toISOString().split('T')[0];

        // Award bonus diamonds on claim!
        let diamondBonus = 5;
        if (missionId === 3) diamondBonus = 10;
        if (missionId === 4) diamondBonus = 15;

        const nextDiamonds = (profile?.diamonds !== undefined ? profile.diamonds : 15) + diamondBonus;

        await updateDoc(doc(db, 'profiles', currentUserId), {
          points: addedPoints,
          diamonds: nextDiamonds,
          claimed_missions: nextClaimed,
          claimed_missions_date: todayStr
        });
        
        setDiamonds(nextDiamonds);
        alert(`🎁 مبروك! لقد استلمت ${xpReward} XP و +${diamondBonus} جوهرة إضافية! 💎✨`);
      } catch (e) {
        console.error("Error saving claimed rewards:", e);
      }
    }
  };

  const handleApplyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCouponError('الرجاء إدخال الكود أولاً');
      return;
    }

    if (['BAC2026', 'DZVIP', 'MOUADALY100', 'FREEGOLD'].includes(trimmed)) {
      setIsCouponApplied(true);
      setCouponDiscount(100);
      setCouponError('');
    } else if (trimmed === 'DZ50') {
      setIsCouponApplied(true);
      setCouponDiscount(50);
      setCouponError('');
    } else if (trimmed === 'STUDENT30') {
      setIsCouponApplied(true);
      setCouponDiscount(30);
      setCouponError('');
    } else {
      setCouponError('كود الكوبون غير صحيح أو منتهي الصلاحية');
      setIsCouponApplied(false);
      setCouponDiscount(0);
    }
  };

  const getPlanPrice = () => {
    const prices: Record<number, number> = { 1: 10, 3: 26, 6: 46, 12: 86 };
    const original = prices[selectedPlan] || 26;
    const discount = (original * couponDiscount) / 100;
    return {
      original,
      discount,
      final: original - discount
    };
  };

  const handleStartPayment = async () => {
    const { final } = getPlanPrice();

    if (final > 0) {
      if (selectedPayMethod === 'baridimob') {
        if (!ccpSenderName.trim()) {
          alert('الرجاء إدخال اسم مرسل الحوالة الكامل');
          return;
        }
        if (!ccpTransactionRef.trim() || ccpTransactionRef.trim().length < 6) {
          alert('الرجاء إدخال رقم المعاملة بشكل صحيح (على الأقل 6 أرقام)');
          return;
        }
      } else if (selectedPayMethod === 'card') {
        if (cardNumber.replace(/\s/g, '').length !== 16) {
          alert('الرجاء إدخال رقم البطاقة الائتمانية بشكل صحيح (16 رقماً)');
          return;
        }
        if (!cardHolder.trim()) {
          alert('الرجاء إدخال اسم حامل البطاقة');
          return;
        }
        const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
        if (!expiryRegex.test(cardExpiry)) {
          alert('الرجاء إدخال تاريخ انتهاء الصلاحية بشكل صحيح MM/YY');
          return;
        }
        if (cardCvv.length < 3) {
          alert('الرجاء إدخال رمز الأمان CVV بشكل صحيح');
          return;
        }
      } else if (selectedPayMethod === 'paypal') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(paypalEmail)) {
          alert('الرجاء إدخال بريد إلكتروني صالح لحساب PayPal');
          return;
        }
        if (paypalPassword.length < 6) {
          alert('الرجاء إدخال كلمة مرور حساب PayPal بشكل صحيح');
          return;
        }
      }
    }

    setIsPaying(true);

    if (currentUserId) {
      try {
        const dbFields = {
          userId: currentUserId,
          userName: profile?.full_name || 'طالب',
          userEmail: auth.currentUser?.email || '',
          planMonths: selectedPlan,
          originalPrice: getPlanPrice().original,
          discount: getPlanPrice().discount,
          finalPrice: final,
          paymentMethod: selectedPayMethod,
          couponUsed: isCouponApplied ? couponCode.trim().toUpperCase() : null,
          timestamp: new Date().toISOString(),
          status: 'completed',
          senderName: selectedPayMethod === 'baridimob' ? ccpSenderName : null,
          transactionRef: selectedPayMethod === 'baridimob' ? ccpTransactionRef : null,
          receiptPreview: selectedPayMethod === 'baridimob' ? ccpReceiptPreview : null,
          cardNumberMasked: selectedPayMethod === 'card' ? `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}` : null,
        };
        await addDoc(collection(db, 'premium_subscriptions'), dbFields);
      } catch (e) {
        console.error("Error logging subscription request:", e);
      }
    }

    setTimeout(() => {
      setIsPaying(false);
      setSubStep(4);
      handleUnlockPremium();
    }, 2500);
  };

  const handleUnlockPremium = async () => {
    confetti({
      particleCount: 200,
      spread: 120,
      colors: ['#FFD705', '#F59E0B', '#9333EA', '#EC4899']
    });
    
    // Update state & save to firestore
    if (currentUserId) {
      try {
        await updateDoc(doc(db, 'profiles', currentUserId), {
          is_premium: true
        });
      } catch (e) {
        console.error("Error upgrading to Premium:", e);
      }
    }
  };

  const isAdmin = profile?.role === 'admin' || auth.currentUser?.email === 'nacero123@gmail.com' || auth.currentUser?.email === 'dzs325105@gmail.com';

  const filteredFeed = activeFilter === 'all' 
    ? feed 
    : feed.filter(item => item.type === activeFilter);

  // Fallback demo highlight video list
  const fallbackVideos = [
    {
      id: 'vid-1',
      title: 'مراجعة الميكانيك وحل باكالوريا سابقة بامتياز',
      author: 'الأستاذ خالد فيزياء',
      duration: '12:45m',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      views: '3.4K'
    },
    {
      id: 'vid-2',
      title: 'أسرار كتابة مقالة فلسفية ممتازة للعلامة الكاملة',
      author: 'الاستاذة سارة فلسفة',
      duration: '7:10m',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      views: '1.2K'
    }
  ];

  // Dynamically prepare podium champions
  const podiumWinners = [...leaderboard].slice(0, 3);
  const remainingLeaderboard = [...leaderboard].slice(3);

  // Fill in mock champions if firebase list has less than 3
  const firstPlace = podiumWinners[0] || { full_name: 'مريم الصالح', points: 948, id: 'mock-1', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' };
  const secondPlace = podiumWinners[1] || { full_name: 'أحمد الجزائري', points: 872, id: 'mock-2', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' };
  const thirdPlace = podiumWinners[2] || { full_name: 'أمينة بن يوسف', points: 769, id: 'mock-3', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' };

  // Dynamically prepare weekly active days list for the "شعلة الاتساق" calendar
  const getDynamicWeekDays = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const daysOfWeekAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    const daysOfWeekEn = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    
    const now = new Date();
    const currentDay = now.getDay();
    // Offset to find Monday of this week (Sunday is 0, Monday is 1...)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() + mondayOffset);
    
    const weekDays = [];
    const lastActiveDateStr = profile?.last_active_date;
    const streakDaysCount = streakDays || 0;
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      let isActive = false;
      if (lastActiveDateStr && streakDaysCount > 0) {
        const [y1, m1, d1] = lastActiveDateStr.split('-').map(Number);
        const [y2, m2, d2] = dateStr.split('-').map(Number);
        
        const lastActiveObj = new Date(y1, m1 - 1, d1);
        const thisDayObj = new Date(y2, m2 - 1, d2);
        
        const diffTime = lastActiveObj.getTime() - thisDayObj.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < streakDaysCount) {
          isActive = true;
        }
      }
      
      const isCurrent = dateStr === todayStr;
      
      weekDays.push({
        label: daysOfWeekAr[i],
        labelShort: daysOfWeekEn[i],
        active: isActive,
        current: isCurrent,
        dateStr
      });
    }
    return weekDays;
  };

  const dynamicWeekDays = getDynamicWeekDays();

  return (
    <div className="max-w-md md:max-w-7xl mx-auto min-h-screen bg-[#F3F7FA] dark:bg-[#070514] pb-28 md:pb-12 font-sans transition-colors relative antialiased px-4 md:px-8 shadow-inner" dir="rtl">
      
      {/* Dynamic Top Stat Bar */}
      <div className="flex items-center justify-between gap-3 pt-4 px-2 overflow-x-auto scrollbar-none pb-2 border-b border-gray-150 dark:border-gray-901">
        <div className="flex items-center gap-2">
          {/* Streak indicator */}
          <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs">
            <Flame size={14} className="fill-orange-500 text-orange-500" />
            <span>{streakDays} أيام متتالية</span>
          </div>
          
          {/* Diamonds meter */}
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-105 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
            <Gem size={14} className="fill-blue-500 text-blue-500" />
            <span>{diamonds} جوهرة</span>
          </div>

          {/* Points indicator */}
          <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-100 dark:border-yellow-500/20 text-yellow-650 dark:text-yellow-400 font-extrabold text-xs">
            <Trophy size={14} className="text-yellow-500" />
            <span>{stats.points} XP</span>
          </div>
        </div>

        {/* Level Indicator & Go VIP */}
        <div className="flex items-center gap-2">
          {profile?.is_premium ? (
            <span className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md">
              <Sparkles size={13} />
              شريك ماسي VIP
            </span>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSubStep(1);
                setIsSubModalOpen(true);
              }}
              className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow hover:shadow-indigo-500/25 transition-all text-center cursor-pointer"
            >
              <Sparkles size={13} className="animate-spin" />
              <span>ترقية ذهبية</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* Main Content Column (Takes 8 of 12 columns on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Header Area with Notification & Profile details */}
          <header className="py-2 flex items-center justify-between md:bg-white md:dark:bg-[#120F30] md:p-5 md:rounded-3xl md:shadow-md md:border md:border-gray-150 md:dark:border-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-lg">
                      {profile?.full_name?.charAt(0) || 'أ'}
                    </div>
                  )}
                </div>
                {profile?.is_premium && (
                  <span className="absolute -top-1.5 -right-1 z-10 bg-yellow-450 border border-white text-white p-0.5 rounded-full shadow-md text-[9px]">👑</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[17px] font-black text-gray-900 dark:text-white leading-tight">
                    {profile?.full_name || 'تلميذنا البطل'}
                  </h2>
                  {profile?.is_premium && (
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-amber-205 dark:border-amber-500/30">VIP</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">الرئيسية • {stats.level}</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/notifications')} 
              className="w-10 h-10 bg-white dark:bg-[#18143C] rounded-full flex items-center justify-center shadow-sm relative group active:scale-95 transition-transform border border-gray-100 dark:border-gray-804"
            >
              <Bell size={20} className="text-gray-750 dark:text-gray-300 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
            </button>
          </header>

          {/* 2. Baccalaureate Countdown Timer */}
          <section className="my-2">
            <BacCountdown />
          </section>

          {/* 5 Days Straight Streak Calendar Widget */}
          <section className="bg-white dark:bg-[#120F30] rounded-3xl p-5 border border-gray-150 dark:border-purple-900/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-right">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-[15px] flex items-center gap-2">
                  <Flame size={18} className="text-orange-500 animate-pulse" />
                  شعلة الاتساق: {streakDays} أيام متتالية!
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-purple-300/60 mt-0.5">يزداد مستوى نقاطك إذا التزمت يوميًا وحققت أهدافك</p>
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">سجل النشاط اليومي</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2.5 pt-2">
              {dynamicWeekDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all border ${
                    day.active 
                      ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white border-transparent shadow shadow-indigo-500/30' 
                      : day.current 
                        ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-300' 
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-400 border-transparent'
                  }`}>
                    {day.active ? <Check size={16} strokeWidth={3} /> : <span className="text-xs">{day.labelShort}</span>}
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-404 mt-1.5">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Grid Navigation / Quick Cards */}
          <section className="mt-4">
            <div className="mb-3 text-right">
              <h3 className="font-black text-gray-900 dark:text-white text-[15px]">الجدول والأقسام الدراسية</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Link 
                to="/past-exams" 
                className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-emerald-850 dark:text-emerald-350 block">المواضيع السابقة</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-semibold">حلول رسمية تفصيلية</span>
                </div>
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Download size={18} />
                </div>
              </Link>

              <Link 
                to="/posts" 
                className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-indigo-850 dark:text-indigo-300 block">منتدى الطلاب</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">تفاعل واستفسارات</span>
                </div>
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <FileText size={18} />
                </div>
              </Link>

              <Link 
                to="/quiz" 
                className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-amber-850 dark:text-amber-350 block">بنك الأسئلة</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">اختبارات ذكية</span>
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <GraduationCap size={18} />
                </div>
              </Link>

              <Link 
                to="/youtube" 
                className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-rose-850 dark:text-rose-350 block">مساعد يوتيوب</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-sans">تلخيص مرئي فوري</span>
                </div>
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <Play size={18} />
                </div>
              </Link>
            </div>
          </section>

          {/* "Daily Missions" & Badges Segment */}
          <section className="bg-white dark:bg-[#120F30] rounded-[32px] p-6 border border-gray-150 dark:border-purple-900/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-purple-900/10 pb-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('targets')}
                  className={`text-[14px] font-black pb-2 transition-all relative cursor-pointer ${
                    activeTab === 'targets' ? 'text-purple-650 dark:text-purple-400 font-extrabold' : 'text-gray-400 hover:text-gray-650'
                  }`}
                >
                  المهام اليومية (Targets)
                  {activeTab === 'targets' && (
                    <motion.div layoutId="missionTag" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('badges')}
                  className={`text-[14px] font-black pb-2 transition-all relative cursor-pointer ${
                    activeTab === 'badges' ? 'text-purple-650 dark:text-purple-400 font-extrabold' : 'text-gray-400 hover:text-gray-655'
                  }`}
                >
                  أوسمة التحدي والتميز
                  {activeTab === 'badges' && (
                    <motion.div layoutId="missionTag" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                  )}
                </button>
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-black cursor-pointer hover:underline">مراجعة المهام</span>
            </div>

            {activeTab === 'targets' ? (
              <div className="space-y-4">
                {missions.map((mission) => {
                  const percent = Math.min(Math.round((mission.current / mission.target) * 100), 100);
                  const isCompleted = mission.current >= mission.target;

                  return (
                    <div key={mission.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#1a1548]/40 border border-transparent dark:border-purple-900/10 rounded-2xl hover:bg-gray-100/50 dark:hover:bg-[#1a1548]/65 transition-all">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <span className="text-2xl w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 flex items-center justify-center flex-shrink-0 shadow-sm">{mission.icon}</span>
                        <div className="flex-1 space-y-1 text-right min-w-0">
                          <h4 className="text-xs font-black text-gray-850 dark:text-gray-150 leading-tight">{mission.title}</h4>
                          <p className="text-[10px] text-gray-400 dark:text-purple-300/50 font-bold truncate">{mission.desc}</p>
                          
                          {/* Progress Line */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 bg-gray-200 dark:bg-[#151139] h-2 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  mission.type === 'diamonds' ? 'from-blue-400 to-indigo-500' :
                                  mission.type === 'xp' ? 'from-yellow-400 to-amber-500' :
                                  mission.type === 'lessons' ? 'from-emerald-400 to-teal-500' : 'from-rose-400 to-orange-505'
                                }`}
                              />
                            </div>
                            <span className="font-mono text-[9px] text-gray-500 dark:text-gray-400 font-extrabold whitespace-nowrap">{mission.current}/{mission.target}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mr-4 flex-shrink-0">
                        {mission.claimed ? (
                          <span className="text-[10px] text-gray-400 dark:text-gray-450 font-black bg-gray-100 dark:bg-[#151239] px-2.5 py-1.5 rounded-xl">تم استلامه</span>
                        ) : isCompleted ? (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleClaimReward(mission.id, mission.xp)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer animate-pulse"
                          >
                            استلام {mission.xp} XP
                          </motion.button>
                        ) : (
                          <span className="text-[10px] text-purple-650 dark:text-purple-400 font-extrabold bg-purple-50 dark:bg-purple-900/10 px-2.5 py-1.5 rounded-xl">{percent}% كمل</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Badges Tab list
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'ملك الاختبارات (Quiz King)', date: 'البكالوريا ٢٠٢٧', score: '2000 XP', badge: '👑', color: 'from-yellow-400 to-amber-500' },
                  { title: 'الذكي المرشد (AI Smart)', date: 'البكالوريا ٢٠٢٧', score: '1500 XP', badge: '🧭', color: 'from-orange-400 to-red-500' },
                  { title: 'قاهر الصعاب (Diamond Winner)', date: 'البكالوريا ٢٠٢٧', score: '2500 XP', badge: '💎', color: 'from-blue-400 to-indigo-500' },
                  { title: 'طليعة الامتياز (A+ Master)', date: 'البكالوريا ٢٠٢٧', score: '1700 XP', badge: '📚', color: 'from-emerald-400 to-teal-500' }
                ].map((badge, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#1a1548]/30 rounded-2xl p-4 text-center border border-transparent dark:border-purple-900/10 flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${badge.color} flex items-center justify-center text-2xl shadow-md border-2 border-white dark:border-gray-901 mb-3`}>
                      {badge.badge}
                    </div>
                    <h5 className="text-[11px] font-black text-gray-850 dark:text-gray-150 leading-tight">{badge.title}</h5>
                    <span className="text-[9px] text-gray-400 mt-1 font-bold">{badge.date}</span>
                    <span className="text-[10.5px] font-extrabold text-purple-600 dark:text-purple-400 mt-2">{badge.score}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3D Podium Honor Roll section on mobile */}
          <section className="bg-white dark:bg-[#120F30] rounded-3xl p-5 border border-gray-150 dark:border-purple-900/20 shadow-sm lg:hidden">
            <div className="flex items-center justify-between mb-4 text-right">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-[15px]">
                <Trophy size={16} className="text-yellow-500" />
                أبطال الأسبوع في المنصة
              </h3>
              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
                <button 
                  onClick={() => setLeaderboardTab('weekly')}
                  className={`text-[10px] font-black px-2 py-1 rounded-md ${leaderboardTab === 'weekly' ? 'bg-white dark:bg-[#1c184c] text-purple-600 shadow-sm' : 'text-gray-405'}`}
                >
                  أسبوعي
                </button>
                <button 
                  onClick={() => setLeaderboardTab('alltime')}
                  className={`text-[10px] font-black px-2 py-1 rounded-md ${leaderboardTab === 'alltime' ? 'bg-white dark:bg-[#1c184c] text-purple-600 shadow-sm' : 'text-gray-405'}`}
                >
                  الكل
                </button>
              </div>
            </div>

            {/* Render top 3 winners with beautiful 3D Columns */}
            <div className="flex items-end justify-center gap-3 pt-6 pb-2 min-h-[160px] border-b border-gray-50 dark:border-purple-900/10">
              
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1 max-w-[90px]">
                <div className="relative group cursor-pointer" onClick={() => setPreviewUserId(secondPlace.id)}>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-[2.5px] border-slate-350 shadow bg-gray-100">
                    <img src={secondPlace.avatar_url} alt={secondPlace.full_name} className="w-full h-full object-cover animate-pulse" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-4.5 h-4.5 bg-slate-400 text-white rounded-full flex items-center justify-center font-black text-[9px] shadow border border-white">
                    2
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 mt-2 truncate max-w-[65px]">{secondPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-slate-500">{secondPlace.points || 0} XP</span>
                <div className="w-full bg-slate-100 dark:bg-[#181440]/55 h-12 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-slate-200 dark:border-purple-900/20">
                  <span className="font-extrabold text-[12px] text-slate-500">٢</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1 max-w-[100px] -translate-y-1">
                <div className="relative group cursor-pointer -mt-4 mb-0.5" onClick={() => setPreviewUserId(firstPlace.id)}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-450 animate-bounce text-sm">👑</span>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-[2.5px] border-yellow-400 shadow bg-gray-100 shadow-yellow-400/20">
                    <img src={firstPlace.avatar_url} alt={firstPlace.full_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow border border-white">
                    1
                  </span>
                </div>
                <span className="text-[10.5px] font-black text-gray-901 dark:text-yellow-400 truncate max-w-[75px]">{firstPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400">{firstPlace.points || 0} XP</span>
                <div className="w-full bg-yellow-100/75 dark:bg-yellow-500/10 h-16 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-yellow-300 dark:border-yellow-500/20 shadow">
                  <span className="font-black text-sm text-yellow-700">١</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1 max-w-[90px]">
                <div className="relative group cursor-pointer" onClick={() => setPreviewUserId(thirdPlace.id)}>
                  <div className="w-11 h-11 rounded-full overflow-hidden border-[2.5px] border-amber-605 shadow bg-gray-105">
                    <img src={thirdPlace.avatar_url} alt={thirdPlace.full_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-4.5 h-4.5 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-[9px] shadow border border-white">
                    3
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 mt-2 truncate max-w-[65px]">{thirdPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-amber-653">{thirdPlace.points || 0} XP</span>
                <div className="w-full bg-[#faedd9]/50 dark:bg-amber-950/10 h-10 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-amber-500/20 dark:border-purple-900/10">
                  <span className="font-extrabold text-[12px] text-amber-700">٣</span>
                </div>
              </div>

            </div>

            {/* Mobile leader list scrollable */}
            <div className="max-h-60 overflow-y-auto scrollbar-none space-y-3 pt-3">
              {remainingLeaderboard.map((user, idx) => {
                return (
                  <div 
                    key={user.id} 
                    onClick={() => setPreviewUserId(user.id)}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-purple-905/30 rounded-xl cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-gray-400 w-5 text-center">{idx + 4}</span>
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover animate-fade-in" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-105 text-indigo-650 font-bold text-xs">
                            {user.full_name?.charAt(0) || 'أ'}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{user.full_name}</span>
                    </div>
                    <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">{user.points || 0} XP</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Filter Button tabs */}
          <section className="mt-6 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <FilterButton 
                active={activeFilter === 'all'} 
                onClick={() => setActiveFilter('all')}
                icon={TrendingUp}
                label="الكل/فيديوهات..."
              />
              <FilterButton 
                active={activeFilter === 'post'} 
                onClick={() => setActiveFilter('post')}
                icon={FileText}
                label="المنشورات"
              />
              <FilterButton 
                active={activeFilter === 'video'} 
                onClick={() => setActiveFilter('video')}
                icon={Video}
                label="الفروق"
              />
            </div>
          </section>

          {/* Custom HIGHLIGHT / VIDEOS list */}
          {activeFilter === 'all' && (
            <section className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                {fallbackVideos.map((video) => (
                  <div 
                    key={video.id} 
                    onClick={() => navigate('/youtube')}
                    className="bg-white dark:bg-[#120F30] rounded-2xl overflow-hidden shadow-sm border border-gray-150 dark:border-purple-900/10 group cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        {video.duration}
                      </span>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow flex items-center justify-center text-blue-600 scale-90 group-hover:scale-100 transition-transform">
                          <Play size={14} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {video.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-450">{video.author}</span>
                        <span>{video.views} مشاهدة</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Filtered Posts Feed */}
          {activeFilter === 'post' && (
            <section className="space-y-4 mb-6">
              <AnimatePresence mode="popLayout">
                {filteredFeed.length > 0 ? (
                  filteredFeed.map((item) => (
                    <FeedCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => console.log('Open', item.id)}
                      onDelete={item.authorId === currentUserId || isAdmin ? handleDeletePost : undefined}
                      onEdit={item.authorId === currentUserId || isAdmin ? handleEditPost : undefined}
                    />
                  ))
                ) : (
                  <div className="text-center bg-white dark:bg-[#120F30] py-12 rounded-2xl border border-gray-150 dark:border-purple-900/10 text-gray-400 text-sm">
                    لا توجد منشورات مساهمة مسجلة حالياً
                  </div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>

        {/* Sidebar/Left Column (Takes 4 of 12 columns, hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">

          {/* Premium VIP Side Card */}
          <div className="bg-gradient-to-br from-indigo-700 via-purple-705 to-indigo-850 rounded-[32px] p-6 text-white shadow-xl shadow-purple-650/10 space-y-4 relative overflow-hidden">
            <span className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-spin">👑</span>
              <div>
                <h4 className="font-black text-yellow-350 text-base">ترقية العضوية الذهبية (Premium)</h4>
                <p className="text-[10px] text-purple-200 font-extrabold">مكافآت وامتيازات غير محدودة للبكالوريا</p>
              </div>
            </div>
            <p className="text-xs text-indigo-50 leading-relaxed font-semibold">تمنحك العضوية كنز غير محدود من الجواهر، مسابقة كبرى للمتصدرين، حلول امتحانات فورية بالذكاء الاصطناعي، ومشاركات خاصة.</p>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSubStep(1);
                setIsSubModalOpen(true);
              }}
              className="w-full bg-white text-indigo-900 py-3 rounded-2xl text-xs font-black shadow-lg shadow-black/10 text-center cursor-pointer"
            >
              الترقية للولوج الماسي الآن
            </motion.button>
          </div>

          {/* Stats card */}
          <div className="bg-white dark:bg-[#120F30] rounded-[32px] p-6 shadow-sm border border-gray-150 dark:border-[#211b59]/30 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-blue-50 dark:bg-purple-950/40 text-blue-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-[#1E293B] dark:text-gray-150 text-base">مستوى التقدم الدراسي</h3>
                <p className="text-xs text-gray-400 font-bold">المستوى الحالي: {stats.level}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F8FAFC] dark:bg-[#18143C]/40 p-4 rounded-2xl text-center border border-gray-100 dark:border-purple-900/10 shadow-sm">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.points}</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 font-black mt-1">النقاط بالكامل (XP)</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-[#18143C]/40 p-4 rounded-2xl text-center border border-gray-100 dark:border-purple-900/10 shadow-sm">
                <span className="text-2xl font-black text-emerald-500">{stats.successRate}%</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 font-black mt-1">نسبة النجاح بالاختبار</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-[#18143C]/40 p-4 rounded-2xl text-center border border-gray-100 dark:border-purple-900/10 shadow-sm">
                <span className="text-2xl font-black text-indigo-500">{stats.summaries}</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 font-black mt-1">ملخصاتك الدراسية</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-[#18143C]/40 p-4 rounded-2xl text-center border border-gray-100 dark:border-purple-900/10 shadow-sm">
                <span className="text-2xl font-black text-rose-500">{stats.videos * 2 + 10}</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 font-black mt-1">ساعات المراجعة</p>
              </div>
            </div>
          </div>

          {/* Vertical Leaderboard with 3D Podium preview at the top of the list! */}
          <div className="bg-white dark:bg-[#120F30] rounded-[32px] p-6 shadow-sm border border-gray-155 dark:border-[#211b59]/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-801">
              <h3 className="font-extrabold text-gray-905 dark:text-white flex items-center gap-2 text-base">
                <Trophy size={18} className="text-yellow-500 animate-bounce" />
                المتصدرون في لوحة الشرف للأسبوع
              </h3>
            </div>

            {/* Complete 3D Podium Columns for Sidebar (Exquisite quality desktop visual!) */}
            <div className="flex items-end justify-center gap-3 pt-6 pb-2 min-h-[160px] border-b border-gray-50 dark:border-purple-900/10">
              {/* 2nd place */}
              <div className="flex flex-col items-center flex-1 max-w-[80px]">
                <div className="relative group cursor-pointer" onClick={() => setPreviewUserId(secondPlace.id)}>
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-slate-350 shadow bg-gray-105">
                    <img src={secondPlace.avatar_url} alt={secondPlace.full_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-4.5 h-4.5 bg-slate-400 text-white rounded-full flex items-center justify-center font-black text-[9px] shadow border border-white">2</span>
                </div>
                <span className="text-[10px] font-bold text-gray-750 dark:text-gray-250 mt-1.5 truncate max-w-[65px]">{secondPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-slate-500">{secondPlace.points} XP</span>
                <div className="w-full bg-[#E2E8F0] dark:bg-[#18143C]/20 h-10 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-slate-300 dark:border-purple-900/10">
                  <span className="font-extrabold text-xs text-slate-655">٢</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="flex flex-col items-center flex-1 max-w-[90px] -translate-y-1">
                <div className="relative group cursor-pointer -mt-4 mb-0.5" onClick={() => setPreviewUserId(firstPlace.id)}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-450 animate-bounce text-sm">👑</span>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-yellow-400 shadow bg-gray-105 shadow-yellow-400/15">
                    <img src={firstPlace.avatar_url} alt={firstPlace.full_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-5 h-5 bg-yellow-400 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow border border-white">1</span>
                </div>
                <span className="text-[11px] font-black text-gray-900 dark:text-yellow-400 truncate max-w-[75px]">{firstPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400">{firstPlace.points} XP</span>
                <div className="w-full bg-yellow-101/50 dark:bg-yellow-500/10 h-14 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-yellow-300 dark:border-yellow-500/10 shadow">
                  <span className="font-black text-xs text-yellow-750">١</span>
                </div>
              </div>

              {/* 3rd place */}
              <div className="flex flex-col items-center flex-1 max-w-[80px]">
                <div className="relative group cursor-pointer" onClick={() => setPreviewUserId(thirdPlace.id)}>
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-600 shadow bg-gray-105">
                    <img src={thirdPlace.avatar_url} alt={thirdPlace.full_name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -left-1 w-4.5 h-4.5 bg-amber-600 text-white rounded-full flex items-center justify-center font-black text-[9px] shadow border border-white">3</span>
                </div>
                <span className="text-[10px] font-bold text-gray-750 dark:text-gray-255 mt-1.5 truncate max-w-[65px]">{thirdPlace.full_name?.split(' ')[0]}</span>
                <span className="text-[8px] font-black text-amber-500">{thirdPlace.points} XP</span>
                <div className="w-full bg-[#faedd9]/50 dark:bg-[#18143C]/20 h-8 rounded-t-xl mt-2 flex items-center justify-center border-t border-x border-amber-300 dark:border-purple-900/10">
                  <span className="font-extrabold text-xs text-amber-700">٣</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-none pt-2">
              {remainingLeaderboard.map((user, idx) => {
                const rankBadgeColor = 'bg-blue-50 dark:bg-gray-800 text-blue-650 dark:text-blue-400';
                return (
                  <div 
                    key={user.id}
                    onClick={() => setPreviewUserId(user.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-purple-950/20 cursor-pointer transition-all border border-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${rankBadgeColor} flex-shrink-0`}>
                        {idx + 4}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-sm">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                        {user.full_name || 'مستخدم جديد'}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {user.points || 0} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action button to post community story */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditingPost(null);
          setIsCreateModalOpen(true);
        }}
        className="fixed bottom-24 right-5 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:bg-blue-700 hover:shadow-xl transition-all lg:hidden cursor-pointer"
      >
        <Plus size={24} />
      </motion.button>

      {/* For desktop, we can display a clean, elegant bottom-right floating action button or sidebar option */}
      <div className="hidden lg:block fixed bottom-8 left-8 z-[60]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingPost(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-xl shadow-blue-500/20 font-bold transition-all cursor-pointer"
        >
          <Plus size={20} />
          <span>أنشئ منشورًا جديدًا</span>
        </motion.button>
      </div>

      {/* --- PREMIUM VIP CHECKOUT DIALOG / MODAL  --- */}
      <AnimatePresence>
        {isSubModalOpen && (
          <>
            {/* Modal Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="fixed bottom-0 md:top-1/2 left-1/2 md:-translate-y-1/2 -translate-x-1/2 w-full md:max-w-md bg-white dark:bg-[#120F30] rounded-t-[36px] md:rounded-[36px] p-6 z-[105] shadow-2xl border-t md:border border-transparent dark:border-purple-900/30 overflow-hidden"
              dir="rtl"
            >
              {/* Header screen indicator */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-purple-900/10">
                <span className="text-[13px] font-black text-purple-630 dark:text-purple-400">الترقية للعضوية الماسية</span>
                <button 
                  onClick={() => setIsSubModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-805 text-gray-500 flex items-center justify-center font-black cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Step 1: Premium Benefits list */}
              {subStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <span className="text-5xl animate-bounce block">💎</span>
                    <h3 className="text-xl font-black text-gray-901 dark:text-white">انضم إلى باقتنا الماسية وافرح بالامتيازات!</h3>
                    <p className="text-xs text-gray-500 dark:text-purple-300">كن متقدماً ومتميزاً وبسرعة قياسية</p>
                  </div>

                  <div className="space-y-3 bg-indigo-50/50 dark:bg-[#171448]/50 p-4 rounded-3xl border border-indigo-101/30">
                    {[
                      { icon: '💎', title: 'جواهر لا تنتهى للحفظ والمراجعة', desc: 'استمتع بمخرون لا ينفد لمساعدتك بالدراسة' },
                      { icon: '🚫', title: 'خالٍ من الإعلانات تمامًا', desc: 'تعلم بصفاء فكري تام ودون أي تشتيت للأذهان' },
                      { icon: '⏰', title: 'التذكير بالحصص والدورات', desc: 'خط مخصص للتذكير اليومي السريع والمبكر' },
                      { icon: '📅', title: 'جدول دراسة تفاعلي مرن', desc: 'تقويم فخم مدمج مع خطة المذاكرة الأسبوعية' },
                      { icon: '📊', title: 'تقارير الأداء الفوري بالذكاء الاصطناعي', desc: 'تحليل دقيق ومخصص مع الأستاذ الافتراضي' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{item.icon}</span>
                        <div className="text-right">
                          <h4 className="text-[12px] font-black text-gray-800 dark:text-gray-150 leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-gray-450 dark:text-purple-300/40 font-bold leading-tight">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSubStep(2)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-650/20 text-center text-xs cursor-pointer"
                  >
                    الذهاب لتحديد الخطة
                  </button>
                  <button 
                    onClick={() => setIsSubModalOpen(false)}
                    className="w-full text-gray-500 text-[11px] font-black text-center block mt-1 hover:underline cursor-pointer"
                  >
                    لا شكراً، يرجى الاستمرار مجاناً
                  </button>
                </div>
              )}

              {/* Step 2: Choose Subscription Plan selection */}
              {subStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-md font-black text-gray-900 dark:text-white">حدد الخطة الماسية المناسبة لك</h3>
                    <p className="text-[10px] text-gray-400 mt-1">وفر حتى ٤٠٪ اليوم مع الخصومات الإضافية</p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {[
                      { months: 1, price: '10.00 $', saving: 'خصم ١٠٪ شهرياً', value: 1 },
                      { months: 3, price: '26.00 $', saving: 'خصم ٢٠٪ - الأكثر شعبياً', value: 3 },
                      { months: 6, price: '46.00 $', saving: 'وفر حتى ٣٠٪ ممتازة', value: 6 },
                      { months: 12, price: '86.00 $', saving: 'وفر حتى ٤٠٪ الاقتصادية', value: 12 }
                    ].map((item) => (
                      <div 
                        key={item.value}
                        onClick={() => setSelectedPlan(item.value)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedPlan === item.value 
                            ? 'bg-purple-50/50 dark:bg-[#1d165c]/70 border-purple-600 text-purple-900 dark:text-white' 
                            : 'bg-transparent border-gray-150 dark:border-purple-900/10 hover:border-gray-300 dark:hover:border-purple-200/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="plan" 
                            checked={selectedPlan === item.value}
                            onChange={() => setSelectedPlan(item.value)}
                            className="text-purple-600 focus:ring-purple-500 h-4 w-4" 
                          />
                          <div className="text-right">
                            <span className="font-extrabold text-[12.5px] block">{item.months} {item.months === 1 ? 'شهر' : item.months === 3 ? 'أشهر' : 'أشهر دراسية'}</span>
                            <span className="text-[9.5px] text-purple-600 dark:text-purple-400 font-extrabold">{item.saving}</span>
                          </div>
                        </div>
                        <span className="font-black text-sm text-purple-650 dark:text-purple-450">{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      onClick={() => setSubStep(1)}
                      className="py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      عودة
                    </button>
                    <button 
                      onClick={() => setSubStep(3)}
                      className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black shadow shadow-indigo-650/15 text-xs"
                    >
                      الاستمرار لتحديد الدفع
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Select Payment Method & Detailed Form */}
              {subStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-md font-black text-gray-900 dark:text-white">خطوة الدفع الآمن</h3>
                    <p className="text-[10px] text-gray-400 mt-1">تشفير كامل وحماية لعمليات الشراء بالبكالوريا</p>
                  </div>

                  {/* Payment Method Selector Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'baridimob', name: 'بريدي موب / CCP', logo: '📬' },
                      { id: 'card', name: 'الذهبية / الفيزا', logo: '💳' },
                      { id: 'paypal', name: 'بايبال PayPal', logo: '🌐' },
                      { id: 'coupon', name: 'تفعيل بالكوبون', logo: '🎁' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPayMethod(method.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedPayMethod === method.id
                            ? 'bg-purple-50/50 dark:bg-[#1d165c]/70 border-purple-600 text-purple-900 dark:text-white'
                            : 'bg-transparent border-gray-150 dark:border-purple-900/10 hover:border-gray-250 dark:hover:border-purple-200/30'
                        }`}
                      >
                        <span className="text-2xl mb-1">{method.logo}</span>
                        <span className="text-[11px] font-black">{method.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Form Area Based on Selected Method */}
                  <div className="bg-gray-50/70 dark:bg-[#171448]/30 p-4 rounded-3xl border border-gray-100 dark:border-purple-900/10 space-y-3">
                    {/* Method 1: BaridiMob / CCP */}
                    {selectedPayMethod === 'baridimob' && (
                      <div className="space-y-3" dir="rtl">
                        <div className="bg-indigo-50/40 dark:bg-purple-950/40 p-3 rounded-2xl border border-indigo-100/30 text-right space-y-1.5">
                          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block mb-1">المعلومات البريدية للدفع:</span>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400">الحساب الجاري CCP:</span>
                            <span className="font-mono font-black text-gray-800 dark:text-white flex items-center gap-1">
                              0021998522 <span className="text-[10px] text-purple-500">مفتاح 44</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('0021998522');
                                  setCopiedText('ccp');
                                  setTimeout(() => setCopiedText(null), 2000);
                                }}
                                className="text-[9px] text-blue-500 hover:underline mr-1 cursor-pointer"
                              >
                                {copiedText === 'ccp' ? '✓ تم' : 'نسخ'}
                              </button>
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400">رقم RIP بريدي موب:</span>
                            <span className="font-mono font-black text-gray-800 dark:text-white flex items-center gap-1 text-[11px]">
                              00799999002199852244
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText('00799999002199852244');
                                  setCopiedText('rip');
                                  setTimeout(() => setCopiedText(null), 2000);
                                }}
                                className="text-[9px] text-blue-500 hover:underline mr-1 cursor-pointer"
                              >
                                {copiedText === 'rip' ? '✓ تم' : 'نسخ'}
                              </button>
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400">اسم صاحب الحساب:</span>
                            <span className="font-black text-gray-800 dark:text-white">ب. ناصر</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-right">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">اسم مرسل الحوالة الكامل:</label>
                          <input
                            type="text"
                            value={ccpSenderName}
                            onChange={(e) => setCcpSenderName(e.target.value)}
                            placeholder="مثال: محمد بلقاسم"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-right text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>

                        <div className="space-y-2 text-right">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">رقم معاملة التحويل (10 أرقام فما فوق):</label>
                          <input
                            type="text"
                            value={ccpTransactionRef}
                            onChange={(e) => setCcpTransactionRef(e.target.value.replace(/\D/g, ''))}
                            placeholder="رقم المعاملة أو رقم العملية من الوصل"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none text-right text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>

                        {/* Drag and Drop File Receipt Preview */}
                        <div className="space-y-1 text-right">
                          <span className="text-[11px] font-black text-gray-600 dark:text-gray-300">لقطة شاشة أو صورة الوصل (اختياري):</span>
                          <div className="relative border-2 border-dashed border-gray-200 dark:border-purple-900/20 rounded-2xl p-4 flex flex-col items-center justify-center bg-white dark:bg-[#120F30] cursor-pointer hover:bg-gray-100/50 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setCcpReceiptPreview(event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {ccpReceiptPreview ? (
                              <div className="relative w-full flex flex-col items-center">
                                <img src={ccpReceiptPreview} alt="Receipt preview" className="h-20 object-contain rounded" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCcpReceiptPreview(null);
                                  }}
                                  className="mt-2 text-[9px] text-red-500 font-bold hover:underline cursor-pointer"
                                >
                                  إزالة الصورة
                                </button>
                              </div>
                            ) : (
                              <div className="text-center space-y-1">
                                <span className="text-2xl">📸</span>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">انقر أو اسحب صورة الوصل هنا</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Method 2: Credit Card / Edahabia */}
                    {selectedPayMethod === 'card' && (
                      <div className="space-y-4 text-right">
                        {/* Interactive Credit Card Widget */}
                        <div className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-800 to-indigo-950 p-4 text-white overflow-hidden shadow-xl border border-white/10 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                              <div className="w-8 h-5 rounded bg-yellow-400/80 flex items-center justify-center font-mono text-[9px] text-indigo-950 font-black">CHIP</div>
                              {cardNumber.startsWith('6281') && (
                                <div className="px-1.5 py-0.5 rounded bg-amber-500 text-[8px] font-black tracking-wider text-white shadow animate-pulse">الذهبية</div>
                              )}
                            </div>
                            <span className="text-xs font-black italic tracking-widest text-purple-200">معدلي DZ</span>
                          </div>
                          <div className="font-mono text-md tracking-[0.15em] font-medium text-center text-gray-100">
                            {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim().slice(0, 19) : '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between items-end" dir="rtl">
                            <div className="max-w-[150px]">
                              <div className="text-[7px] text-gray-400 uppercase tracking-wider">حامل البطاقة</div>
                              <div className="font-mono text-[10px] tracking-wider truncate uppercase">{cardHolder || 'Cardholder Name'}</div>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <div className="text-[7px] text-gray-400 uppercase tracking-wider">نهاية الصلاحية</div>
                                <div className="font-mono text-[10px] tracking-wider">{cardExpiry || 'MM/YY'}</div>
                              </div>
                              <div>
                                <div className="text-[7px] text-gray-400 uppercase tracking-wider">CVC</div>
                                <div className="font-mono text-[10px] tracking-wider">{cardCvv || '•••'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">رقم البطاقة (16 رقم):</label>
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                              let formatted = '';
                              for (let i = 0; i < v.length; i++) {
                                if (i > 0 && i % 4 === 0) formatted += ' ';
                                formatted += v[i];
                              }
                              setCardNumber(formatted);
                            }}
                            placeholder="6281 •••• •••• ••••"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none text-right text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">اسم صاحب البطاقة الكامل:</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="مثال: BEN NACER NACER"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-bold outline-none text-right text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">تاريخ الانتهاء:</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length > 2) {
                                  v = v.slice(0, 2) + '/' + v.slice(2, 4);
                                }
                                setCardExpiry(v);
                              }}
                              placeholder="MM/YY"
                              className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none text-center text-gray-800 dark:text-white focus:border-purple-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">رمز الأمان CVC:</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              placeholder="•••"
                              className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none text-center text-gray-800 dark:text-white focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Method 3: PayPal */}
                    {selectedPayMethod === 'paypal' && (
                      <div className="space-y-3 text-right">
                        <div className="text-center p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100/30">
                          <span className="text-xs font-black text-blue-700 dark:text-blue-400">بوابة دفع PayPal الآمنة والموثوقة</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">البريد الإلكتروني لحساب PayPal:</label>
                          <input
                            type="email"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            placeholder="your-email@paypal.com"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-bold outline-none text-left text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-600 dark:text-gray-300">كلمة المرور:</label>
                          <input
                            type="password"
                            value={paypalPassword}
                            onChange={(e) => setPaypalPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white dark:bg-[#120F30] border border-gray-200 dark:border-purple-900/20 rounded-xl px-3 py-2 text-xs font-bold outline-none text-left text-gray-800 dark:text-white focus:border-purple-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Method 4: Coupon Only */}
                    {selectedPayMethod === 'coupon' && (
                      <div className="space-y-2 text-right">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mb-2 leading-relaxed">
                          إذا كنت تمتلك كود تفعيل هدية أو كوبون ترويجي مميز، يمكنك تفعيل اشتراكك الماسي مجاناً وبنقرة زر واحدة.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Coupon card option input */}
                  <div className="space-y-1">
                    <div className="bg-gray-50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-transparent dark:border-purple-900/15 flex items-center justify-between">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="أدخل كود الكوبون الإضافي للتخفيض"
                        className="bg-transparent border-none text-[10px] font-bold outline-none flex-1 text-right text-gray-800 dark:text-purple-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(couponCode)}
                        className="text-[10px] font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        تطبيق
                      </button>
                    </div>
                    {couponError && <p className="text-[9px] text-red-500 font-bold text-right">{couponError}</p>}
                    {isCouponApplied && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold text-right">
                        تم تفعيل الكوبون! خصم {couponDiscount}% بنجاح 🎉
                      </p>
                    )}
                  </div>

                  {/* Pricing Summary Widget */}
                  <div className="p-3 bg-purple-50/30 dark:bg-[#1d165c]/20 rounded-2xl border border-purple-500/10 space-y-1.5" dir="rtl">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">الاشتراك الأساسي:</span>
                      <span className="font-extrabold text-gray-850 dark:text-gray-300 font-mono">
                        {getPlanPrice().original.toFixed(2)} $
                      </span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <span>قيمة الخصم بالكوبون:</span>
                        <span className="font-extrabold font-mono">
                          -{getPlanPrice().discount.toFixed(2)} $ ({couponDiscount}%)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black border-t border-gray-100 dark:border-purple-900/10 pt-1.5 text-purple-950 dark:text-white">
                      <span>السعر النهائي للاستراك:</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 text-lg">
                        {getPlanPrice().final.toFixed(2)} $
                      </span>
                    </div>
                  </div>

                  {/* Submit / Navigation Buttons */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSubStep(2)}
                      className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      عودة
                    </button>
                    <button
                      type="button"
                      onClick={handleStartPayment}
                      disabled={isPaying}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black shadow shadow-indigo-650/15 text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isPaying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          <span>جاري تفعيل الاشتراك الماسي الآمن...</span>
                        </>
                      ) : (
                        <span>تأكيد وتفعيل العضوية الماسية</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Success state with Mascot */}
              {subStep === 4 && (
                <div className="space-y-6 text-center">
                  <div className="py-4 space-y-4">
                    {/* Animated raindrop/gem mascot smiley face */}
                    <div className="relative w-32 h-32 mx-auto bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <div className="text-6xl animate-bounce">💎👑</div>
                      {/* Interactive bubbles */}
                      <span className="absolute top-2 right-2 text-md animate-ping">⚡</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-gray-901 dark:text-white">أهلاً بك في العضوية الماسية! 🎉</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold animate-pulse">تمت ترقية حسابك بنجاح في تطبيق معدلي DZ</p>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-purple-300 px-4 leading-relaxed font-semibold">
                      مبروك يا بطل! لقد تم تفعيل العضوية الماسية لـ {selectedPlan === 12 ? 'سنة دراسية كاملة' : `${selectedPlan} أشهر`} بنجاح. استعد للتمتع بجميع المزايا والأستاذ الافتراضي دون قيود!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubModalOpen(false);
                      setSubStep(1);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg text-xs cursor-pointer"
                  >
                    شكراً لك، هلموا بنا للتعلم!
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create/Edit Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setTimeout(() => setEditingPost(null), 300);
        }} 
        onPostCreated={handleCreatePost}
        editPost={editingPost}
      />
      
      <ProfilePreview 
        userId={previewUserId || ''} 
        isOpen={!!previewUserId} 
        onClose={() => setPreviewUserId(null)} 
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPostToDelete(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-[#120F30] rounded-3xl p-6 z-[80] shadow-2xl border border-transparent dark:border-purple-900/10"
            >
              <div className="flex flex-col items-center text-center space-y-4" dir="rtl">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">حذف المنشور</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium pb-4">
                  هل أنت متأكد أنك تريد حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء الإرشادي.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-650 transition-colors cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
        active 
          ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/10' 
          : 'bg-white dark:bg-gray-950 text-gray-650 dark:text-gray-400 border-gray-200 dark:border-gray-900 hover:border-blue-200 dark:hover:border-blue-504/50'
      }`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
