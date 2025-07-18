import React, { useState } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import SaveManager from './SaveManager';
import useGameState from '../hooks/useGameState';
import useAutoSummary from '../hooks/useAutoSummary';
import './GameScreen.css';

const GameScreen = ({ gameId, playerId, onGameChange }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    gameState,
    isConnected,
    sendMessageToClaude,
    updateGameState
  } = useGameState(gameId, playerId);

  const {
    summaryStatus,
    generateSummary,
    getSummaryStats,
    estimateTokens,
    SUMMARY_THRESHOLD,
    TOKEN_THRESHOLD
  } = useAutoSummary(gameState, updateGameState);

  // 處理發送訊息
  const handleSendMessage = async (message) => {
    if (isProcessing || !message.trim()) return;

    setIsProcessing(true);
    try {
      await sendMessageToClaude(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理遊戲載入
  const handleGameLoad = (newGameId) => {
    onGameChange(newGameId);
  };

  // 處理新遊戲
  const handleNewGame = (newGameId) => {
    onGameChange(newGameId);
  };

  // 獲取當前統計
  const stats = getSummaryStats();
  const estimatedTokens = estimateTokens();

  return (
    <div className="game-screen">
      {/* 遊戲狀態欄 */}
      <div className="status-bar">
        <div className="game-info">
          <div className="current-location">
            <span className="location-icon">📍</span>
            <span className="location-text">
              {gameState.currentState?.location || '未知位置'}
            </span>
          </div>
          
          {gameState.currentState?.stats && (
            <div className="player-stats">
              <div className="stat-item health">
                <span className="stat-icon">❤️</span>
                <span className="stat-value">{gameState.currentState.stats.health}</span>
              </div>
              <div className="stat-item mana">
                <span className="stat-icon">💙</span>
                <span className="stat-value">{gameState.currentState.stats.mana}</span>
              </div>
              {gameState.currentState.inventory?.length > 0 && (
                <div className="stat-item inventory">
                  <span className="stat-icon">🎒</span>
                  <span className="stat-value">{gameState.currentState.inventory.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="technical-info">
          <div className="token-info">
            <span className="token-count">
              {estimatedTokens} tokens
            </span>
            {estimatedTokens > TOKEN_THRESHOLD * 0.8 && (
              <span className="token-warning">⚠️</span>
            )}
          </div>
          
          <div className="message-count">
            {stats.totalMessages} 條訊息
          </div>

          {summaryStatus.isGenerating && (
            <div className="summary-progress">
              <span className="progress-icon">📖</span>
              <span className="progress-text">生成摘要中...</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${summaryStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要遊戲區域 */}
      <div className="game-main">
        <MessageList
          messages={gameState.messageHistory || []}
          summaries={gameState.summaries || []}
          isLoading={isProcessing}
        />
        
        <InputBox
          onSendMessage={handleSendMessage}
          isLoading={isProcessing}
          disabled={!isConnected}
        />
      </div>

      {/* 遊戲管理 */}
      <SaveManager
        currentGameId={gameId}
        playerId={playerId}
        gameState={gameState}
        onGameLoad={handleGameLoad}
        onNewGame={handleNewGame}
        isConnected={isConnected}
      />

      {/* 摘要控制面板 */}
      <div className="summary-panel">
        <button
          className="summary-btn"
          onClick={generateSummary}
          disabled={summaryStatus.isGenerating || stats.totalMessages < 5}
          title="手動生成摘要"
        >
          <span className="summary-icon">📖</span>
          <span className="summary-text">
            {summaryStatus.isGenerating ? '生成中...' : '生成摘要'}
          </span>
        </button>
        
        <div className="summary-stats">
          <div className="summary-count">
            已生成 {stats.summaryCount} 個摘要
          </div>
          {stats.needsSummary && (
            <div className="summary-recommendation">
              建議生成新摘要
            </div>
          )}
        </div>
      </div>

      {/* 連接狀態提示 */}
      {!isConnected && (
        <div className="connection-alert">
          <div className="alert-content">
            <span className="alert-icon">🔗</span>
            <span className="alert-text">連接中斷，正在重新連接...</span>
          </div>
        </div>
      )}

      {/* 載入遮罩 */}
      {gameState.isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
            </div>
            <div className="loading-text">載入遊戲中...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;