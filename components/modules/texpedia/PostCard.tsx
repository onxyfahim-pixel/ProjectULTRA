'use client';

import React from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
  Tag,
  ArrowRight,
  Eye,
  Layers,
} from 'lucide-react';
import { TexpediaPost } from '@/lib/types/modules';
import { TEXPEDIA_CATEGORY_CONFIG } from './texpedia-data';

interface PostCardProps {
  post: TexpediaPost;
  onOpenDetails: (post: TexpediaPost) => void;
  onToggleUpvote: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  showToast: (msg: string) => void;
}

export function PostCard({
  post,
  onOpenDetails,
  onToggleUpvote,
  onToggleBookmark,
  showToast,
}: PostCardProps) {
  const categoryCfg =
    TEXPEDIA_CATEGORY_CONFIG[post.category] || TEXPEDIA_CATEGORY_CONFIG.SEWING_MACHINERY;
  const imageCount = post.images?.length || 0;
  const firstImage = post.images?.[0];
  const secondImage = post.images?.[1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Card Header: Category & Author */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-xs">
            {post.author.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>{post.author.name}</span>
              {post.isVerifiedSolution && (
                <span title="Verified Solution">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {post.author.role} • {post.author.department}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryCfg.bg} ${categoryCfg.text} ${categoryCfg.border}`}
          >
            {categoryCfg.label}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(post.id);
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              post.isBookmarked
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'text-slate-400 hover:text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
            title="Bookmark this post"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Title & Summary */}
      <div className="px-4 sm:px-5 pb-3">
        <h2
          onClick={() => onOpenDetails(post)}
          className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer leading-snug line-clamp-2"
        >
          {post.title}
        </h2>
        {post.summary && (
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {post.summary}
          </p>
        )}
      </div>

      {/* MULTIPLE PICTURES PREVIEW WITH CAPTIONS */}
      {imageCount > 0 && (
        <div
          onClick={() => onOpenDetails(post)}
          className="px-4 sm:px-5 pb-3 cursor-pointer"
        >
          {imageCount === 1 ? (
            /* Single Image Layout */
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group/img">
              <div className="aspect-16/9 overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={firstImage.url}
                  alt={firstImage.caption || post.title}
                  className="w-full h-full object-cover group-hover/img:scale-102 transition-transform duration-300"
                />
              </div>
              {firstImage.caption && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug">
                  {firstImage.highlightDefect && (
                    <span className="font-bold text-rose-600 shrink-0">⚠️ Defect:</span>
                  )}
                  <span className="line-clamp-2">{firstImage.caption}</span>
                </div>
              )}
            </div>
          ) : (
            /* Multi-Image Layout (2 side-by-side or with +N overlay) */
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 space-y-1.5">
              <div className="grid grid-cols-2 gap-1 relative aspect-16/9 bg-slate-900">
                <div className="relative overflow-hidden h-full">
                  <img
                    src={firstImage.url}
                    alt={firstImage.caption}
                    className="w-full h-full object-cover"
                  />
                  {firstImage.highlightDefect && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[9px] font-bold">
                      Defect
                    </span>
                  )}
                </div>
                <div className="relative overflow-hidden h-full">
                  <img
                    src={secondImage?.url || firstImage.url}
                    alt={secondImage?.caption}
                    className="w-full h-full object-cover"
                  />
                  {imageCount > 2 && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-bold text-sm backdrop-blur-2xs">
                      +{imageCount - 2} More Photos
                    </div>
                  )}
                </div>
              </div>

              {/* Show First Photo Caption */}
              {firstImage.caption && (
                <div className="px-2.5 pb-2 text-[11px] text-slate-600 flex items-start gap-1.5 leading-tight">
                  <span className="font-bold text-slate-800 shrink-0">Photo 1:</span>
                  <span className="truncate">{firstImage.caption}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5 mt-auto">
          {post.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 font-mono">
              +{post.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer Bar: Upvote, Comments, Read Details */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleUpvote(post.id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              post.hasUpvoted
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                : 'text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Mark as helpful / Upvote"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{post.upvotesCount}</span>
          </button>

          <span
            onClick={() => onOpenDetails(post)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.comments?.length || 0}</span>
          </span>

          <span className="flex items-center gap-1 text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.viewsCount}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(post)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Read Solution</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
