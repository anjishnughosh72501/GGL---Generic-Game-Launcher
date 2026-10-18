import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Image as ImageIcon,
  Check,
  Layers,
  Terminal,
  Palette,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getKnownCoverUrl, resolveAppIcon, resolveGameCover } from '../services/artwork';
import { showItemInFolder } from '../services/launcher';
import { AppLogo } from './AppLogo';

type EditTab = 'general' | 'execution' | 'artwork';

export const EditGameModal: React.FC = () => {
  const { editingGame, setEditingGame, updateGame } = useGameStore();

  const [activeTab, setActiveTab] = useState<EditTab>('general');

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'game' | 'app'>('game');
  const [executablePath, setExecutablePath] = useState('');
  const [installDir, setInstallDir] = useState('');
  const [launchArgs, setLaunchArgs] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isExtractingIcon, setIsExtractingIcon] = useState(false);
  const [isSearchingCover, setIsSearchingCover] = useState(false);

  useEffect(() => {
    if (editingGame) {
      setTitle(editingGame.title);
      setCategory(editingGame.category || 'game');
      setExecutablePath(editingGame.executablePath || '');
      setInstallDir(editingGame.installDir || '');
      setLaunchArgs(editingGame.launchArgs || '');
      setCoverUrl(editingGame.coverUrl || getKnownCoverUrl(editingGame.title) || '');
      setIconUrl(editingGame.iconUrl || '');
      setTags([...(editingGame.tags || [])]);
      setActiveTab('general');
    }
  }, [editingGame]);

  if (!editingGame) return null;

  const handleSelectExe = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('exe');
      if (selected) {
        setExecutablePath(selected);
        // If no icon is set or default, auto extract from selected exe
        if (!iconUrl && electronAPI.extractIcon) {
          const extracted = await electronAPI.extractIcon(selected);
          if (extracted) setIconUrl(extracted);
        }
      }
    }
  };

  const handleSelectFolder = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('folder');
      if (selected) setInstallDir(selected);
    }
  };

  const handleSelectCover = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('image');
      if (selected) setCoverUrl(selected);
    }
  };

  const handleSelectIcon = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFile) {
      const selected = await electronAPI.selectFile('icon');
      if (selected) {
        // If an executable or shortcut was chosen, extract its icon
        if (/\.(exe|ico|lnk)$/i.test(selected) && electronAPI.extractIcon) {
          const extracted = await electronAPI.extractIcon(selected);
          if (extracted) {
            setIconUrl(extracted);
            return;
          }
        }
        setIconUrl(selected);
      }
    }
  };

  const handleExtractFromExe = async () => {
    if (!executablePath) return;
    setIsExtractingIcon(true);
    try {
      const extracted = await resolveAppIcon(executablePath);
      if (extracted) setIconUrl(extracted);
    } finally {
      setIsExtractingIcon(false);
    }
  };

  const handleAutoFindCover = async () => {
    setIsSearchingCover(true);
    try {
      const resolved = await resolveGameCover(title, installDir);
      if (resolved) {
        setCoverUrl(resolved);
      }
    } finally {
      setIsSearchingCover(false);
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const trimmed = (tagToAdd || tagInput).trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      if (!tagToAdd) setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await updateGame(editingGame.id, {
      title: title.trim(),
      category,
      executablePath: executablePath.trim(),
      installDir: installDir.trim() || undefined,
      launchArgs: launchArgs.trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      iconUrl: iconUrl.trim() || undefined,
      tags,
    });
  };

  const quickTagSuggestions = ['PC Game', 'Action', 'Racing', 'RPG', 'Emulator', 'BlueStacks', 'Multiplayer'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl border border-subtle bg-surface text-primary shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="w-6 h-6 rounded-md object-contain shrink-0" />
            ) : (
              <AppLogo className="w-6 h-6" />
            )}
            <div>
              <h2 className="text-sm font-semibold leading-tight line-clamp-1">{title || 'Edit Program Details'}</h2>
              <p className="text-[11px] text-muted">Configure metadata, paths, and branding in GGL</p>
            </div>
          </div>
          <button
            onClick={() => setEditingGame(null)}
            className="p-1.5 rounded-xl hover:bg-surface-hover text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-subtle bg-base/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-surface text-primary font-semibold shadow-xs border border-subtle'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'execution'
                ? 'bg-surface text-primary font-semibold shadow-xs border border-subtle'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution & Paths</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('artwork')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'artwork'
                ? 'bg-surface text-primary font-semibold shadow-xs border border-subtle'
                : 'text-muted hover:text-primary'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Artwork & Logo</span>
          </button>
        </div>

        {/* Tab Content Form */}
        <form id="edit-game-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-primary">
                    Display Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Assetto Corsa"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none font-medium transition-colors focus:border-accent select-text"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-primary">
                    Category
                  </label>
                  <div className="flex items-center h-10 p-1 rounded-xl border border-subtle bg-base">
                    <button
                      type="button"
                      onClick={() => setCategory('game')}
                      className={`flex-1 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        category === 'game'
                          ? 'bg-surface text-accent shadow-xs border border-subtle'
                          : 'text-muted hover:text-primary'
                      }`}
                    >
                      Game
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('app')}
                      className={`flex-1 h-full rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        category === 'app'
                          ? 'bg-surface text-accent shadow-xs border border-subtle'
                          : 'text-muted hover:text-primary'
                      }`}
                    >
                      Application
                    </button>
                  </div>
                </div>
              </div>

              {/* Platform Info Row */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-primary">
                  Platform Origin
                </label>
                <div className="flex items-center justify-between h-10 px-3.5 rounded-xl border border-subtle bg-base/60 text-xs font-mono uppercase text-muted">
                  <span className="font-semibold text-primary">{editingGame.platform}</span>
                  <span className="text-[10px] normal-case text-muted">
                    {editingGame.isCustom ? 'Custom Entry' : 'Auto-Scanned Library'}
                  </span>
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-primary">
                  Tags & Metadata
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    placeholder="Type tag and press Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none focus:border-accent select-text"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="h-10 px-4 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-[10px] text-muted">Suggestions:</span>
                  {quickTagSuggestions.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAddTag(st)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-base text-muted hover:text-accent border border-subtle transition-colors cursor-pointer"
                    >
                      +{st}
                    </button>
                  ))}
                </div>

                {/* Active Tag Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 rounded-xl bg-base/50 border border-subtle">
                  {tags.length > 0 ? (
                    tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-surface border border-subtle text-primary font-medium"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-red-500 ml-1 text-muted cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted italic p-1">No tags assigned</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION & PATHS */}
          {activeTab === 'execution' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-primary">
                    Primary Executable (.exe / .bat)
                  </label>
                  {executablePath && (
                    <button
                      type="button"
                      onClick={() => showItemInFolder(executablePath)}
                      className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Locate in Explorer</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={executablePath}
                    onChange={(e) => setExecutablePath(e.target.value)}
                    placeholder="C:\Games\GameFolder\Game.exe"
                    className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none font-mono focus:border-accent select-text"
                  />
                  <button
                    type="button"
                    onClick={handleSelectExe}
                    className="h-10 flex items-center gap-1.5 px-3.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-primary">
                  Working Directory
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={installDir}
                    onChange={(e) => setInstallDir(e.target.value)}
                    placeholder="C:\Games\GameFolder"
                    className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none font-mono focus:border-accent select-text"
                  />
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    className="h-10 flex items-center gap-1.5 px-3.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-primary">
                  Launch Arguments & Flags
                </label>
                <input
                  type="text"
                  value={launchArgs}
                  onChange={(e) => setLaunchArgs(e.target.value)}
                  placeholder="-novid -fullscreen -dx11"
                  className="w-full h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none font-mono focus:border-accent select-text"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ARTWORK & LOGO */}
          {activeTab === 'artwork' && (
            <div className="space-y-5">
              {/* Cover Art Section */}
              <div className="p-4 rounded-2xl border border-subtle bg-base/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary">
                    Cover / Poster Artwork (2:3 Aspect)
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFindCover}
                    disabled={isSearchingCover}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-accent hover:opacity-80 cursor-pointer transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSearchingCover ? 'animate-spin' : ''}`} />
                    <span>{isSearchingCover ? 'Searching Steam & Local...' : 'Auto-Find Artwork (Steam/Local)'}</span>
                  </button>
                </div>

                <div className="flex gap-4 items-start">
                  {/* Live Poster Preview */}
                  <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden border border-subtle bg-base shrink-0 flex items-center justify-center shadow-sm">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="Image URL or local file path..."
                        className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none focus:border-accent select-text"
                      />
                      <button
                        type="button"
                        onClick={handleSelectCover}
                        className="h-10 flex items-center gap-1.5 px-3.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Browse</span>
                      </button>
                    </div>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="text-[11px] text-muted hover:text-red-400 cursor-pointer"
                      >
                        Clear cover image (use icon fallback)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo / Icon Section */}
              <div className="p-4 rounded-2xl border border-subtle bg-base/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary">
                    App Icon / Logo
                  </span>
                  {executablePath && (
                    <button
                      type="button"
                      onClick={handleExtractFromExe}
                      disabled={isExtractingIcon}
                      className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isExtractingIcon ? 'animate-spin' : ''}`} />
                      <span>Re-extract from Executable</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  {/* Live Icon Preview Tile */}
                  <div className="w-14 h-14 rounded-2xl p-2 border border-subtle bg-base shrink-0 flex items-center justify-center shadow-sm">
                    {iconUrl ? (
                      <img src={iconUrl} alt="Icon Preview" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        placeholder="Icon image URL, Base64 data URL, or file path..."
                        className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-subtle bg-base text-primary placeholder:text-muted outline-none focus:border-accent select-text"
                      />
                      <button
                        type="button"
                        onClick={handleSelectIcon}
                        className="h-10 flex items-center gap-1.5 px-3.5 rounded-xl border border-subtle bg-surface hover:bg-surface-hover text-primary text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs"
                        title="Pick .ico, .png, or .exe file"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Browse Icon</span>
                      </button>
                    </div>
                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => setIconUrl('')}
                        className="text-[11px] text-muted hover:text-red-400 cursor-pointer"
                      >
                        Reset icon to monogram
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Save & Cancel Buttons - Always visible */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-subtle bg-base/20 shrink-0">
          <button
            type="button"
            onClick={() => setEditingGame(null)}
            className="h-10 px-4 rounded-xl text-xs font-semibold border border-subtle text-muted hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-game-form"
            className="h-10 flex items-center gap-2 px-6 rounded-xl text-xs font-semibold bg-accent text-accent-fg hover:bg-accent-hover active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
