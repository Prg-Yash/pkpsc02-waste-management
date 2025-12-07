"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Tag,
  User,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Eye,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Enhanced Markdown Parser with Magazine Styling
 */
function parseMarkdown(markdown) {
  if (!markdown) return "";

  let html = markdown;

  // Convert headers
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-2xl sm:text-3xl font-bold text-gray-900 mt-12 mb-6 tracking-tight group flex items-center gap-2"><span class="w-1 h-6 bg-emerald-500 rounded-full inline-block"></span>$1</h3>'
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mt-16 mb-8 tracking-tight border-b border-gray-100 pb-4">$1</h2>'
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mt-16 mb-8 tracking-tight">$1</h1>'
  );

  // Convert bold text
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-bold text-gray-900 bg-emerald-50/50 px-1 rounded">$1</strong>'
  );

  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');

  // Convert inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 text-emerald-700 px-1.5 py-0.5 rounded text-sm border border-gray-200 shadow-sm">$1</code>'
  );

  // Convert links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300/50 underline-offset-4 decoration-2 transition-all hover:decoration-emerald-500" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert unordered lists
  html = html.replace(
    /^\* (.*$)/gim,
    '<li class="flex items-start gap-3 mb-4 text-gray-700 text-lg leading-relaxed"><span class="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span><span>$1</span></li>'
  );
  html = html.replace(
    /^- (.*$)/gim,
    '<li class="flex items-start gap-3 mb-4 text-gray-700 text-lg leading-relaxed"><span class="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span><span>$1</span></li>'
  );

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul class="my-8">$&</ul>');

  // Convert ordered lists
  html = html.replace(
    /^\d+\. (.*$)/gim,
    '<li class="ml-4 mb-3 text-gray-700 pl-2">$1</li>'
  );
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\s*){2,}/g,
    '<ol class="list-decimal list-outside ml-6 my-8 space-y-2 marker:text-emerald-600 marker:font-bold font-medium text-lg text-gray-700">$&</ol>'
  );

  // Convert blockquotes
  html = html.replace(
    /^&gt; (.*$)/gim,
    '<blockquote class="relative border-l-4 border-emerald-500 pl-8 py-6 my-10 italic text-2xl text-gray-800 bg-gray-50/50 rounded-r-2xl leading-relaxed"><span class="absolute top-2 left-2 text-4xl text-emerald-200">"</span>$1</blockquote>'
  );
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote class="relative border-l-4 border-emerald-500 pl-8 py-6 my-10 italic text-2xl text-gray-800 bg-gray-50/50 rounded-r-2xl leading-relaxed"><span class="absolute top-2 left-2 text-4xl text-emerald-200">"</span>$1</blockquote>'
  );

  // Convert code blocks
  html = html.replace(
    /```([a-z]*)\n([\s\S]*?)```/gim,
    '<div class="my-10 rounded-xl overflow-hidden bg-[#1e1e1e] shadow-2xl ring-1 ring-white/10"><div class="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-white/5"><span class="text-gray-400 text-xs uppercase tracking-wider font-semibold">$1</span><div class="flex gap-1.5"><div class="w-3 h-3 rounded-full bg-red-500/80"></div><div class="w-3 h-3 rounded-full bg-yellow-500/80"></div><div class="w-3 h-3 rounded-full bg-green-500/80"></div></div></div><pre class="p-6 overflow-x-auto"><code class="text-sm text-gray-200 leading-relaxed">$2</code></pre></div>'
  );

  // Convert horizontal rules
  html = html.replace(
    /^---$/gim,
    '<div class="flex items-center justify-center my-16 gap-4"><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span></div>'
  );
  html = html.replace(
    /^\*\*\*$/gim,
    '<div class="flex items-center justify-center my-16 gap-4"><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span><span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span></div>'
  );

  // Convert paragraphs (lines not already converted)
  const lines = html.split("\n");
  let firstParagraphFound = false;

  const processedLines = lines.map((line) => {
    const trimmedLine = line.trim();
    // Skip if it's already an HTML tag or empty
    if (!trimmedLine || trimmedLine.startsWith("<")) {
      return line;
    }

    // Add drop cap to first paragraph
    if (!firstParagraphFound && trimmedLine.length > 50) {
      firstParagraphFound = true;
      return `<p class="text-gray-700 leading-8 mb-6 text-xl antialiased first-letter:text-6xl first-letter:font-bold first-letter:text-emerald-600 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-letter:mt-2">${line}</p>`;
    }

    return `<p class="text-gray-700 leading-8 mb-6 text-xl antialiased">${line}</p>`;
  });

  html = processedLines.join("\n");

  // Convert line breaks
  html = html.replace(/\n\n/g, "<br/>");

  return html;
}

const SocialButton = ({ icon: Icon, label, onClick, active = false }) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border transition-all duration-300 ${
      active
        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
        : "bg-white border-gray-200 text-gray-500 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-lg hover:-translate-y-0.5"
    }`}
    title={label}
  >
    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
  </button>
);

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Fetch blog post
  useEffect(() => {
    if (params.slug) {
      fetchBlogPost();
    }
  }, [params.slug]);

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/blog/${params.slug}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setError(null);
        // Fetch related posts
        fetchRelatedPosts(data.post);
      } else {
        setError(data.error || "Blog post not found");
      }
    } catch (err) {
      console.error("Error fetching blog post:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (currentPost) => {
    try {
      const response = await fetch(
        `${API_URL}/api/blog?category=${currentPost.category}&limit=4`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        // Filter out current post and limit to 3
        const related = data.posts
          .filter((p) => p.id !== currentPost.id)
          .slice(0, 3);
        setRelatedPosts(related);
      }
    } catch (err) {
      console.error("Error fetching related posts:", err);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = post.title;

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    } else if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`,
        "_blank"
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`,
        "_blank"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-gray-500 font-medium tracking-wider uppercase text-sm animate-pulse">
          Loading Article
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Article Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            {error ||
              "The article you're looking for doesn't exist or has been moved."}
          </p>
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 origin-left z-[60] shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/blog"
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <span className="font-bold text-2xl tracking-tight text-gray-900 hidden sm:block">
              PKP<span className="text-emerald-600">.</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/blog"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              All Articles
            </Link>
            <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95">
              Subscribe
            </button>
          </div>
        </div>
      </nav>

      <main className="pb-24">
        {/* Header Section */}
        <header className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {post.category}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-[1.1] tracking-tight"
          >
            {post.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
          >
            {post.excerpt}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm border-t border-gray-100 pt-8 mt-8"
          >
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-2 ring-white shadow-md group-hover:ring-emerald-400 transition-all duration-300">
                  <User className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                  {post.author}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                  <span className="font-medium">{post.authorRole}</span>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-gray-200"></div>

            <div className="flex items-center gap-6 text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                {post.readTime} read
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-400" />
                {post.views}
              </div>
            </div>
          </motion.div>
        </header>

        {/* Feature Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[2s]"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/1200x600?text=Blog+Image";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>
        </motion.div>

        {/* Main Layout Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar (Socials) */}
          <div className="hidden lg:flex lg:col-span-2 flex-col items-end">
            <div className="sticky top-32 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                Share
              </p>
              <SocialButton
                icon={Twitter}
                label="Twitter"
                onClick={() => handleShare("twitter")}
              />
              <SocialButton
                icon={Linkedin}
                label="LinkedIn"
                onClick={() => handleShare("linkedin")}
              />
              <SocialButton
                icon={Facebook}
                label="Facebook"
                onClick={() => handleShare("facebook")}
              />
              <SocialButton
                icon={LinkIcon}
                label="Copy Link"
                onClick={() => handleShare("copy")}
                active={copied}
              />

              <div className="w-full h-px bg-gray-200 my-6"></div>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                Interact
              </p>
              <SocialButton
                icon={Heart}
                label="Like"
                onClick={() => setIsLiked(!isLiked)}
                active={isLiked}
              />
            </div>
          </div>

          {/* Article Content */}
          <div className="col-span-1 lg:col-span-8">
            <div className="bg-white">
              {/* Mobile Socials */}
              <div className="lg:hidden flex items-center justify-between py-4 border-y border-gray-100 mb-8 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isLiked
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    Like
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-700 text-sm font-medium">
                    <MessageCircle className="w-4 h-4" />
                    Comment
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare("copy")}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* The Content */}
              <article
                className="prose prose-lg sm:prose-xl max-w-none prose-a:no-underline"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(post.content),
                }}
              />

              {/* Tags & Footer Meta */}
              <div className="mt-16 pt-10 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="bg-emerald-50 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                    <User className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Written by {post.author}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {post.authorRole} at PKP Mumbai. Passionate about waste
                      management, sustainability, and community-driven
                      initiatives.
                    </p>
                    <button className="px-6 py-2 bg-white text-emerald-700 font-semibold rounded-full border border-emerald-200 hover:border-emerald-300 shadow-sm transition-all text-sm">
                      Follow Author
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Spacer) */}
          <div className="hidden lg:block lg:col-span-2"></div>
        </div>
      </main>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-20 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Read Next
                </h2>
                <p className="text-gray-500">
                  Handpicked articles just for you
                </p>
              </div>
              <Link
                href="/dashboard/blog"
                className="hidden sm:flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                View all articles <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/dashboard/blog/${related.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-100 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={related.imageUrl}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=Blog+Image";
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur text-emerald-800 rounded-md text-xs font-bold shadow-sm border border-emerald-100 uppercase tracking-wide">
                        {related.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors leading-tight">
                      {related.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                      {related.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">
                          {related.author}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {related.readTime} read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/dashboard/blog"
                className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                View all articles <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="font-bold text-2xl tracking-tight text-white block mb-2">
              PKP<span className="text-emerald-500">.</span>
            </span>
            <p className="text-gray-400 text-sm">
              © 2025 PKP Waste Management. All rights reserved.
            </p>
          </div>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
