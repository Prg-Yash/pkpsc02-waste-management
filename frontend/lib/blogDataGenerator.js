/**
 * Generate blog posts using real data from the database with mock content
 */
export async function generateBlogPosts(wasteData, leaderboardData, cityStats) {
  const blogPosts = [];

  try {
    // Extract real data for personalization
    const city = cityStats?.[0]?.city || "Your City";
    const topCollector = leaderboardData?.[0];
    const totalReports = wasteData?.length || 0;
    const collectedCount = wasteData?.filter(w => w.status === 'COLLECTED').length || 0;

    // Blog Type 1: Weekly Waste Trend Analysis
    blogPosts.push({
      id: `blog-${Date.now()}-trend`,
      slug: `waste-trend-${city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title: `This Week in ${city}'s Waste: Plastic Increased by 22%, E-Waste Dropped by 15% — Here's Why`,
      excerpt: `A detailed analysis of waste collection trends in ${city} reveals significant shifts in waste patterns. Plastic waste saw a 22% increase due to festival season, while e-waste collection dropped by 15% following successful awareness campaigns.`,
      content: `<h2>Understanding the Trends</h2>

<p>This week's waste data from ${city} tells an interesting story about our community's waste management patterns. Our analysis of ${totalReports} waste reports reveals some surprising trends that deserve attention.</p>

<h3>The Plastic Surge: What's Happening?</h3>

<p>Plastic waste increased by 22% this week, primarily driven by:</p>

<ul>
<li><strong>Festival Season Impact:</strong> Recent celebrations led to increased packaging waste from food deliveries and gift wrapping.</li>
<li><strong>Single-Use Containers:</strong> A spike in takeout orders contributed to more disposable container waste.</li>
<li><strong>Shopping Bags:</strong> Retail activity increased, resulting in more plastic bag usage.</li>
</ul>

<h3>E-Waste Success Story</h3>

<p>The 15% drop in e-waste is actually good news! Here's why:</p>

<ul>
<li><strong>Awareness Campaigns:</strong> Community workshops on e-waste recycling have been effective.</li>
<li><strong>Proper Disposal:</strong> More residents are using designated e-waste collection centers.</li>
<li><strong>Repair Culture:</strong> Growing trend of repairing electronics instead of disposing them.</li>
</ul>

<h3>What This Means for Our Community</h3>

<p>These trends highlight both challenges and opportunities. While plastic waste requires immediate attention, the success with e-waste management shows that community engagement works.</p>

<p>We encourage all residents to:</p>
<ul>
<li>Reduce plastic usage by carrying reusable bags and containers</li>
<li>Continue proper segregation of waste at home</li>
<li>Participate in weekly collection drives</li>
<li>Spread awareness about waste management in your neighborhood</li>
</ul>

<p>Together, we can make ${city} a model for sustainable waste management!</p>`,
      category: "Weekly Insights",
      tags: ["waste trends", "city data", "analytics", "sustainability"],
      author: {
        name: "EcoFlow Analytics",
        avatar: "https://ui-avatars.com/api/?name=EcoFlow+Analytics&background=10b981&color=fff"
      },
      publishedAt: new Date().toISOString(),
      views: Math.floor(Math.random() * 500) + 100,
      readTime: "5 min",
      featured: true,
      coverImage: `https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop`
    });

    // Blog Type 2: Top Collector Success Story
    const collectorName = topCollector?.name || "Anonymous Hero";
    const collectorPoints = topCollector?.totalPoints || 850;
    const estimatedKg = Math.round(collectorPoints / 10);

    blogPosts.push({
      id: `blog-${Date.now()}-collector`,
      slug: `collector-story-${collectorName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title: `How ${collectorName} Collected ${estimatedKg} kg of Recyclable Waste This Month — A Real Impact Story`,
      excerpt: `Meet ${collectorName}, our top waste collector this month who has made a remarkable difference by collecting ${estimatedKg} kilograms of waste, earning ${collectorPoints} points and inspiring the community.`,
      content: `<h2>A Community Hero Emerges</h2>

<p>In the heart of our waste management initiative, stories like ${collectorName}'s remind us why community participation matters. This month, ${collectorName} has collected an impressive ${estimatedKg} kilograms of recyclable waste, earning ${collectorPoints} points in the process.</p>

<h3>The Journey Begins</h3>

<p>"I started with just cleaning my neighborhood," ${collectorName} shares. "But seeing the impact motivated me to do more. Every piece of waste collected is a step toward a cleaner environment."</p>

<h3>By The Numbers</h3>

<ul>
<li><strong>Total Collections:</strong> ${Math.round(collectorPoints / 10)} successful pickups</li>
<li><strong>Waste Collected:</strong> ${estimatedKg} kg of recyclable materials</li>
<li><strong>CO₂ Saved:</strong> Approximately ${Math.round(estimatedKg * 0.5)} kg of carbon emissions prevented</li>
<li><strong>Points Earned:</strong> ${collectorPoints} EcoFlow points</li>
</ul>

<h3>What Drives the Passion?</h3>

<p>${collectorName} explains that the motivation comes from seeing real change. "When you clean a street and see families walking there safely, when you collect plastic that would have ended up in the ocean, you realize every effort counts."</p>

<h3>Tips from a Top Collector</h3>

<p>Want to make a similar impact? ${collectorName} shares these tips:</p>

<ol>
<li><strong>Start Small:</strong> Begin with your immediate surroundings - your street, your park.</li>
<li><strong>Stay Consistent:</strong> Regular small efforts beat sporadic large ones.</li>
<li><strong>Use the App:</strong> The EcoFlow app makes reporting and tracking incredibly easy.</li>
<li><strong>Engage Others:</strong> Share your journey on social media to inspire friends and family.</li>
<li><strong>Proper Segregation:</strong> Separate waste correctly to maximize recycling potential.</li>
</ol>

<h3>The Ripple Effect</h3>

<p>${collectorName}'s efforts have inspired 15 neighbors to join the waste collection initiative. "That's the real achievement," they say. "When one person starts, it creates a wave of change."</p>

<p>Join ${collectorName} and hundreds of others in making our city cleaner. Download the EcoFlow app today and start your journey!</p>`,
      category: "Success Stories",
      tags: ["collector stories", "community heroes", "impact", "inspiration"],
      author: {
        name: "EcoFlow Community",
        avatar: "https://ui-avatars.com/api/?name=EcoFlow+Community&background=3b82f6&color=fff"
      },
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      views: Math.floor(Math.random() * 800) + 200,
      readTime: "4 min",
      featured: true,
      coverImage: `https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&h=500&fit=crop`
    });

    // Blog Type 3: Waste Hotspots Report
    blogPosts.push({
      id: `blog-${Date.now()}-hotspots`,
      slug: `hotspots-${city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title: `⭐ Top 5 Waste Hotspots in ${city} This Week — And What Your Community Did About It`,
      excerpt: `Our weekly hotspot analysis identifies five critical areas requiring attention in ${city}. Thanks to community efforts, 3 out of 5 hotspots have seen significant improvements.`,
      content: `<h2>Mapping Our City's Waste Challenges</h2>

<p>Every week, our data analytics team identifies waste accumulation hotspots across ${city}. This week's analysis reveals both challenges and inspiring community responses.</p>

<h3>The Top 5 Hotspots</h3>

<h4>1. Market Street Junction (82 Reports)</h4>
<p><strong>Status:</strong> Improving ✅</p>
<p>The busiest commercial area saw 82 waste reports, primarily due to food vendors and shopping activity. Community response: Local merchants association organized daily cleanup drives, reducing waste by 40%.</p>

<h4>2. Riverside Park (65 Reports)</h4>
<p><strong>Status:</strong> Under Control ✅</p>
<p>Weekend visitors left behind plastic bottles and food packaging. Solution: 12 volunteers conducted a weekend cleanup, collecting 45kg of waste. New bins installed at strategic locations.</p>

<h4>3. Tech Hub Area (58 Reports)</h4>
<p><strong>Status:</strong> Needs Attention ⚠️</p>
<p>Office complexes generating lunch-time waste. Action needed: Working with building management to implement better waste segregation systems.</p>

<h4>4. Residential Complex - Green Meadows (47 Reports)</h4>
<p><strong>Status:</strong> Resolved ✅</p>
<p>Improper disposal near common areas. Solution: RWA implemented color-coded bins and educated 200+ residents about proper waste segregation.</p>

<h4>5. Old City Center (41 Reports)</h4>
<p><strong>Status:</strong> In Progress 🔄</p>
<p>Mix of residential and commercial waste. Plan: Municipal authorities scheduling special collection drives and deploying additional resources.</p>

<h3>Community Impact</h3>

<p>What makes these numbers meaningful is the community response:</p>

<ul>
<li><strong>127 Volunteers</strong> participated in cleanup drives this week</li>
<li><strong>${collectedCount} Collections</strong> completed successfully</li>
<li><strong>235 kg</strong> of waste diverted from landfills</li>
<li><strong>18 New Bins</strong> installed at strategic locations</li>
</ul>

<h3>How You Can Help</h3>

<p>Live near a hotspot? Here's how to contribute:</p>

<ol>
<li><strong>Report Issues:</strong> Use the EcoFlow app to report waste accumulation instantly</li>
<li><strong>Join Cleanups:</strong> Participate in weekend community cleanup drives</li>
<li><strong>Spread Awareness:</strong> Share hotspot information with neighbors</li>
<li><strong>Adopt a Spot:</strong> Take responsibility for keeping one area clean</li>
</ol>

<p>Together, we're not just cleaning ${city} - we're building a culture of environmental responsibility!</p>`,
      category: "City Reports",
      tags: ["hotspots", "city analysis", "community action", "cleanup"],
      author: {
        name: "EcoFlow Analytics",
        avatar: "https://ui-avatars.com/api/?name=EcoFlow+Analytics&background=10b981&color=fff"
      },
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      views: Math.floor(Math.random() * 600) + 150,
      readTime: "6 min",
      featured: false,
      coverImage: `https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=500&fit=crop`
    });

    // Blog Type 4: Community Impact Story
    blogPosts.push({
      id: `blog-${Date.now()}-impact`,
      slug: `community-impact-${Date.now()}`,
      title: `${city}'s Environmental Victory: How 500+ Citizens Prevented 2.5 Tons of CO₂ Emissions`,
      excerpt: `A month of collective action shows remarkable results: ${totalReports} waste reports, ${collectedCount} successful collections, and a measurable impact on our environment. Here's how our community is making history.`,
      content: `<h2>Measuring Real Impact</h2>

<p>Numbers tell powerful stories, and this month's environmental data from ${city} is truly inspiring. Our community has achieved something remarkable.</p>

<h3>The Impact Dashboard</h3>

<ul>
<li><strong>Total Waste Reports:</strong> ${totalReports} community reports filed</li>
<li><strong>Successful Collections:</strong> ${collectedCount} pickups completed (${Math.round((collectedCount / totalReports) * 100)}% success rate)</li>
<li><strong>Waste Diverted:</strong> Estimated ${totalReports * 5} kg kept out of landfills</li>
<li><strong>CO₂ Prevented:</strong> Approximately 2.5 tons of carbon emissions avoided</li>
<li><strong>Active Contributors:</strong> 500+ registered users making a difference</li>
</ul>

<h3>What These Numbers Mean</h3>

<p>2.5 tons of CO₂ prevented is equivalent to:</p>
<ul>
<li>Planting 115 trees and maintaining them for a year</li>
<li>Taking 5 cars off the road for a month</li>
<li>Powering 3 homes with clean energy for a year</li>
</ul>

<h3>Stories Behind Statistics</h3>

<p>Every number represents real people making real choices:</p>

<blockquote>
<p>"I started by reporting one plastic dump near my home. Now I check the app daily and have helped collect waste from 12 different locations. It's addictive in the best way!" - Priya M., Regular Contributor</p>
</blockquote>

<blockquote>
<p>"Seeing my neighborhood transform from a waste hotspot to a clean community space has been incredible. My kids now understand the importance of proper waste disposal." - Rajesh K., Area Coordinator</p>
</blockquote>

<h3>The Ripple Effect</h3>

<p>Our community's actions are inspiring neighboring areas:</p>

<ul>
<li>3 nearby localities have started similar initiatives</li>
<li>Local schools are incorporating EcoFlow into environmental education</li>
<li>Municipal authorities are using our data for better resource allocation</li>
<li>Media coverage is spreading awareness citywide</li>
</ul>

<h3>Looking Forward</h3>

<p>This is just the beginning. Our goals for next month:</p>

<ol>
<li><strong>Increase Participation:</strong> Reach 1,000 active users</li>
<li><strong>Improve Collection Rate:</strong> Achieve 95% success rate</li>
<li><strong>Expand Coverage:</strong> Include 5 more neighborhoods</li>
<li><strong>Educational Workshops:</strong> Conduct 10 community awareness sessions</li>
</ol>

<p>Every small action counts. Every report matters. Every collection makes a difference. Join us in writing ${city}'s environmental success story!</p>`,
      category: "Environmental Impact",
      tags: ["community", "impact", "sustainability", "achievements"],
      author: {
        name: "EcoFlow Team",
        avatar: "https://ui-avatars.com/api/?name=EcoFlow+Team&background=8b5cf6&color=fff"
      },
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      views: Math.floor(Math.random() * 700) + 250,
      readTime: "5 min",
      featured: false,
      coverImage: `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop`
    });

    // Blog Type 5: Environmental Tips
    blogPosts.push({
      id: `blog-${Date.now()}-tips`,
      slug: `reduce-plastic-tips-${Date.now()}`,
      title: `10 Simple Ways to Reduce Plastic Waste in Your Daily Life — Backed by ${city} Data`,
      excerpt: `Our data shows plastic waste is the #1 challenge in ${city}. Here are 10 practical, proven strategies that our top contributors use to minimize plastic usage and inspire others.`,
      content: `<h2>The Plastic Challenge</h2>

<p>Analysis of waste data from ${city} reveals that plastic waste accounts for over 40% of all reported waste. But here's the good news: our most successful community members have discovered simple ways to dramatically reduce their plastic footprint.</p>

<h3>10 Proven Strategies</h3>

<h4>1. Embrace Reusable Bags</h4>
<p>Keep 2-3 cloth bags in your car, office bag, and near your front door. Our data shows this simple habit can reduce your plastic bag usage by 95%.</p>

<h4>2. Invest in a Quality Water Bottle</h4>
<p>Single-use plastic bottles are a major contributor. A good reusable bottle pays for itself in savings within a month and eliminates roughly 150 plastic bottles per year.</p>

<h4>3. Say No to Plastic Straws</h4>
<p>Opt for steel, bamboo, or paper straws. Or better yet, skip the straw entirely. This tiny change makes a huge collective impact.</p>

<h4>4. Choose Loose Produce</h4>
<p>Skip the plastic bags in the produce section. Bring your own mesh bags or select unwrapped fruits and vegetables.</p>

<h4>5. Switch to Bar Soap</h4>
<p>Replace liquid soap in plastic bottles with traditional bar soap. Works for hand soap, body wash, and even shampoo bars.</p>

<h4>6. Buy in Bulk</h4>
<p>Purchase dry goods, grains, and spices from bulk sections using your own containers. Reduces packaging waste significantly.</p>

<h4>7. Pack Your Own Lunch</h4>
<p>Use reusable containers instead of plastic wrap or disposable containers. Save money and reduce waste simultaneously.</p>

<h4>8. Choose Cardboard Over Plastic</h4>
<p>When shopping online or in stores, opt for products in cardboard packaging. It's easier to recycle and biodegrades faster.</p>

<h4>9. Start Composting</h4>
<p>Reduce food waste and the need for plastic garbage bags by composting organic waste. Creates nutrient-rich soil for gardening too.</p>

<h4>10. Carry a Reusable Coffee Cup</h4>
<p>Many cafes offer discounts for bringing your own cup. Saves money and reduces plastic lid waste.</p>

<h3>The ${city} Success Story</h3>

<p>Community members who've implemented these strategies report:</p>

<ul>
<li>70-80% reduction in household plastic waste</li>
<li>Savings of ₹500-1000 per month</li>
<li>Inspiring an average of 3 family members or friends to join</li>
</ul>

<h3>Start Today</h3>

<p>You don't need to implement all 10 strategies at once. Start with 2-3 that fit your lifestyle, master them, then add more. Track your progress using the EcoFlow app and inspire others with your journey!</p>

<p>Remember: Small changes, multiplied by millions of people, create transformation.</p>`,
      category: "Eco Tips",
      tags: ["tips", "reduce waste", "sustainability", "plastic-free"],
      author: {
        name: "EcoFlow Educators",
        avatar: "https://ui-avatars.com/api/?name=EcoFlow+Educators&background=f59e0b&color=fff"
      },
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      views: Math.floor(Math.random() * 900) + 300,
      readTime: "7 min",
      featured: false,
      coverImage: `https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop`
    });

  } catch (error) {
    console.error("Error generating blog posts:", error);
  }

  return blogPosts;
}
