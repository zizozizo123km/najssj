import axios from 'axios';
import { getApiKey } from '../lib/apiKeys';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchShortVideos = async (query: string = 'shorts') => {
  try {
    const apiKey = await getApiKey('youtube', 'api_key');
    if (!apiKey) {
      console.error('YouTube API key is missing.');
      throw new Error('YouTube API key is missing.');
    }

    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        key: apiKey,
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
