"use client";

import { useState, useRef } from "react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/use-documents";
import { Loader2, Upload, FileText, Trash2, Search, File, FileCode, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents = [], isLoading } = useDocuments();
  const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDoc } = useDeleteDocument();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDoc({ file });
      // Reset input
      e.target.value = '';
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-display flex items-center gap-2">
            <FileText className="w-8 h-8 text-[var(--color-accent)]" />
            Knowledge Base
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Upload your course materials. AcademIQ's AI will read and remember them for you.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.txt,.md"
          />
          <Button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-lg"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Document
          </Button>
        </div>
      </div>

      <div className="relative glass border border-[var(--color-border)] rounded-2xl p-2 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
        <Input
          type="text"
          placeholder="Search documents..."
          className="pl-11 border-0 bg-transparent shadow-none focus-visible:ring-0 text-white placeholder:text-[var(--color-text-muted)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center p-12 glass border border-[var(--color-border)] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">Upload PDFs, TXT, or Markdown files to expand your AI's knowledge.</p>
          <Button onClick={handleUploadClick} variant="outline" className="border-[var(--color-border)]">
            <Upload className="w-4 h-4 mr-2" /> Upload First File
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={doc.id}
              className="glass border border-[var(--color-border)] rounded-2xl p-5 hover:border-[var(--color-border-hover)] transition-all flex flex-col group relative overflow-hidden"
            >
              {doc.status === "processing" && (
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]/20 overflow-hidden">
                  <div className="h-full bg-[var(--color-accent)] animate-pulse w-1/2 rounded-r-full" />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                  {doc.file_type === "pdf" ? (
                    <File className="w-5 h-5 text-rose-400" />
                  ) : doc.file_type === "md" ? (
                    <FileCode className="w-5 h-5 text-blue-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteDoc(doc.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <h3 className="font-semibold text-white text-lg truncate mb-1" title={doc.title}>
                {doc.title}
              </h3>
              
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-6">
                <span>{formatBytes(doc.file_size)}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
                <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-sm">
                  {doc.status === "ready" ? (
                    <span className="flex items-center text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Ready
                    </span>
                  ) : doc.status === "processing" ? (
                    <span className="flex items-center text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full font-medium">
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Processing
                    </span>
                  ) : (
                    <span className="flex items-center text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Failed
                    </span>
                  )}
                </div>
                
                {doc.status === "ready" && (
                  <Link href={`/dashboard/ai`}>
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)] hover:text-white hover:bg-[var(--color-accent)]/20">
                      <Sparkles className="w-4 h-4 mr-1.5" /> Ask AI
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
