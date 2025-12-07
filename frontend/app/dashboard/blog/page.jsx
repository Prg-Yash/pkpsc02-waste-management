'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Search, Sparkles, Eye } from 'lucide-react';
import { generateBlogPosts } from '@/lib/blogDataGenerator';

// Store generated posts in localStorage for access by detail page
function cacheBlogPosts(posts) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('generatedBlogPosts', JSON.stringify(posts));
  }
}

export function getCachedBlogPosts() {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('generatedBlogPosts');
    return cached ? JSON.parse(cached) : [];
  }
  return [];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Generate blog posts from real data
  useEffect(() => {
    generateBlogContent();
  }, []);

  const generateBlogContent = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from your database
      const [wasteResponse, leaderboardResponse] = await Promise.all([
        fetch(`${API_URL}/api/waste`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }),
        fetch(`${API_URL}/api/leaderboard`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        })
      ]);

      let wasteData = [];
      let leaderboardData = [];
      let cityStats = [];

      // Parse waste data
      if (wasteResponse.ok) {
        const wasteResult = await wasteResponse.json();
        wasteData = wasteResult.wasteReports || wasteResult.reports || [];
        
        // Generate city stats from waste data
        cityStats = wasteData.reduce((acc, report) => {
          const existing = acc.find(s => 
            s.city === report.location?.split(',')[0] && 
            s.wasteType === report.wasteType
          );
          if (existing) {
            existing.count++;
          } else {
            acc.push({
              city: report.location?.split(',')[0] || 'Unknown',
              wasteType: report.wasteType || 'MIXED',
              count: 1
            });
          }
          return acc;
        }, []);
      }

      // Parse leaderboard data
      if (leaderboardResponse.ok) {
        const leaderboardResult = await leaderboardResponse.json();
        leaderboardData = leaderboardResult.leaderboard || [];
      }

      // Generate AI-powered blog posts
      const generatedPosts = await generateBlogPosts(wasteData, leaderboardData, cityStats);
      
      if (generatedPosts && generatedPosts.length > 0) {
        setPosts(generatedPosts);
        cacheBlogPosts(generatedPosts); // Cache for detail page
        
        // Extract unique categories
        const uniqueCategories = [...new Set(generatedPosts.map(p => p.category))];
        setCategories(['All', ...uniqueCategories]);
      } else {
        setError('No blog content could be generated. Please check your Gemini API key.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error generating blog content:', err);
      setError(err.message || 'Failed to generate blog content');
      setLoading(false);
    }
  };

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get latest 2 posts for featured section
  const latestPosts = posts.filter(p => p.featured).slice(0, 2);
  const regularPosts = posts.filter(p => !p.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Blogs</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={generateBlogContent}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Waste Management{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Expert insights, practical tips, and the latest news on sustainable waste management and environmental conservation.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Latest Posts Section (Instead of Featured) */}
        {selectedCategory === 'All' && searchQuery === '' && latestPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Latest Blogs</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x500?text=Blog+Image';
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Latest
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 flex-wrap">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views} views
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">By {post.author?.name || post.author}</span>
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        Read More
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {searchQuery || selectedCategory !== 'All' ? 'Search Results' : 'All Articles'}
          </h2>
          {filteredPosts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Blog+Image';
                      }}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 flex-wrap">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{post.author?.name || post.author}</span>
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        Read
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
