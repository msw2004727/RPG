const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 發送訊息到 Claude API
  async sendMessage(gameId, message, gameContext) {
    return this.request('/api/claude/message', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        message,
        gameContext
      })
    });
  }

  // 生成摘要
  async generateSummary(gameId, messages, gameState) {
    return this.request('/api/summary/generate', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        messages,
        gameState
      })
    });
  }

  // 載入遊戲狀態
  async loadGameState(gameId) {
    return this.request(`/api/game/${gameId}`, {
      method: 'GET'
    });
  }

  // 保存遊戲狀態
  async saveGameState(gameId, gameState) {
    return this.request(`/api/game/${gameId}`, {
      method: 'POST',
      body: JSON.stringify(gameState)
    });
  }

  // 獲取遊戲列表
  async getGameList(playerId) {
    return this.request(`/api/game/list/${playerId}`, {
      method: 'GET'
    });
  }

  // 創建新遊戲
  async createGame(playerId, gameConfig) {
    return this.request('/api/game/create', {
      method: 'POST',
      body: JSON.stringify({
        playerId,
        ...gameConfig
      })
    });
  }

  // 刪除遊戲
  async deleteGame(gameId) {
    return this.request(`/api/game/${gameId}`, {
      method: 'DELETE'
    });
  }
}

export default new ApiService();