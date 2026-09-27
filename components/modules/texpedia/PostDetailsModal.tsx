'use client';

import React, { useState } from 'react';
import {
  X,
  ThumbsUp,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Tag,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  TexpediaPost,
  TexpediaComment,
} from '@/lib/types/modules';
import { TEXPEDIA_CATEGORY_CONFIG } from './texpedia-data';

interface PostDetailsModalProps {
  post: TexpediaPost | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleUpvote: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, comment: TexpediaComment) => void;
  showToast: (msg: string) => void;
}

export function PostDetailsModal({
  post,
  isOpen,
  onClose,
  onToggleUpvote,
  onToggleBookmark,
  onAddComment,
  showToast,
}: PostDetailsModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('Floor Lead');
  const [commenterRole, setCommenterRole] = useState('Supervisor');
  const [commenterDept, setCommenterDept] = useState('Sewing Section');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !post) return null;

  const categoryCfg =
    TEXPEDIA_CATEGORY_CONFIG[post.category] || TEXPEDIA_CATEGORY_CONFIG.SEWING_MACHINERY;
  const currentImage = post.images[activeImageIndex] || post.images[0];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : post.images.length - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < post.images.length - 1 ? prev + 1 : 0));
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: TexpediaComment = {
      id: `cmt-${Date.now()}`,
      authorName: commenterName.trim() || 'Knowledge Peer',
      authorRole: commenterRole.trim() || 'Floor Tech',
      department: commenterDept.trim() || 'Plant Operations',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: commentText.trim(),
      likesCount: 0,
    };

    onAddComment(post.id, newComment);
    setCommentText('');
    showToast('Your answer/tip was posted to this case study thread!');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link to knowledge guide copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryCfg.bg} ${categoryCfg.text} ${categoryCfg.border}`}
            >
              {categoryCfg.label}
            </span>
            {post.isVerifiedSolution && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified QA Solution
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(post.id)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                post.isBookmarked
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'text-slate-400 hover:text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Bookmark Post"
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post Title & Author Header */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {post.title}
            </h1>

            {/* Author bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-sm">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>{post.author.name}</span>
                    {post.author.badges &&
                      post.author.badges.map((b, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-slate-100 text-slate-600"
                        >
                          {b}
                        </span>
                      ))}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {post.author.role} • {post.author.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {post.createdAt}
                </span>
                <span>•</span>
                <span>{post.viewsCount} views</span>
              </div>
            </div>
          </div>

          {/* MULTI-IMAGE CAROUSEL & CAPTION VIEWER */}
          {post.images && post.images.length > 0 && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group aspect-16/9 max-h-[460px] flex items-center justify-center">
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || post.title}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />

                {/* Defect Indicator Tag if marked */}
                {currentImage.highlightDefect && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-rose-600/90 text-white font-bold text-xs shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Defect Sample</span>
                  </div>
                )}

                {/* Lightbox click button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer"
                  title="Expand Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Prev / Next arrows */}
                {post.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter indicator */}
                {post.images.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-[11px] font-mono backdrop-blur-xs">
                    {activeImageIndex + 1} / {post.images.length}
                  </div>
                )}
              </div>

              {/* ACTIVE PHOTO CAPTION BOX */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Photo {activeImageIndex + 1} of {post.images.length} Caption:
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {currentImage.caption || 'Visual inspection reference.'}
                  </p>
                </div>
              </div>

              {/* Thumbnails strip for multi-image */}
              {post.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {post.images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs scale-102'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {img.highlightDefect && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Post Content / Technical Guide */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Technical Guide &amp; Floor Resolution
            </h3>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal space-y-3">
              {post.content}
            </div>
          </div>

          {/* Upvote & Helpful Section */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-slate-900 text-xs">
                Did this solution or photo guide help your line?
              </div>
              <p className="text-[11px] text-slate-500">
                Upvote to promote this case study to the factory verified knowledge bank.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleUpvote(post.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                post.hasUpvoted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful ({post.upvotesCount})</span>
            </button>
          </div>

          {/* Discussion & Answers Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Discussion &amp; Floor Answers ({post.comments.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Peer Knowledge Exchange</span>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {post.comments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  No comments yet. Have you tried this on your lines? Add your observations below!
                </div>
              ) : (
                post.comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cmt.authorName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({cmt.authorRole} • {cmt.department})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{cmt.timestamp}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">{cmt.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleCommentSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-800">
                Add an observation, variation, or question
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  placeholder="Your Name"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <input
                  type="text"
                  value={commenterRole}
                  onChange={(e) => setCommenterRole(e.target.value)}
                  placeholder="Your Role"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
                <input
                  type="text"
                  value={commenterDept}
                  onChange={(e) => setCommenterDept(e.target.value)}
                  placeholder="Section / Line"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share how this solution worked on your sewing floor or lab..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-end"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Answer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 text-white p-2 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage.url}
            alt={currentImage.caption}
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
          />
          {currentImage.caption && (
            <div className="mt-4 p-3 bg-slate-900/80 text-white text-xs max-w-xl text-center rounded-xl border border-slate-700 backdrop-blur-md">
              {currentImage.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
