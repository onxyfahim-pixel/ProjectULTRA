'use client';

import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  Bookmark,
  Share2,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
  Users,
  Compass,
} from 'lucide-react';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  TexpediaPost,
  TexpediaCategory,
  TexpediaComment,
} from '@/lib/types/modules';
import {
  INITIAL_TEXPEDIA_POSTS,
  TEXPEDIA_CATEGORY_CONFIG,
} from '../modules/texpedia/texpedia-data';
import { PostCard } from '../modules/texpedia/PostCard';
import { CreatePostModal } from '../modules/texpedia/CreatePostModal';
import { PostDetailsModal } from '../modules/texpedia/PostDetailsModal';
import { useLiveModuleData } from '@/hooks/use-live-module-data';

const STORAGE_KEY = 'erp_texpedia_posts_v1';

export function TexpediaView() {
  const [activeTab, setActiveTab] = useState<'feed' | 'verified' | 'bookmarks'>('feed');
  const [posts, setPosts] = useLiveModuleData<TexpediaPost[]>(
    'texpedia_posts',
    INITIAL_TEXPEDIA_POSTS,
    STORAGE_KEY
  );

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TexpediaPost | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'helpful' | 'latest' | 'discussed'>('helpful');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep selected post details fresh if state updates
  useEffect(() => {
    if (selectedPost) {
      const fresh = posts.find((p) => p.id === selectedPost.id);
      if (fresh && fresh !== selectedPost) {
        setSelectedPost(fresh);
      }
    }
  }, [posts, selectedPost]);

  // Handle Create Post
  const handleCreatePost = (newPost: TexpediaPost) => {
    setPosts([newPost, ...posts]);
    showToast(`Published "${newPost.title}" with ${newPost.images.length} captioned photo(s)!`);
  };

  // Handle Toggle Upvote
  const handleToggleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasVoted = p.hasUpvoted;
          return {
            ...p,
            hasUpvoted: !hasVoted,
            upvotesCount: hasVoted ? p.upvotesCount - 1 : p.upvotesCount + 1,
          };
        }
        return p;
      })
    );
  };

  // Handle Toggle Bookmark
  const handleToggleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newState = !p.isBookmarked;
          showToast(newState ? 'Saved to Bookmarks' : 'Removed from Bookmarks');
          return { ...p, isBookmarked: newState };
        }
        return p;
      })
    );
  };

  // Handle Add Comment
  const handleAddComment = (postId: string, comment: TexpediaComment) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, comment],
          };
        }
        return p;
      })
    );
  };

  // KPI Calculations
  const verifiedCount = posts.filter((p) => p.isVerifiedSolution).length;
  const totalPhotosCount = posts.reduce((acc, p) => acc + (p.images?.length || 0), 0);
  const totalUpvotes = posts.reduce((acc, p) => acc + (p.upvotesCount || 0), 0);

  // Filtered & Sorted Posts
  const filteredPosts = posts
    .filter((p) => {
      if (activeTab === 'verified' && !p.isVerifiedSolution) return false;
      if (activeTab === 'bookmarks' && !p.isBookmarked) return false;

      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.images.some((img) => img.caption.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'helpful') return b.upvotesCount - a.upvotesCount;
      if (sortBy === 'latest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'discussed') return (b.comments?.length || 0) - (a.comments?.length || 0);
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <ModuleHeader
        title="Texpedia Knowledge Base"
        activeView={activeTab === 'feed' ? 'list' : activeTab}
        onViewChange={(mode) => setActiveTab(mode as 'feed' | 'verified' | 'bookmarks')}
        customTabs={[
          { id: 'feed', label: 'Knowledge Feed', count: posts.length },
          { id: 'verified', label: 'Verified Solutions', count: verifiedCount },
          { id: 'bookmarks', label: 'Bookmarks', count: posts.filter((p) => p.isBookmarked).length },
        ]}
      />

      {/* TOP HERO BANNER & STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Knowledge Case Studies"
          value={posts.length}
          subtitle="Peer Problem Solutions"
          icon={<BookOpen className="w-5 h-5" />}
          tone="blue"
        />
        <StatCard
          title="Verified Solutions"
          value={verifiedCount}
          subtitle="Certified QA & Floor Fixes"
          icon={<ShieldCheck className="w-5 h-5" />}
          tone="emerald"
        />
        <StatCard
          title="Captioned Photos"
          value={totalPhotosCount}
          subtitle="Visual Defect References"
          icon={<ImageIcon className="w-5 h-5" />}
          tone="indigo"
        />
        <StatCard
          title="Helpful Peer Votes"
          value={totalUpvotes}
          subtitle="Community Endorsements"
          icon={<ThumbsUp className="w-5 h-5" />}
          tone="rose"
        />
      </div>

      {/* Knowledge Sharing Callout Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              Open Factory Knowledge Hub
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
              Multiple Photos with Captions Supported
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">
            Have you solved a tough fabric, wash, or sewing defect?
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            Upload multiple photos with detailed captions to explain what happened and how you fixed it. Help technicians, pattern masters, and line supervisors across all plant shifts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Share Knowledge / Create Post</span>
        </button>
      </div>

      {/* SEARCH, CATEGORY PILLS & SORT CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problem, needle size, fabric type, photo caption, or author..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="helpful">Most Helpful (Upvotes)</option>
              <option value="latest">Latest Published</option>
              <option value="discussed">Most Discussion</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Topics ({posts.length})
          </button>
          {Object.entries(TEXPEDIA_CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = posts.filter((p) => p.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="ml-1.5 text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* POSTS GRID */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Lightbulb className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No knowledge guides match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search terms or category filter. You can also be the first to share a case study for this topic!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Post with Pictures</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenDetails={(p) => setSelectedPost(p)}
              onToggleUpvote={handleToggleUpvote}
              onToggleBookmark={handleToggleBookmark}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      {/* CREATE POST MODAL */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePost}
        showToast={showToast}
      />

      {/* POST DETAILS & MULTI-IMAGE CAROUSEL MODAL */}
      <PostDetailsModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onToggleUpvote={handleToggleUpvote}
        onToggleBookmark={handleToggleBookmark}
        onAddComment={handleAddComment}
        showToast={showToast}
      />
    </div>
  );
}
