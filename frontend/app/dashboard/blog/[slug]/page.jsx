'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Share2, Tag, User, Facebook, Twitter, Linkedin, Link as LinkIcon, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Convert markdown to HTML with proper styling
 */
function parseMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold text-gray-900 mt-10 mb-5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-gray-900 mt-12 mb-6">$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-emerald-600 px-2 py-1 rounded font-mono text-sm">$1</code>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-600 hover:text-emerald-700 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');

  // Convert unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700">$1</li>');

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul class="list-disc ml-6 my-4 space-y-2">$&</ul>');

  // Convert ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\s*){2,}/g, '<ol class="list-decimal ml-6 my-4 space-y-2">$&</ol>');

  // Convert blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 my-4 italic text-gray-600 bg-emerald-50">$1</blockquote>');
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 my-4 italic text-gray-600 bg-emerald-50">$1</blockquote>');

  // Convert code blocks
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="font-mono text-sm">$2</code></pre>');

  // Convert horizontal rules
  html = html.replace(/^---$/gim, '<hr class="my-8 border-t-2 border-gray-200" />');
  html = html.replace(/^\*\*\*$/gim, '<hr class="my-8 border-t-2 border-gray-200" />');

  // Convert paragraphs (lines not already converted)
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    // Skip if it's already an HTML tag or empty
    if (!trimmedLine || trimmedLine.startsWith('<')) {
      return line;
    }
    return `<p class="text-gray-700 leading-relaxed mb-4 text-lg">${line}</p>`;
  });

  html = processedLines.join('\n');

  // Convert line breaks
  html = html.replace(/\n\n/g, '<br/><br/>');

  return html;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setError(null);
        // Fetch related posts
        fetchRelatedPosts(data.post);
      } else {
        setError(data.error || 'Blog post not found');
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (currentPost) => {
    try {
      const response = await fetch(`${API_URL}/api/blog?category=${currentPost.category}&limit=4`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();

      if (data.success) {
        // Filter out current post and limit to 3
        const related = data.posts
          .filter(p => p.id !== currentPost.id)
          .slice(0, 3);
        setRelatedPosts(related);
      }
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The article you're looking for doesn't exist."}</p>
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = post.title;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blog
          </Link>

          <div className="mb-6">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <div>
                <p className="font-semibold text-gray-900">{post.author}</p>
                <p className="text-xs">{post.authorRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {post.readTime}
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {post.views} views
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Share Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share:
            </span>
            <button
              onClick={() => handleShare('twitter')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="p-2 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative"
              aria-label="Copy link"
            >
              <LinkIcon className="w-5 h-5" />
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1200x600?text=Blog+Image';
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <article className="markdown-content">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(post.content)
              }}
            />
          </article>

          <style jsx>{`
            .markdown-content {
              color: #374151;
              line-height: 1.8;
            }
            
            .markdown-content h1,
            .markdown-content h2,
            .markdown-content h3 {
              scroll-margin-top: 100px;
            }
            
            .markdown-content img {
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              margin: 2rem auto;
              max-width: 100%;
              height: auto;
            }
            
            .markdown-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 2rem 0;
            }
            
            .markdown-content table th,
            .markdown-content table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .markdown-content table th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #111827;
            }
            
            .markdown-content pre {
              position: relative;
            }
            
            .markdown-content pre code {
              display: block;
              overflow-x: auto;
            }
            
            .markdown-content :not(pre) > code {
              word-break: break-word;
            }
          `}</style>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/dashboard/blog/${relatedPost.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={relatedPost.imageUrl}
                    alt={relatedPost.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Blog+Image';
                    }}
                  />
                </div>
                <div className="p-5">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    {relatedPost.category}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
