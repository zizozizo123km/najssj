import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Ban, ShieldAlert, CheckCircle2 } from 'lucide-react';
import ModalConfirm from './ModalConfirm';

export default function StudentTable() {
  const [students, setStudents] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'reject' | 'disable' | 'enable' | null;
    studentId: string | null;
  }>({ isOpen: false, action: null, studentId: null });

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin');
      
      if (data) {
        setStudents(data.map(s => ({
          id: s.id,
          ...s,
          displayName: s.display_name,
          accountStatus: s.account_status,
          lastLogin: s.updated_at // Using updated_at as proxy for last activity
        })));
      }
    };

    fetchStudents();

    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles'
      }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const requestAction = (id: string, action: 'delete' | 'reject' | 'disable' | 'enable') => {
    setConfirmModal({ isOpen: true, action, studentId: id });
  };

  const executeAction = async () => {
    const { action, studentId } = confirmModal;
    if (!action || !studentId) return;

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', studentId);
        if (error) throw error;
      } else {
        const status = action === 'reject' ? 'rejected' : action === 'disable' ? 'disabled' : 'active';
        const { error } = await supabase
          .from('profiles')
          .update({ account_status: status })
          .eq('id', studentId);
        if (error) throw error;
      }
      setConfirmModal({ isOpen: false, action: null, studentId: null });
    } catch (error) {
      console.error('Error performing action:', error);
      alert('حدث خطأ أثناء تنفيذ العملية');
    }
  };

  const getModalProps = () => {
    switch (confirmModal.action) {
      case 'delete':
        return { title: 'حذف الطالب', message: 'هل أنت متأكد من حذف هذا الطالب نهائياً؟', type: 'danger' as const };
      case 'reject':
        return { title: 'رفض التسجيل', message: 'هل أنت متأكد من رفض تسجيل هذا الطالب؟', type: 'warning' as const };
      case 'disable':
        return { title: 'تعطيل الحساب', message: 'هل أنت متأكد من تعطيل حساب هذا الطالب مؤقتاً؟', type: 'warning' as const };
      case 'enable':
        return { title: 'تفعيل الحساب', message: 'هل تريد تفعيل حساب هذا الطالب؟', type: 'info' as const };
      default:
        return { title: '', message: '', type: 'info' as const };
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-black text-white">إدارة الطلاب</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-900/50 text-gray-400 text-sm">
            <tr>
              <th className="p-4 font-bold">الاسم</th>
              <th className="p-4 font-bold">البريد الإلكتروني</th>
              <th className="p-4 font-bold">الشعبة</th>
              <th className="p-4 font-bold">آخر نشاط</th>
              <th className="p-4 font-bold">الحالة</th>
              <th className="p-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {students.map((student) => (
              <tr key={student.id} className="text-gray-300 hover:bg-gray-700/30 transition-colors">
                <td className="p-4 font-medium">{student.displayName || 'بدون اسم'}</td>
                <td className="p-4 text-sm" dir="ltr">{student.email}</td>
                <td className="p-4 text-sm">{student.branch || '-'}</td>
                <td className="p-4 text-sm text-gray-400">
                  {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString('ar-EG') : 'غير متوفر'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    student.accountStatus === 'disabled' ? 'bg-orange-500/10 text-orange-500' :
                    student.accountStatus === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    'bg-green-500/10 text-green-500'
                  }`}>
                    {student.accountStatus === 'disabled' ? 'معطل' :
                     student.accountStatus === 'rejected' ? 'مرفوض' : 'نشط'}
                  </span>
                </td>
                <td className="p-4 flex items-center justify-center gap-2">
                  {student.accountStatus === 'disabled' ? (
                    <button onClick={() => requestAction(student.id, 'enable')} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="تفعيل">
                      <CheckCircle2 size={18} />
                    </button>
                  ) : (
                    <button onClick={() => requestAction(student.id, 'disable')} className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors" title="تعطيل مؤقت">
                      <Ban size={18} />
                    </button>
                  )}
                  <button onClick={() => requestAction(student.id, 'reject')} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="رفض التسجيل">
                    <ShieldAlert size={18} />
                  </button>
                  <button onClick={() => requestAction(student.id, 'delete')} className="p-2 text-gray-400 hover:bg-gray-600 rounded-lg transition-colors" title="حذف نهائي">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">لا يوجد طلاب مسجلين حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalConfirm
        isOpen={confirmModal.isOpen}
        title={getModalProps().title}
        message={getModalProps().message}
        type={getModalProps().type}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ isOpen: false, action: null, studentId: null })}
      />
    </div>
  );
}
