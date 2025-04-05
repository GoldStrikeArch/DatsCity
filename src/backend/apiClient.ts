import axios, { AxiosInstance } from 'axios';
import { CONFIG } from './config';
import type { model_PlayerExtendedWordsResponse } from './generated/models/model_PlayerExtendedWordsResponse';
import type { model_PlayerBuildRequest } from './generated/models/model_PlayerBuildRequest';
import type { model_PlayerWordsResponse } from './generated/models/model_PlayerWordsResponse';

/**
 * Custom API client that ensures the token is properly set
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: CONFIG.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': CONFIG.TOKEN
      }
    });

    // Log configuration
    console.log(`API Client initialized with base URL: ${CONFIG.BASE_URL}`);
    console.log(`Using token: ${CONFIG.TOKEN}`);
  }

  /**
   * Get words from the API
   */
  async getWords(): Promise<model_PlayerExtendedWordsResponse> {
    try {
      console.log('Fetching words from API...');
      const response = await this.axiosInstance.get('/api/words');
      return response.data;
    } catch (error) {
      console.error('Failed to get words:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Build a tower
   */
  async buildTower(request: model_PlayerBuildRequest): Promise<model_PlayerWordsResponse> {
    try {
      console.log('Sending build request to API...');
      console.log(`Request contains ${request.words?.length || 0} words`);

      // Log the complete request payload
      console.log('Complete API request payload:');
      console.log(JSON.stringify(request, null, 2));

      const response = await this.axiosInstance.post('/api/build', request);
      console.log('Build request successful!');
      return response.data;
    } catch (error) {
      console.error('Failed to build tower:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));

        // If there's a specific error about a word being out of bounds
        if (error.response.data && error.response.data.message) {
          if (error.response.data.message.includes('out of bounds')) {
            console.error('Word placement error detected. Check word lengths and positions.');
            
            // Extract word ID and details from error message if possible
            const errorMessage = error.response.data.message;
            const wordMatch = errorMessage.match(/word "([^"]+)" \(id:(\d+)\)/);
            const coordsMatch = errorMessage.match(/head:\[([^\]]+)\] tail: \[([^\]]+)\]/);
            
            if (wordMatch && coordsMatch) {
              const [_, wordText, wordId] = wordMatch;
              const headCoords = coordsMatch[1].split(' ').map(Number);
              const tailCoords = coordsMatch[2].split(' ').map(Number);
              
              console.error(`Problem word: "${wordText}" (ID: ${wordId})`);
              console.error(`Head coordinates: [${headCoords.join(', ')}]`);
              console.error(`Tail coordinates: [${tailCoords.join(', ')}]`);
              console.error(`Word length: ${wordText.length}`);
              
              // Find the word in the request to see how it was sent
              const problemWord = request.words?.find(w => w.id === Number(wordId));
              if (problemWord) {
                console.error('This word was sent as:', JSON.stringify(problemWord, null, 2));
              }
            }
          }
        }
      }
      throw error;
    }
  }

  /**
   * Shuffle words
   */
  async shuffleWords(): Promise<model_PlayerWordsResponse> {
    try {
      console.log('Shuffling words...');
      const response = await this.axiosInstance.post('/api/shuffle');
      return response.data;
    } catch (error) {
      console.error('Failed to shuffle words:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}
