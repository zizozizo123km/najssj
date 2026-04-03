export default function Dashboard() {
  return (
    <div className="p-6 space-y-8 font-sans">
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">مرحباً بك في Bac DZ AI</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-medium text-gray-500 mb-2">عدد التلاميذ</h2>
          <p className="text-4xl font-bold text-blue-600">1,234</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-medium text-gray-500 mb-2">عدد الدروس</h2>
          <p className="text-4xl font-bold text-green-600">567</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-medium text-gray-500 mb-2">عدد المنشورات</h2>
          <p className="text-4xl font-bold text-purple-600">890</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">آخر الأخبار</h2>
        <ul className="space-y-4">
          <li className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">تحديث جديد في منهاج مادة الرياضيات</li>
          <li className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">موعد التسجيلات الأولية للبكالوريا</li>
          <li className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">نصائح ذهبية للتحضير للفصل الثاني</li>
        </ul>
      </div>
    </div>
  );
}
