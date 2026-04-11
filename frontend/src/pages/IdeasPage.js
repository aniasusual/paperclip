import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Lightbulb, Search, Plus, Archive, Inbox, LayoutList,
  MoreHorizontal, Pencil, Trash2, ArchiveRestore, Tag, FolderPlus, X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import IdeaDialog from "@/components/IdeaDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function IdeasPage() {
  const [ideas, setIdeas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);

  // Add category
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const fetchIdeas = useCallback(async () => {
    try {
      const params = { archived: showArchived };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (filterTag) params.tag = filterTag;
      const res = await axios.get(`${API}/ideas`, { params });
      setIdeas(res.data);
    } catch (e) {
      console.error("Failed to fetch ideas", e);
    }
  }, [search, filterCategory, filterPriority, filterTag, showArchived]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API}/tags`);
      setAllTags(res.data);
    } catch (e) {
      console.error("Failed to fetch tags", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/stats`);
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchIdeas(), fetchCategories(), fetchTags(), fetchStats()]);
    setLoading(false);
  }, [fetchIdeas]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { fetchIdeas(); }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchIdeas]);

  const handleCreateIdea = async (data) => {
    try {
      await axios.post(`${API}/ideas`, data);
      toast.success("Idea created!");
      refreshAll();
    } catch (e) {
      toast.error("Failed to create idea");
    }
  };

  const handleUpdateIdea = async (id, data) => {
    try {
      await axios.put(`${API}/ideas/${id}`, data);
      toast.success("Idea updated!");
      refreshAll();
    } catch (e) {
      toast.error("Failed to update idea");
    }
  };

  const handleDeleteIdea = async (id) => {
    try {
      await axios.delete(`${API}/ideas/${id}`);
      toast.success("Idea deleted");
      refreshAll();
    } catch (e) {
      toast.error("Failed to delete idea");
    }
  };

  const handleArchiveIdea = async (id) => {
    try {
      await axios.patch(`${API}/ideas/${id}/archive`);
      toast.success(showArchived ? "Idea restored" : "Idea archived");
      refreshAll();
    } catch (e) {
      toast.error("Failed to archive idea");
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const colors = ["#C7362E", "#8B5CF6", "#B26E12", "#2A72A5", "#059669", "#D97706", "#7C3AED", "#0891B2"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      await axios.post(`${API}/categories`, { name: newCatName.trim(), color });
      setNewCatName("");
      setShowAddCat(false);
      fetchCategories();
      toast.success("Category added!");
    } catch (e) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API}/categories/${id}`);
      if (filterCategory) {
        const cat = categories.find(c => c.id === id);
        if (cat && filterCategory === cat.name) setFilterCategory("");
      }
      fetchCategories();
      toast.success("Category deleted");
    } catch (e) {
      toast.error("Failed to delete category");
    }
  };

  const openEdit = (idea) => {
    setEditingIdea(idea);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingIdea(null);
    setDialogOpen(true);
  };

  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getViewTitle = () => {
    if (showArchived) return "Archived Ideas";
    if (filterCategory) return filterCategory;
    return "All Ideas";
  };

  return (
    <div className="idea-app" data-testid="idea-app">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo flex items-center gap-2">
            <Lightbulb strokeWidth={1.5} size={20} />
            IdeaLog
          </div>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number" data-testid="stat-active">{stats.total_active || 0}</span>
              <span className="stat-label">active</span>
            </div>
            <div className="stat-item">
              <span className="stat-number" data-testid="stat-archived">{stats.total_archived || 0}</span>
              <span className="stat-label">archived</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Views</div>
          <button
            className={`sidebar-item ${!showArchived && !filterCategory ? "active" : ""}`}
            onClick={() => { setShowArchived(false); setFilterCategory(""); setFilterTag(""); setFilterPriority(""); }}
            data-testid="nav-all-ideas"
          >
            <Inbox strokeWidth={1.5} size={16} />
            All Ideas
            <span className="item-count">{stats.total_active || 0}</span>
          </button>
          <button
            className={`sidebar-item ${showArchived ? "active" : ""}`}
            onClick={() => { setShowArchived(true); setFilterCategory(""); setFilterTag(""); setFilterPriority(""); }}
            data-testid="nav-archived"
          >
            <Archive strokeWidth={1.5} size={16} />
            Archived
            <span className="item-count">{stats.total_archived || 0}</span>
          </button>

          <div className="sidebar-section-label">Categories</div>
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center group">
              <button
                className={`sidebar-item flex-1 ${filterCategory === cat.name && !showArchived ? "active" : ""}`}
                onClick={() => { setFilterCategory(cat.name); setShowArchived(false); }}
                data-testid={`nav-cat-${cat.name.toLowerCase()}`}
              >
                <span className="sidebar-category-dot" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#A09E9A] hover:text-[#C7362E]"
                onClick={() => handleDeleteCategory(cat.id)}
                data-testid={`delete-cat-${cat.name.toLowerCase()}`}
              >
                <X strokeWidth={1.5} size={12} />
              </button>
            </div>
          ))}

          {showAddCat ? (
            <div className="add-category-row">
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Category name"
                onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowAddCat(false); }}
                autoFocus
                data-testid="new-category-input"
              />
              <Button size="sm" onClick={handleAddCategory} data-testid="save-category-btn">
                <Plus strokeWidth={1.5} size={14} />
              </Button>
            </div>
          ) : (
            <button
              className="sidebar-item text-[#A09E9A]"
              onClick={() => setShowAddCat(true)}
              data-testid="add-category-btn"
            >
              <FolderPlus strokeWidth={1.5} size={16} />
              Add Category
            </button>
          )}

          {allTags.length > 0 && (
            <>
              <div className="sidebar-section-label">Tags</div>
              {allTags.slice(0, 10).map(t => (
                <button
                  key={t.name}
                  className={`sidebar-item ${filterTag === t.name ? "active" : ""}`}
                  onClick={() => {
                    setFilterTag(filterTag === t.name ? "" : t.name);
                    setShowArchived(false);
                  }}
                  data-testid={`nav-tag-${t.name}`}
                >
                  <Tag strokeWidth={1.5} size={14} />
                  {t.name}
                  <span className="item-count">{t.count}</span>
                </button>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content" data-testid="main-content">
        <div className="content-header">
          <h1 className="content-title" data-testid="view-title">{getViewTitle()}</h1>
        </div>

        <div className="toolbar">
          <div className="search-wrapper">
            <Search strokeWidth={1.5} size={16} />
            <input
              className="search-input"
              placeholder="Search ideas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="search-input"
            />
          </div>

          <Select value={filterPriority} onValueChange={v => setFilterPriority(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px] h-9 bg-white border-[#E5E5E3] text-sm" data-testid="priority-filter">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={openNew}
                className="bg-[#1C1B1A] hover:bg-[#2C2B2A] text-white"
                data-testid="new-idea-btn"
              >
                <Plus strokeWidth={1.5} size={16} />
                New Idea
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new idea</TooltipContent>
          </Tooltip>
        </div>

        {/* Active filters display */}
        {(filterCategory || filterTag || filterPriority) && (
          <div className="flex items-center gap-2 px-10 py-3 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A09E9A]">Filters:</span>
            {filterCategory && (
              <Badge variant="secondary" className="gap-1 cursor-pointer rounded-full text-xs" onClick={() => setFilterCategory("")} data-testid="clear-category-filter">
                {filterCategory} <X size={12} />
              </Badge>
            )}
            {filterTag && (
              <Badge variant="secondary" className="gap-1 cursor-pointer rounded-full text-xs" onClick={() => setFilterTag("")} data-testid="clear-tag-filter">
                {filterTag} <X size={12} />
              </Badge>
            )}
            {filterPriority && (
              <Badge variant="secondary" className="gap-1 cursor-pointer rounded-full text-xs" onClick={() => setFilterPriority("")} data-testid="clear-priority-filter">
                {filterPriority} <X size={12} />
              </Badge>
            )}
          </div>
        )}

        {/* Idea List */}
        <div className="idea-list" data-testid="idea-list">
          {loading ? (
            <div className="empty-state">
              <LayoutList strokeWidth={1.5} size={40} className="empty-state-icon animate-pulse" />
              <p className="empty-state-title">Loading ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <Lightbulb strokeWidth={1.5} size={48} className="empty-state-icon" />
              <p className="empty-state-title">
                {showArchived ? "No archived ideas" : "No ideas yet"}
              </p>
              <p className="empty-state-text">
                {showArchived ? "Archive ideas to keep things tidy" : "Start capturing your thoughts"}
              </p>
              {!showArchived && (
                <Button
                  onClick={openNew}
                  className="mt-6 bg-[#1C1B1A] hover:bg-[#2C2B2A] text-white"
                  data-testid="empty-new-idea-btn"
                >
                  <Plus strokeWidth={1.5} size={16} />
                  Add your first idea
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {ideas.map((idea, i) => (
                <motion.div
                  key={idea.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <div
                    className="idea-item"
                    onClick={() => openEdit(idea)}
                    data-testid={`idea-item-${idea.id}`}
                  >
                    <div className="idea-item-content">
                      <div className="idea-item-title">{idea.title}</div>
                      {idea.content && (
                        <div className="idea-item-excerpt">{idea.content}</div>
                      )}
                      <div className="idea-item-meta">
                        {idea.priority && (
                          <span className={`priority-badge priority-${idea.priority}`} data-testid={`priority-${idea.id}`}>
                            {idea.priority}
                          </span>
                        )}
                        {idea.category && (
                          <span className="idea-tag" data-testid={`category-${idea.id}`}>
                            {idea.category}
                          </span>
                        )}
                        {idea.tags.map(tag => (
                          <span key={tag} className="idea-tag" data-testid={`tag-${idea.id}-${tag}`}>
                            #{tag}
                          </span>
                        ))}
                        <span className="idea-item-date">{formatDate(idea.created_at)}</span>
                      </div>
                    </div>

                    <div className="idea-item-actions" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`idea-menu-${idea.id}`}>
                            <MoreHorizontal strokeWidth={1.5} size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(idea)} data-testid={`edit-idea-${idea.id}`}>
                            <Pencil strokeWidth={1.5} size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveIdea(idea.id)} data-testid={`archive-idea-${idea.id}`}>
                            {showArchived ? (
                              <><ArchiveRestore strokeWidth={1.5} size={14} className="mr-2" />Restore</>
                            ) : (
                              <><Archive strokeWidth={1.5} size={14} className="mr-2" />Archive</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="text-[#C7362E] focus:text-[#C7362E]"
                            data-testid={`delete-idea-${idea.id}`}
                          >
                            <Trash2 strokeWidth={1.5} size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Idea Dialog */}
      <IdeaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        idea={editingIdea}
        categories={categories}
        onSave={(data) => {
          if (editingIdea) {
            handleUpdateIdea(editingIdea.id, data);
          } else {
            handleCreateIdea(data);
          }
          setDialogOpen(false);
          setEditingIdea(null);
        }}
      />
    </div>
  );
}
