import { Heart, MessageCircle, Bookmark } from 'lucide-react';

const dummyPosts = [
  {
    id: 1,
    author: '就活太郎',
    timeAgo: '2時間前',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: '面接で聞かれた想定外の質問TOP5',
    description: '実際の面接で聞かれて困った質問をまとめました。事前準備が大切です！',
    likes: 234,
    comments: 18,
  },
  {
    id: 2,
    author: 'キャリア花子',
    timeAgo: '5時間前',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'IT業界の内定を3社から獲得した私の戦略',
    description: '業界研究から面接対策まで、実践したことを全て公開します。',
    likes: 512,
    comments: 45,
  },
  {
    id: 3,
    author: '内定ハンター',
    timeAgo: '1日前',
    image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'グループディスカッション攻略法',
    description: 'GDで評価されるポイントと、実際に使えるテクニックを解説。',
    likes: 387,
    comments: 29,
  },
  {
    id: 4,
    author: 'OB訪問マスター',
    timeAgo: '2日前',
    image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'OB訪問で絶対に聞くべき質問リスト',
    description: '表面的な情報ではなく、本当に知りたい情報を引き出す質問術。',
    likes: 421,
    comments: 34,
  },
];

export default function Magazine() {
  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">就活マガジン</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {dummyPosts.map((post) => (
          <div key={post.id} className="bg-white mb-4 border-b border-gray-200">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.author[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
                <p className="text-xs text-gray-500">{post.timeAgo}</p>
              </div>
            </div>

            <div className="relative bg-gray-100 aspect-square">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center gap-4 mb-3">
                <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                  <Heart size={24} />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <MessageCircle size={24} />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>
                <button className="ml-auto hover:text-blue-500 transition-colors">
                  <Bookmark size={24} />
                </button>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
              <p className="text-sm text-gray-600">{post.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
