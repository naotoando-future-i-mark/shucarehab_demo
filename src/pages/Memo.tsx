export default function Memo() {
  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">就活メモ</h1>
          <p className="text-xs text-gray-500 mt-1">MVPでは後で追加でOK！</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
          <div className="text-gray-900 font-semibold">まだメモはないよ</div>
          <div className="text-sm text-gray-500 mt-2">
            次は「＋」から追加できるようにしよ〜
          </div>
        </div>
      </div>
    </div>
  );
}
