import { Bookmark, ExternalLink, Grid3X3, List, ChevronLeft, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, getCurrentUserId } from '../lib/supabase';
import { showToast } from '../components/Toast';

type CompanyTag = {
  id: string;
  name: string;
  url: string;
  x: number;
  y: number;
};

type Post = {
  id: string;
  images: {
    url: string;
    tags?: CompanyTag[];
  }[];
  title: string;
  description: string;
  likes: number;
};

const dummyPosts: Post[] = [
  {
    id: '1',
    images: [
      { url: '/images/magazine/es-basic.png', tags: [] },
      { url: '/images/magazine/es-howto.png', tags: [] },
    ],
    title: '【超基本】いまさら聞けないESの書き方',
    description: 'ESの基本的な書き方を解説します。',
    likes: 234,
  },
  {
    id: '2',
    images: [
      { url: '/images/magazine/weekly3.png', tags: [] },
      {
        url: '/images/magazine/sompo.png',
        tags: [
          { id: 'tag1', name: 'SOMPOひまわり生命', url: 'https://www.himawari-life.co.jp/recruit/', x: 50, y: 18 }
        ]
      },
      {
        url: '/images/magazine/uniqlo.png',
        tags: [
          { id: 'tag2', name: 'ユニクロ', url: 'https://www.uniqlo.com/jp/ja/contents/recruit/', x: 50, y: 18 }
        ]
      },
    ],
    title: '【激レア!?】週休3日の穴場企業8選',
    description: '福利厚生も強い × 年収も高め × 安定して長く働ける企業を紹介。',
    likes: 512,
  },
  {
    id: '3',
    images: [
      { url: '/images/magazine/december.png', tags: [] },
    ],
    title: '12月下旬からの就活スケジュール',
    description: '今からでも間に合う！就活の進め方を解説。',
    likes: 387,
  },
  {
    id: '4',
    images: [
      { url: '/images/magazine/interview-ng.png', tags: [] },
    ],
    title: '面接で絶対言ってはいけないNGワード',
    description: '面接官が嫌がるNGワードとは？',
    likes: 421,
  },
];

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

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setShowTags(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
    setShowTags(false);
  };

  return (
    <div className="relative bg-gray-100 aspect-square max-w-md mx-auto">
      <img
        src={currentImage.url}
        alt=""
        className="w-full h-full object-contain cursor-pointer bg-white"
        onClick={handleImageClick}
      />

      {showTags && hasTags && currentImage.tags?.map((tag) => (
        <button
          key={tag.id}
          onClick={(e) => {
            e.stopPropagation();
            window.open(tag.url, '_blank');
          }}
          className="absolute bg-black/80 text-white text-sm px-3 py-2 rounded-lg flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 hover:bg-black transition-colors"
          style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
        >
          {tag.name}
          <ExternalLink size={14} />
        </button>
      ))}

      {hasTags && !showTags && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
          タップして企業を見る
        </div>
      )}

      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow rotate-180"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-orange-500' : 'bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetail({
  post,
  onClose,
  isSaved,
  onToggleSave
}: {
  post: Post;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('共有がキャンセルされました');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('リンクをコピーしました', 'success');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center">
      <div className="w-full max-w-md bg-white overflow-y-auto">
        <div className="sticky top-0 bg-white z-10">
          <div className="flex items-center p-3">
            <button onClick={onClose} className="p-1">
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>

        <ImageSlider images={post.images} />

        <div className="flex items-center justify-end gap-4 px-4 py-2">
          <button onClick={handleShare} className="p-1">
            <Send size={22} className="text-gray-600" />
          </button>
          <button onClick={onToggleSave} className="p-1">
            <Bookmark
              size={22}
              className={isSaved ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}
            />
          </button>
        </div>

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-blue-600 mb-2">{post.title}</h2>
          <p className="text-gray-600 text-sm">{post.description}</p>
        </div>
      </div>
    </div>
  );
}

function GridThumbnail({ post, onClick, isSaved }: { post: Post; onClick: () => void; isSaved: boolean }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square bg-gray-100 overflow-hidden"
    >
      <img
        src={post.images[0].url}
        alt={post.title}
        className="w-full h-full object-cover"
      />
      {isSaved && (
        <div className="absolute top-1 right-1">
          <Bookmark size={16} className="text-orange-500 fill-orange-500" />
        </div>
      )}
    </button>
  );
}

export default function Magazine() {
  const [activeTab, setActiveTab] = useState<'magazine' | 'saved'>('magazine');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Post[]>(dummyPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data: savedData, error: savedError } = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', userId);

      if (savedError) throw savedError;

      if (savedData) {
        setSavedPostIds(new Set(savedData.map(s => s.article_id)));
      }

      setPosts(dummyPosts);
    } catch (error) {
      console.error('Error loading magazine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (postId: string) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const isSaved = savedPostIds.has(postId);

      if (isSaved) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', postId);

        if (error) throw error;

        setSavedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('saved_articles')
          .insert([{ user_id: userId, article_id: postId }]);

        if (error) throw error;

        setSavedPostIds(prev => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      showToast('保存の更新に失敗しました', 'error');
    }
  };

  const displayPosts = activeTab === 'saved'
    ? posts.filter(post => savedPostIds.has(post.id))
    : posts;

  return (
    <div className="pt-14 pb-20 bg-white min-h-screen max-w-md mx-auto">
      <div className="flex border-b sticky top-14 bg-white z-10">
        <button
          onClick={() => setActiveTab('magazine')}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === 'magazine'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-500'
          }`}
        >
          就活マガジン
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === 'saved'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-500'
          }`}
        >
          保存済み
        </button>
      </div>

      {activeTab === 'magazine' && (
        <div className="flex justify-end p-2 gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
          >
            <Grid3X3 size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
          >
            <List size={20} className="text-gray-600" />
          </button>
        </div>
      )}

      {activeTab === 'saved' && savedPostIds.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bookmark size={48} className="mb-4" />
          <p>保存済みの投稿はありません</p>
        </div>
      ) : viewMode === 'grid' || activeTab === 'saved' ? (
        <div className="grid grid-cols-3 gap-0.5">
          {displayPosts.map((post) => (
            <GridThumbnail
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
              isSaved={savedPostIds.has(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y">
          {displayPosts.map((post) => (
            <div key={post.id} className="bg-white">
              <ImageSlider images={post.images} />
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm flex-1">{post.title}</h3>
                  <button
                    onClick={() => toggleSave(post.id)}
                    className="p-1"
                  >
                    <Bookmark
                      size={20}
                      className={savedPostIds.has(post.id) ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}
                    />
                  </button>
                </div>
                <p className="text-gray-500 text-xs">{post.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          isSaved={savedPostIds.has(selectedPost.id)}
          onToggleSave={() => toggleSave(selectedPost.id)}
        />
      )}
    </div>
  );
}
