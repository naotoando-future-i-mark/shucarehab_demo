import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
      <p className="text-gray-600 mt-2">ここにダッシュボードの内容が入ります</p>
    </AdminLayout>
  );
}
