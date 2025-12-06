// API Service Module - Centralized API calls with error handling

const API_BASE = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw new Error(`Failed to fetch ${endpoint}: ${error.message}`);
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint);
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Specific API methods
  async getJobs() {
    const response = await this.get('/jobs');
    return response.jobs || response || [];
  }

  async submitCandidate(candidateData) {
    const response = await this.post('/public/candidates/register', candidateData);
    return response;
  }

  async getCandidates() {
    const response = await this.get('/candidates');
    return response.candidates || [];
  }

  async updateCandidate(id, data) {
    const response = await this.put(`/candidates/${id}`, data);
    return response;
  }

  async deleteCandidate(id) {
    const response = await this.delete(`/candidates/${id}`);
    return response;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;