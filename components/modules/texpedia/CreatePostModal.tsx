'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Tag,
  User,
  Building2,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  TexpediaPost,
  TexpediaCategory,
  TexpediaImage,
} from '@/lib/types/modules';
import { TEXPEDIA_CATEGORY_CONFIG } from './texpedia-data';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: TexpediaPost) => void;
  showToast: (msg: string) => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  showToast,
}: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TexpediaCategory>('SEWING_MACHINERY');
  const [tagInput, setTagInput] = useState('Needle Heat, Puckering, Floor Tip');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('Quality Engineer');
  const [authorRole, setAuthorRole] = useState('Senior QA Inspector');
  const [authorDept, setAuthorDept] = useState('Sewing & In-line QA');

  // Multi-image list with captions
  const [images, setImages] = useState<TexpediaImage[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlCaption, setUrlCaption] = useState('');
  const [showUrlAdd, setShowUrlAdd] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file uploads (multiple images supported)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg: TexpediaImage = {
            id: `img-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            url: event.target.result as string,
            caption: `Photo ${images.length + index + 1}: ${file.name.replace(/\.[^/.]+$/, '')}`,
            highlightDefect: false,
          };
          setImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast(`Loaded ${files.length} photo(s). Don't forget to customize their captions!`);
  };

  // Add image by URL
  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newImg: TexpediaImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: urlInput.trim(),
      caption: urlCaption.trim() || `Figure ${images.length + 1}: Technical visual reference`,
      highlightDefect: false,
    };

    setImages([...images, newImg]);
    setUrlInput('');
    setUrlCaption('');
    setShowUrlAdd(false);
    showToast('Photo added from URL');
  };

  const handleUpdateCaption = (id: string, newCaption: string) => {
    setImages(
      images.map((img) => (img.id === id ? { ...img, caption: newCaption } : img))
    );
  };

  const handleToggleHighlight = (id: string) => {
    setImages(
      images.map((img) =>
        img.id === id ? { ...img, highlightDefect: !img.highlightDefect } : img
      )
    );
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const newArr = [...images];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setImages(newArr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a descriptive post title');
      return;
    }
    if (!content.trim()) {
      showToast('Please provide detailed technical guidance or root cause steps');
      return;
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newPost: TexpediaPost = {
      id: `post-${Date.now()}`,
      title: title.trim(),
      category,
      tags: tags.length > 0 ? tags : ['General Knowledge', 'Quality Tip'],
      summary:
        summary.trim() ||
        (content.length > 140 ? `${content.slice(0, 140)}...` : content),
      content: content.trim(),
      author: {
        name: authorName.trim() || 'Floor Technologist',
        role: authorRole.trim() || 'QA Technician',
        department: authorDept.trim() || 'Quality Operations',
        badges: ['Knowledge Contributor'],
      },
      images,
      upvotesCount: 1,
      hasUpvoted: true,
      isBookmarked: false,
      isVerifiedSolution: false,
      viewsCount: 1,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      comments: [],
    };

    onSubmit(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Share Knowledge on Texpedia
              </h2>
              <p className="text-xs text-slate-500">
                Help other factory staff and textile peers by sharing visual defect guides &amp; solutions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Post Title & Category */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Post Title / Knowledge Topic *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solving Seam Puckering on 100% Polyester Microfiber (Activewear Seams)"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TexpediaCategory)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {Object.entries(TEXPEDIA_CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Needle Heat, Tension, Denim, AQL"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION: MULTIPLE PHOTOS UPLOAD WITH CAPTIONS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Knowledge Photos with Individual Captions ({images.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload multiple photos showing defect before &amp; after, machine settings, or microscope zooms. Add a descriptive caption to each photo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlAdd(!showUrlAdd)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>From URL</span>
                </button>
              </div>
            </div>

            {/* URL Input Form */}
            {showUrlAdd && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste image web URL (e.g. https://...)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={urlCaption}
                    onChange={(e) => setUrlCaption(e.target.value)}
                    placeholder="Caption for this picture..."
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlAdd(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Images List with Captions */}
            {images.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">
                  Click to select multiple photos or drag and drop
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WebP. You can add unique captions for each picture.
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs"
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={img.url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[9px] font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Caption Input & Details */}
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Photo {idx + 1} Caption:
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!img.highlightDefect}
                              onChange={() => handleToggleHighlight(img.id)}
                              className="w-3.5 h-3.5 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                            />
                            <span className={img.highlightDefect ? 'text-rose-600 font-bold' : ''}>
                              Tag as Defect Sample
                            </span>
                          </label>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={img.caption}
                        onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                        placeholder="Write a clear caption explaining what to observe in this picture..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Re-order & Delete Controls */}
                    <div className="flex sm:flex-col items-center gap-1 shrink-0 self-end sm:self-center">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, 'up')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={() => handleMoveImage(idx, 'down')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Guide & Resolution Body */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Summary / Key Takeaway
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief 1-2 sentence overview of what the problem was and the breakthrough solution..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Technical Instructions &amp; Root Cause Explanation *
              </label>
              <textarea
                rows={6}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Describe:
1. What was the exact defect or challenge?
2. What root cause was discovered?
3. Step-by-step fix (e.g. machine needle code, tension settings, chemistry formula, laser alignment)?
4. Final result or quality audit metric achieved.`}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-normal leading-relaxed"
              />
            </div>
          </div>

          {/* Author Credentials */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>Your Contributor Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Section / Department
                </label>
                <input
                  type="text"
                  value={authorDept}
                  onChange={(e) => setAuthorDept(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Knowledge Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
