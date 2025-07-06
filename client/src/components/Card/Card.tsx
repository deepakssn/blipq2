import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  id: string; // Added id for linking
  imageUrl: string;
  title: string;
  price: string; // Or number, depending on how price is handled
  viewCount: number;
  likeCount: number;
}

const Card: React.FC<CardProps> = ({ id, imageUrl, title, price, viewCount, likeCount }) => {
  // Stop propagation for interactive elements like like button if the whole card is a link
  const handleInteractiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent link navigation if the button itself does something else
    // Add like functionality here if needed directly
    // console.log('Like button clicked on card', id); // Removed console.log
  };

  return (
    <Link to={`/post/${id}`} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out group">
      <div className="relative">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover"/>
        {/* Optional: Overlay or quick action buttons can go here */}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 truncate group-hover:text-blue-600 transition-colors" title={title}>{title}</h3>
        <p className="text-gray-700 font-bold text-xl mb-2">{price}</p>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{viewCount} views</span>
          <button
            onClick={handleInteractiveClick}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-500 z-10 relative p-1 -m-1" // Relative and z-index to ensure it's clickable over Link
            aria-label="Like post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default Card;
