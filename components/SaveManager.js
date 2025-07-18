import React, { useState, useEffect } from 'react';
import apiService from '../utils/api';
import './SaveManager.css';

const SaveManager = ({ 
  currentGameId, 
  playerId, 
  gameState, 
  onGameLoad, 
  onNewGame,
  isConnected 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // 載入遊戲列表
  const loadGameList = async () => {
    if (!playerId) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.getGameList(playerId);
      setGames(response.games || []);
    } catch (error) {
      console.error('Failed to load game list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 打開面板時載入遊戲列表
  useEffect(() => {
    if (isOpen) {
      loadGameList();
    }
  }, [isOpen, playerId]);

  // 監聽遊戲狀態變化，更新最後保存時間
  useEffect(() => {
    if (gameState?.lastSaved) {
      setLastSaveTime(gameState.lastSaved);
    }
  }, [gameState?.lastSaved]);

  // 創建新遊戲
  const handleNewGame = async () => {
    const gameName = prompt('請輸入新遊戲名稱：');
    if (!gameName || !gameName.trim()) return;

    try {
      const response = await apiService.createGame(playerId, {
        name: gameName.trim(),
        description: '新的冒險即將開始...'
      });
      
      onNewGame(response.gameId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create new game:', error);
      alert('創建遊戲失敗，請稍後再試');
    }
  };

  // 載入遊戲
  const handleLoadGame = async (gameId) => {
    try {
      onGameLoad(gameId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to load game:', error);
      alert('載入遊戲失敗，請稍後再試');
    }
  };

  // 刪除遊戲
  const handleDeleteGame = async (gameId, gameName) => {
    if (!window.confirm(`確定要刪除遊戲「${gameName}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      await apiService.deleteGame(gameId);
      await loadGameList(); // 重新載入列表
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('刪除遊戲失敗，請稍後再試');
    }
  };

  // 格式化時間
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知時間';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return '剛才';
    if (diffMinutes < 60) return `${diffMinutes}分鐘前`;
    if (diffHours < 24) return `${diffHours}小時前`;
    
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 獲取遊戲統計
  const getGameStats = (game) => {
    const messageCount = game.messageHistory?.length || 0;
    const summaryCount = game.summaries?.length || 0;
    const location = game.currentState?.location || '未知位置';
    
    return { messageCount, summaryCount, location };
  };

  return (
    <div className="save-manager">
      {/* 觸發按鈕 */}
      <button 
        className={`save-trigger-btn ${!isConnected ? 'disconnected' : ''}`}
        onClick={() => setIsOpen(true)}
        title="遊戲管理"
      >
        <span className="save-icon">💾</span>
        <span className="connection-indicator">
          {isConnected ? '🟢' : '🔴'}
        </span>
      </button>

      {/* 最後保存時間提示 */}
      {lastSaveTime && (
        <div className="last-save-indicator">
          <span className="save-status">✓</span>
          <span className="save-time">{formatTime(lastSaveTime)}</span>
        </div>
      )}

      {/* 管理面板 */}
      {isOpen && (
        <div className="save-overlay" onClick={() => setIsOpen(false)}>
          <div className="save-panel" onClick={(e) => e.stopPropagation()}>
            {/* 標題列 */}
            <div className="panel-header">
              <h3>遊戲管理</h3>
              <button 
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* 操作按鈕 */}
            <div className="panel-actions">
              <button 
                className="action-btn new-game"
                onClick={handleNewGame}
              >
                <span>🎮</span>
                新遊戲
              </button>
              <button 
                className="action-btn refresh"
                onClick={loadGameList}
                disabled={isLoading}
              >
                <span>🔄</span>
                重新整理
              </button>
            </div>

            {/* 遊戲列表 */}
            <div className="games-list">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner">載入中...</div>
                </div>
              ) : games.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <div className="empty-text">還沒有任何遊戲</div>
                  <div className="empty-subtitle">點擊「新遊戲」開始你的冒險</div>
                </div>
              ) : (
                games.map((game) => {
                  const stats = getGameStats(game);
                  const isCurrentGame = game.gameId === currentGameId;
                  
                  return (
                    <div 
                      key={game.gameId} 
                      className={`game-item ${isCurrentGame ? 'current' : ''}`}
                    >
                      <div className="game-main" onClick={() => handleLoadGame(game.gameId)}>
                        <div className="game-info">
                          <div className="game-name">
                            {game.name || '無名冒險'}
                            {isCurrentGame && <span className="current-badge">目前</span>}
                          </div>
                          <div className="game-location">📍 {stats.location}</div>
                          <div className="game-stats">
                            <span className="stat">💬 {stats.messageCount}</span>
                            <span className="stat">📖 {stats.summaryCount}</span>
                            <span className="stat">⏰ {formatTime(game.lastSaved)}</span>
                          </div>
                        </div>
                        <div className="game-actions">
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGame(game.gameId, game.name);
                            }}
                            title="刪除遊戲"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 面板底部信息 */}
            <div className="panel-footer">
              <div className="connection-status">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '🟢 已連接' : '🔴 連接中斷'}
                </span>
              </div>
              <div className="game-count">
                共 {games.length} 個遊戲
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveManager;