import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card'; // Reusing the Card component
// import { useAuth } from '../../contexts/AuthContext'; // To get user's liked posts
// import axiosInstance from '../../services/axiosInstance'; // To fetch post details if only IDs are stored

// Mock data for liked posts
const mockLikedPostsData = [
  { id: '1', title: 'Vintage Bicycle in Great Condition', price: '$150', viewCount: 120, likeCount: 15, imageUrl: 'https://via.placeholder.com/300x200.png?text=Vintage+Bicycle' },
  { id: '4', title: 'Collection of Classic Novels', price: '$50', viewCount: 300, likeCount: 40, imageUrl: 'https://via.placeholder.com/300x200.png?text=Classic+Novels' },
];

interface LikedPost {
  id: string;
  title: string;
  price: string;
  viewCount: number;
  likeCount: number;
  imageUrl: string;
}

const LikedPostsPage: React.FC = () => {
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { user } = useAuth();

  useEffect(() => {
    const fetchLikedPosts = async () => {
      setLoading(true);
      setError(null);
      // if (!user) {
      //   setError("You need to be logged in to see posts you've liked.");
      //   setLoading(false);
      //   return;
      // }
      try {
        // Similar to bookmarks, fetch liked post IDs and then their details
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setLikedPosts(mockLikedPostsData);
      } catch (err) {
        setError('Failed to fetch liked posts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, []); // Add 'user' to dependency array

  if (loading) {
    return <div className="text-center py-10">Loading posts you've liked...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Posts You've Liked</h1>
      {likedPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p>You haven't liked any posts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {likedPosts.map((post) => (
            <Card
              key={post.id}
              id={post.id}
              title={post.title}
              price={post.price}
              viewCount={post.viewCount}
              likeCount={post.likeCount}
              imageUrl={post.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedPostsPage;
