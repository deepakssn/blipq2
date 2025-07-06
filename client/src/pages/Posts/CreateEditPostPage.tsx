import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Textarea from '../../components/common/Textarea'; // Will create this component
// import axiosInstance from '../../services/axiosInstance';
// import { useAuth } from '../../contexts/AuthContext';

interface PostFormState {
  title: string;
  price: string;
  description: string;
  category: string;
  location: string;
  images: File[]; // For file uploads
  imagePreviews: string[];
  isOrgOnly: boolean;
}

const CreateEditPostPage: React.FC = () => {
  const { postId } = useParams<{ postId?: string }>();
  const navigate = useNavigate();
  // const { user } = useAuth(); // Ensure user is logged in
  const isEditMode = Boolean(postId);

  const [formState, setFormState] = useState<PostFormState>({
    title: '',
    price: '',
    description: '',
    category: '',
    location: '',
    images: [],
    imagePreviews: [],
    isOrgOnly: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && postId) {
      setLoading(true);
      // Fetch existing post data if in edit mode
      // axiosInstance.get(`/posts/${postId}`)
      //   .then(response => {
      //     const post = response.data;
      //     setFormState({
      //       title: post.title,
      //       price: post.price.toString(), // ensure string
      //       description: post.description,
      //       category: post.category,
      //       location: post.location,
      //       images: [], // Existing images handled separately or re-uploaded
      //       imagePreviews: post.imageUrls || [], // Assuming imageUrls is part of post data
      //       isOrgOnly: post.isOrgOnly || false,
      //     });
      //   })
      //   .catch(err => setError('Failed to load post data.'))
      //   .finally(() => setLoading(false));
      console.log(`Edit mode for post ${postId}. Placeholder for fetching data.`);
      // Mock data for edit mode for now
      setFormState({
        title: 'Sample Post Title for Editing',
        price: '100.00',
        description: 'This is a sample description that would be loaded from the backend.',
        category: 'Electronics',
        location: 'San Francisco, CA',
        images: [],
        imagePreviews: ['https://via.placeholder.com/150?text=Existing+Image+1'],
        isOrgOnly: false,
      });
      setLoading(false);
    }
  }, [postId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormState(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormState(prev => ({
        ...prev,
        images: [...prev.images, ...filesArray],
        imagePreviews: [
          ...prev.imagePreviews,
          ...filesArray.map(file => URL.createObjectURL(file))
        ],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('title', formState.title);
    formData.append('price', formState.price);
    formData.append('description', formState.description);
    formData.append('category', formState.category);
    formData.append('location', formState.location);
    formData.append('isOrgOnly', String(formState.isOrgOnly));
    formState.images.forEach(image => {
      formData.append('images', image);
    });

    try {
      // if (isEditMode) {
      //   await axiosInstance.put(`/posts/${postId}`, formData);
      //   setSuccessMessage('Post updated successfully!');
      // } else {
      //   await axiosInstance.post('/posts', formData);
      //   setSuccessMessage('Post created successfully! You will be redirected shortly.');
      // }
      console.log('Form submitted (mock):', Object.fromEntries(formData.entries()));
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccessMessage(isEditMode ? 'Post updated successfully! (Mock)' : 'Post created successfully! (Mock)');

      setTimeout(() => {
        navigate(isEditMode ? `/post/${postId}` : '/'); // Redirect to post or homepage
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock categories - in a real app, this might come from an API
  const categories = ["Electronics", "Furniture", "Vehicles", "Clothing", "Books", "Other"];

  if (loading && isEditMode && !formState.title) { // Initial loading for edit mode
    return <div className="text-center py-10">Loading post data...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          {isEditMode ? 'Edit Post' : 'Create New Post'}
        </h1>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</p>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <Input
            label="Title"
            name="title"
            value={formState.title}
            onChange={handleChange}
            maxLength={100}
            required
          />
          <Input
            label="Price ($)"
            name="price"
            type="number"
            step="0.01"
            value={formState.price}
            onChange={handleChange}
            required
          />
          {/* Textarea component needs to be created */}
          <Textarea
            label="Description"
            name="description"
            value={formState.description}
            onChange={handleChange}
            rows={6}
            required
          />
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
                name="category"
                id="category"
                value={formState.category}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
            >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <Input
            label="Location (e.g., City, State)"
            name="location"
            value={formState.location}
            onChange={handleChange}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Images (Max 5)</label>
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={formState.imagePreviews.length >= 5}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {formState.imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative">
                  <img src={previewUrl} alt={`Preview ${index}`} className="h-24 w-24 object-cover rounded"/>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs leading-none"
                    aria-label="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
             {formState.imagePreviews.length >= 5 && <p className="text-xs text-red-500 mt-1">Maximum 5 images allowed.</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="isOrgOnly" className="flex items-center">
              <input
                type="checkbox"
                id="isOrgOnly"
                name="isOrgOnly"
                checked={formState.isOrgOnly}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">This post is for my organization only</span>
            </label>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? (isEditMode ? 'Updating Post...' : 'Creating Post...') : (isEditMode ? 'Update Post' : 'Create Post')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateEditPostPage;
