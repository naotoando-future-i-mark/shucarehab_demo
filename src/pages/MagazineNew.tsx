import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, ExternalLink } from 'lucide-react';

// 企業タグの型定義
type CompanyTag = {
  id: string;
  name: string;
  url: string;
  x: number; // 左からの位置（%）
  y: number; // 上からの位置（%）
};

type Post = {
  id: number;
  author: string;
  timeAgo: string;
  images: {
    url: string;
    tags?: CompanyTag[];
  }[];
  title: string;
  description: string;
  likes: number;
  comments: number;
};

const dummyPosts: Post[] = [
  {
    id: 1,
    author: '就活太郎',
    timeAgo: '2時間前',
    images: [
      {
        url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: [],
      },
    ],
    title: '面接で聞かれた想定外の質問TOP5',
    description: '実際の面接で聞かれて困った質問をまとめました。事前準備が大切です！',
    likes: 234,
    comments: 18,
  },
  {
    id: 2,
    author: 'キャリア花子',
    timeAgo: '5時間前',
    images: [
      {
        url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: [],
      },
      {
        url: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: [
          {
            id: 'tag1',
            name: 'SOMPOひまわり生命',
            url: 'https://www.himawari-life.co.jp/recruit/',
            x: 50,
            y: 30,
          },
        ],
      },
      {
        url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: [
          {
            id: 'tag2',
            name: '佐川急便',
            url: 'https://www.sagawa-exp.co.jp/recruit/',
            x: 30,
            y: 50,
          },
          {
            id: 'tag3',
            name: 'ユニクロ',
            url: 'https://www.uniqlo.com/jp/ja/contents/recruit/',
            x: 70,
            y: 60,
          },
        ],
      },
    ],
    title: '【激レア!?】週休3日の穴場企業8選',
    description: '福利厚生も強い × 年収も高め × 安定して長く働けるという、就活市場ではかなりの"当たり枠"。',
    likes: 512,
    comments: 45,
  },
  {
    id: 3,
    author: '内定ハンター',
    timeAgo: '1日前',
    images: [
      {
        url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: [],
      },
    ],
    title: 'グループディスカッション攻略法',
    description: 'GDで評価されるポイントと、実際に使えるテクニックを解説。',
    likes: 387,
    comments: 29,
  },
];

// 画像スライダーコンポーネント
function ImageSlider({ images }: { images: Post['images'] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTags, setShowTags] = useState(false);

  const currentImage = images[currentIndex];
  const hasTags = currentImage.tags && currentImage.tags.length > 0;

  const handleImageClick = () => {
    if (hasTags) {
      setShowTags(!showTags);
    }
  };

  const handleTagClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div className="relative bg-gray-100 aspect-square">
      {/* 画像 */}
      <img
        src={currentImage.url}
        alt=""
        className="w-full h-full object-cover cursor-pointer"
        onClick={handleImageClick}
      />

      {/* 企業タグ */}
      {showTags && currentImage.tags?.map((tag) => (
        <button
          key={tag.id}
          onClick={(e) => handleTagClick(tag.url, e)}
          className="absolute transform -translate-x-1/2 -translate-y-full animate-fade-in"
          style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
        >
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap shadow-lg">
            <span className="text-sm font-medium">{tag.name}</span>
            <ExternalLink size={14} />
          </div>
          {/* 吹き出しの三角形 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black/80" />
        </button>
      ))}

      {/* タグがある場合のヒント */}
      {hasTags && !showTags && (
        <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-xs">
          タップして企業を見る
        </div>
      )}

      {/* スライドインジケーター */}
      {images.length > 1 && (
        <>
          {/* ドット */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowTags(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-orange-500' : 'bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* 左右ボタン */}
          {currentIndex > 0 && (
            <button
              onClick={() => {
                setCurrentIndex(currentIndex - 1);
                setShowTags(false);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow"
            >
              ‹
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setShowTags(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow"
            >
              ›
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function Magazine() {
  return (
    <div className="pt-14 pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm sticky top-14 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-6">
          <button className="font-bold text-gray-900 border-b-2 border-orange-500 pb-1">
            就活マガジン
          </button>
          <button className="text-gray-500 pb-1">
            保存済み
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {dummyPosts.map((post) => (
          <div key={post.id} className="bg-white mb-4 border-b border-gray-200">
            {/* 投稿者情報 */}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.author[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
                <p className="text-xs text-gray-500">{post.timeAgo}</p>
              </div>
            </div>

            {/* 画像スライダー */}
            <ImageSlider images={post.images} />

            {/* アクションボタン */}
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
                <button className="ml-auto hover:text-orange-500 transition-colors">
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
