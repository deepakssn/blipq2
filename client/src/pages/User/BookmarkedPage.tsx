import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card'; // Reusing the Card component
// import { useAuth } from '../../contexts/AuthContext'; // To get user's bookmarked posts
// import axiosInstance from '../../services/axiosInstance'; // To fetch post details if only IDs are stored

// Mock data for bookmarked posts
const mockBookmarkedPosts = [
  { id: '2', title: 'Modern Sofa Set - Almost New', price: '$450', viewCount: 250, likeCount: 35, imageUrl: 'https://via.placeholder.com/300x200.png?text=Modern+Sofa' },
  { id: '5', title: 'Laptop - 15 inch, 8GB RAM, 256GB SSD', price: '$600', viewCount: 180, likeCount: 28, imageUrl: 'https://via.placeholder.com/300x200.png?text=Laptop' },
];

interface BookmarkedPost {
  id: string;
  title: string;
  price: string;
  viewCount: number;
  likeCount: number;
  imageUrl: string;
  // Add any other relevant fields that Card component might need or for display
}

const BookmarkedPage: React.FC = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { user } = useAuth(); // Assuming user object contains bookmarked post IDs or posts

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      setLoading(true);
      setError(null);
      // if (!user) {
      //   setError("You need to be logged in to see your bookmarks.");
      //   setLoading(false);
      //   return;
      // }
      try {
        // In a real app, you might fetch bookmarked post IDs from the user object or a dedicated endpoint
        // Then, if necessary, fetch details for each bookmarked post
        // For example:
        // const postIds = user.bookmarkedPostIds;
        // const postDetailsPromises = postIds.map(id => axiosInstance.get(`/posts/${id}`));
        // const responses = await Promise.all(postDetailsPromises);
        // setBookmarkedPosts(responses.map(res => res.data));

        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setBookmarkedPosts(mockBookmarkedPosts);
      } catch (err) {
        setError('Failed to fetch bookmarked posts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedPosts();
  }, []); // Add 'user' to dependency array if using actual user data

  if (loading) {
    return <div className="text-center py-10">Loading your bookmarked posts...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Bookmarked Posts</h1>
      {bookmarkedPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p>You haven't bookmarked any posts yet.</p>
          {/* Optional: Link to browse listings */}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bookmarkedPosts.map((post) => (
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

export default BookmarkedPage;
