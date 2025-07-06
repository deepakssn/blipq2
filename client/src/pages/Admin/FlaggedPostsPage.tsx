import React, { useEffect, useState } from 'react';
// import axiosInstance from '../../services/axiosInstance';

// Mock data for flagged posts
const mockFlaggedPosts = [
  {
    id: '101',
    postId: '3', // ID of the actual post
    title: 'Acoustic Guitar with Case - POTENTIALLY MISLEADING',
    reason: 'User reported misleading description.',
    reporter: 'user23@example.com',
    flaggedAt: new Date().toISOString(),
    postImageUrl: 'https://via.placeholder.com/100x70.png?text=Guitar',
    status: 'Pending Review',
  },
  {
    id: '102',
    postId: '7',
    title: 'Gardening Tool Set - INAPPROPRIATE CONTENT',
    reason: 'Contains offensive imagery in one of the pictures.',
    reporter: 'user55@school.edu',
    flaggedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    postImageUrl: 'https://via.placeholder.com/100x70.png?text=Tools',
    status: 'Pending Review',
  },
];

interface FlaggedPost {
  id: string;
  postId: string;
  title: string;
  reason: string;
  reporter: string;
  flaggedAt: string;
  postImageUrl?: string;
  status: 'Pending Review' | 'Resolved - Approved' | 'Resolved - Removed';
}

const FlaggedPostsPage: React.FC = () => {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlaggedPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // const response = await axiosInstance.get('/admin/flagged-posts');
        // setFlaggedPosts(response.data);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        setFlaggedPosts(mockFlaggedPosts);
      } catch (err) {
        setError('Failed to fetch flagged posts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlaggedPosts();
  }, []);

  const handleReviewAction = (flaggedPostId: string, action: 'approve' | 'remove_post' | 'dismiss_flag') => {
    console.log(`Action: ${action} on flagged post ID: ${flaggedPostId}`);
    // This would typically involve an API call to update the status of the flagged post and potentially the post itself.
    // For now, just updating local state as a mock.
    setFlaggedPosts(prevPosts =>
      prevPosts.map(fp =>
        fp.id === flaggedPostId
        ? { ...fp, status: action === 'approve' || action === 'dismiss_flag' ? 'Resolved - Approved' : 'Resolved - Removed' }
        : fp
      )
    );
  };

  if (loading) return <div className="text-center py-10">Loading flagged posts...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Review Flagged Posts</h1>
      {flaggedPosts.length === 0 ? (
        <p className="text-gray-600">No posts are currently flagged for review.</p>
      ) : (
        <div className="space-y-6">
          {flaggedPosts.map((post) => (
            <div key={post.id} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${post.status !== 'Pending Review' ? 'border-gray-300 opacity-70' : 'border-yellow-500'}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">{post.title}</h2>
                  <p className="text-sm text-gray-500 mb-1">Post ID: {post.postId} (Flag ID: {post.id})</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Flagged by: {post.reporter} on {new Date(post.flaggedAt).toLocaleString()}
                  </p>
                  <p className="text-gray-700 mb-3"><strong className="font-medium">Reason:</strong> {post.reason}</p>
                   <p className="text-sm font-semibold mb-3">Status: <span className={`${post.status === 'Pending Review' ? 'text-yellow-600' : 'text-green-600'}`}>{post.status}</span></p>
                </div>
                {post.postImageUrl && (
                    <img src={post.postImageUrl} alt="Post thumbnail" className="w-24 h-auto object-cover rounded-md sm:ml-4 mb-2 sm:mb-0"/>
                )}
              </div>
              {post.status === 'Pending Review' && (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleReviewAction(post.id, 'approve')}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                  >
                    Approve Post (Dismiss Flag)
                  </button>
                  <button
                    onClick={() => handleReviewAction(post.id, 'remove_post')}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
                  >
                    Remove Post
                  </button>
                   <button
                    onClick={() => handleReviewAction(post.id, 'dismiss_flag')} // Could be a different action like "Dismiss flag but keep post"
                    className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Dismiss Flag Only
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlaggedPostsPage;
