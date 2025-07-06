import React, { useEffect, useState } from 'react';
import Card from '../Card/Card'; // Assuming Card component is in components/Card/
// import axiosInstance from '../../services/axiosInstance'; // To be created for actual data fetching

// Mock data for initial display
const mockListings = [
  { id: '1', title: 'Vintage Bicycle in Great Condition', price: '$150', viewCount: 120, likeCount: 15, imageUrl: 'https://via.placeholder.com/300x200.png?text=Vintage+Bicycle' },
  { id: '2', title: 'Modern Sofa Set - Almost New', price: '$450', viewCount: 250, likeCount: 35, imageUrl: 'https://via.placeholder.com/300x200.png?text=Modern+Sofa' },
  { id: '3', title: 'Acoustic Guitar with Case', price: '$200', viewCount: 80, likeCount: 22, imageUrl: 'https://via.placeholder.com/300x200.png?text=Acoustic+Guitar' },
  { id: '4', title: 'Collection of Classic Novels', price: '$50', viewCount: 300, likeCount: 40, imageUrl: 'https://via.placeholder.com/300x200.png?text=Classic+Novels' },
  { id: '5', title: 'Laptop - 15 inch, 8GB RAM, 256GB SSD', price: '$600', viewCount: 180, likeCount: 28, imageUrl: 'https://via.placeholder.com/300x200.png?text=Laptop' },
  { id: '6', title: 'Designer Watch - Limited Edition', price: '$1200', viewCount: 95, likeCount: 12, imageUrl: 'https://via.placeholder.com/300x200.png?text=Designer+Watch' },
  { id: '7', title: 'Gardening Tool Set', price: '$75', viewCount: 110, likeCount: 18, imageUrl: 'https://via.placeholder.com/300x200.png?text=Gardening+Tools' },
  { id: '8', title: 'Professional Camera with Lenses', price: '$950', viewCount: 210, likeCount: 33, imageUrl: 'https://via.placeholder.com/300x200.png?text=Professional+Camera' },
];

interface Listing {
  id: string;
  title: string;
  price: string;
  viewCount: number;
  likeCount: number;
  imageUrl: string;
}

const ListingsGrid: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        // Replace with actual API call later:
        // const response = await axiosInstance.get('/posts');
        // setListings(response.data);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setListings(mockListings);
      } catch (err) {
        setError('Failed to fetch listings.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading listings...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (listings.length === 0) {
    return <div className="text-center py-10">No listings available at the moment.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center sm:text-left">Recent Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            id={listing.id} // Pass the id prop
            title={listing.title}
            price={listing.price}
            viewCount={listing.viewCount}
            likeCount={listing.likeCount}
            imageUrl={listing.imageUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default ListingsGrid;
