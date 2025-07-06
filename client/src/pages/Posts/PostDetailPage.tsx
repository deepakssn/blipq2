import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
// import axiosInstance from '../../services/axiosInstance'; // To be created
// import { useAuth } from '../../contexts/AuthContext'; // If needed for like/bookmark

// Mock data for a single post
const mockPost = {
  id: '1',
  title: 'Vintage Bicycle in Great Condition - Only $150!',
  price: '$150',
  description: 'This is a beautifully maintained vintage bicycle, perfect for city cruising or as a collector item. It has been recently serviced and rides smoothly. Original parts, classic bell, and a comfortable leather seat. Minor wear and tear consistent with its age, but overall in fantastic shape. A true gem for any bike enthusiast!',
  images: [
    'https://via.placeholder.com/600x400.png?text=Bike+Image+1',
    'https://via.placeholder.com/600x400.png?text=Bike+Image+2',
    'https://via.placeholder.com/600x400.png?text=Bike+Image+3',
  ],
  seller: { name: 'John Doe', contact: 'johndoe@example.com' }, // Or just sellerId to fetch details
  postedDate: '2024-07-01',
  viewCount: 155,
  likeCount: 25,
  location: 'New York, NY',
  category: 'Vehicles',
  isOrgOnly: false, // Example field for Org Only/Global filter
};

interface Post {
  id: string;
  title: string;
  price: string;
  description: string;
  images: string[];
  seller: { name: string; contact: string };
  postedDate: string;
  viewCount: number;
  likeCount: number;
  location: string;
  category: string;
  isOrgOnly: boolean;
}

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const { user } = useAuth(); // For like/bookmark functionality

  useEffect(() => {
    // Simulate API call to fetch post details
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with actual API call:
        // const response = await axiosInstance.get(`/posts/${postId}`);
        // setPost(response.data);
        // setSelectedImage(response.data.images[0] || null);

        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        if (postId === mockPost.id) {
          setPost(mockPost);
          setSelectedImage(mockPost.images[0] || null);
        } else {
          setError('Post not found.');
        }
      } catch (err) {
        setError('Failed to fetch post details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Placeholder for like/bookmark actions
  const handleLike = () => console.log('Like action triggered');
  const handleBookmark = () => console.log('Bookmark action triggered');

  if (loading) return <div className="text-center py-10">Loading post details...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!post) return <div className="text-center py-10">Post not found.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Image Gallery */}
          <div className="md:w-1/2 p-4">
            <img
              src={selectedImage || post.images[0]}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-md mb-4"
            />
            {post.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {post.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${post.title} thumbnail ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${selectedImage === img ? 'border-blue-500' : 'border-transparent hover:border-gray-400'}`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Post Info */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">{post.title}</h1>
              <p className="text-3xl font-semibold text-blue-600 mb-4">{post.price}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>Posted on: {new Date(post.postedDate).toLocaleDateString()}</span>
                <span>Category: {post.category}</span>
                <span>Location: {post.location}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.description}</p>
              </div>

              <div className="flex items-center space-x-6 text-gray-600 mb-6">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  {post.viewCount} views
                </span>
                <span className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                  {post.likeCount} likes
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Seller Information</h3>
                <p className="text-gray-700">Name: {post.seller.name}</p>
                <p className="text-gray-700">Contact: <a href={`mailto:${post.seller.contact}`} className="text-blue-500 hover:underline">{post.seller.contact}</a></p>
              </div>
            </div>

            <div className="flex space-x-3 mt-auto">
              <Button onClick={handleLike} variant="primary" className="flex-1">
                Like Post
              </Button>
              <Button onClick={handleBookmark} variant="secondary" className="flex-1">
                Bookmark
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Listings</Link>
      </div>
    </div>
  );
};

export default PostDetailPage;
