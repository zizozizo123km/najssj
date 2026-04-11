import axios from 'axios';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchShortVideos = async (query: string = 'shorts') => {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key is missing.');
    throw new Error('YouTube API key is missing.');
  }

  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        type: 'video',
        videoEmbeddable: 'true',
        q: query,
        maxResults: 10,
      },
    });
    console.log('YouTube API Response:', response.data);
    return response.data.items;
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
};
