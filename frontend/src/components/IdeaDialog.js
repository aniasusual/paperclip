import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function IdeaDialog({ open, onOpenChange, idea, categories, onSave }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("low");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const tagRef = useRef(null);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title || "");
      setContent(idea.content || "");
      setCategory(idea.category || "");
      setPriority(idea.priority || "low");
      setTags(idea.tags || []);
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setPriority("low");
      setTags([]);
    }
    setTagInput("");
  }, [idea, open]);

  const addTag = (val) => {
    const tag = val.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      tags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="idea-dialog-content" data-testid="idea-dialog">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Outfit', sans-serif" }} data-testid="idea-dialog-title">
            {idea ? "Edit Idea" : "New Idea"}
          </DialogTitle>
          <DialogDescription>
            {idea ? "Update your idea details below." : "Capture your idea before it fades away."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="idea-form-group">
            <label className="idea-form-label">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's your idea?"
              className="border-[#E5E5E3] focus-visible:ring-[#D1D0CE]"
              data-testid="idea-title-input"
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="idea-form-group">
            <label className="idea-form-label">Details</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe your idea in detail..."
              rows={4}
              className="border-[#E5E5E3] focus-visible:ring-[#D1D0CE] resize-none"
              data-testid="idea-content-input"
            />
          </div>

          {/* Category & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="idea-form-group">
              <label className="idea-form-label">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-[#E5E5E3]" data-testid="idea-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="idea-form-group">
              <label className="idea-form-label">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="border-[#E5E5E3]" data-testid="idea-priority-select">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2A72A5]" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B26E12]" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C7362E]" />
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="idea-form-group">
            <label className="idea-form-label">Tags</label>
            <div className="tag-input-wrapper" onClick={() => tagRef.current?.focus()}>
              {tags.map(tag => (
                <span key={tag} className="tag-chip" data-testid={`dialog-tag-${tag}`}>
                  #{tag}
                  <button onClick={() => removeTag(tag)} data-testid={`remove-tag-${tag}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                ref={tagRef}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "Type and press Enter to add tags" : "Add more..."}
                data-testid="tag-input"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#E5E5E3] text-[#706F6C]"
            data-testid="idea-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="bg-[#1C1B1A] hover:bg-[#2C2B2A] text-white"
            data-testid="idea-save-btn"
          >
            {idea ? "Update Idea" : "Save Idea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
