'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Search, Tag, TrendingUp } from 'lucide-react';

// Sample blog data - In production, this would come from a database/API
const BLOG_POSTS = [
  {
    id: 1,
    slug: 'plastic-waste-recycling-guide',
    title: 'Complete Guide to Plastic Waste Recycling',
    excerpt: 'Learn everything about plastic waste recycling, from identification to proper disposal methods. Discover which plastics can be recycled and how to make a difference.',
    content: '',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop',
    author: 'Sarah Johnson',
    date: '2024-12-05',
    readTime: '8 min read',
    category: 'Recycling',
    tags: ['plastic', 'recycling', 'sustainability'],
    featured: true,
  },
  {
    id: 2,
    slug: 'organic-waste-composting',
    title: 'Home Composting: Turn Kitchen Waste into Garden Gold',
    excerpt: 'A comprehensive guide to starting your own composting system at home. Reduce waste and create nutrient-rich soil for your garden.',
    content: '',
    image: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&h=500&fit=crop',
    author: 'Michael Chen',
    date: '2024-12-03',
    readTime: '6 min read',
    category: 'Composting',
    tags: ['organic', 'composting', 'gardening'],
    featured: true,
  },
  {
    id: 3,
    slug: 'e-waste-environmental-impact',
    title: 'The Hidden Environmental Cost of E-Waste',
    excerpt: 'Electronic waste is growing faster than any other waste stream. Understand the impact and learn how to dispose of electronics responsibly.',
    content: '',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=500&fit=crop',
    author: 'Dr. Emily Rodriguez',
    date: '2024-12-01',
    readTime: '10 min read',
    category: 'E-Waste',
    tags: ['e-waste', 'electronics', 'environment'],
    featured: false,
  },
  {
    id: 4,
    slug: 'zero-waste-lifestyle-tips',
    title: '10 Easy Steps to Start Your Zero Waste Journey',
    excerpt: 'Practical tips and strategies to reduce your household waste to near zero. Small changes that make a big environmental impact.',
    content: '',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop',
    author: 'Lisa Anderson',
    date: '2024-11-28',
    readTime: '7 min read',
    category: 'Lifestyle',
    tags: ['zero-waste', 'lifestyle', 'tips'],
    featured: false,
  },
  {
    id: 5,
    slug: 'hazardous-waste-disposal',
    title: 'Safe Disposal of Hazardous Household Waste',
    excerpt: 'Batteries, paints, chemicals - learn how to identify and safely dispose of hazardous materials from your home.',
    content: '',
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&h=500&fit=crop',
    author: 'David Kumar',
    date: '2024-11-25',
    readTime: '5 min read',
    category: 'Safety',
    tags: ['hazardous', 'safety', 'disposal'],
    featured: false,
  },
  {
    id: 6,
    slug: 'community-recycling-programs',
    title: 'Building Community Recycling Programs That Work',
    excerpt: 'Success stories and strategies for implementing effective recycling programs in your neighborhood or workplace.',
    content: '',
    image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&h=500&fit=crop',
    author: 'Maria Santos',
    date: '2024-11-22',
    readTime: '9 min read',
    category: 'Community',
    tags: ['community', 'programs', 'recycling'],
    featured: false,
  },
];

const CATEGORIES = ['All', 'Recycling', 'Composting', 'E-Waste', 'Lifestyle', 'Safety', 'Community'];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = BLOG_POSTS.filter(post => post.featured);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Waste Management{' '}
              <span className="bg-linear-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
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
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-md'
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
        {/* Featured Posts */}
        {selectedCategory === 'All' && searchQuery === '' && featuredPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">By {post.author}</span>
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
            {searchQuery || selectedCategory !== 'All' ? 'Search Results' : 'Latest Articles'}
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
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{post.author}</span>
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
