import React, { useState, useEffect } from 'react';
import GameScreen from './components/GameScreen';
import './App.css';

function App() {
  const [currentGameId, setCurrentGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化玩家ID
  useEffect(() => {
    // 從 localStorage 獲取或創建玩家ID
    let savedPlayerId = localStorage.getItem('rpg_player_id');
    
    if (!savedPlayerId) {
      // 生成新的玩家ID
      savedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rpg_player_id', savedPlayerId);
    }
    
    setPlayerId(savedPlayerId);

    // 獲取最後一個遊戲ID
    const lastGameId = localStorage.getItem('rpg_last_game_id');
    if (lastGameId) {
      setCurrentGameId(lastGameId);
    } else {
      // 如果沒有上次的遊戲，創建一個默認遊戲ID
      const defaultGameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentGameId(defaultGameId);
      localStorage.setItem('rpg_last_game_id', defaultGameId);
    }

    setIsInitialized(true);
  }, []);

  // 處理遊戲切換
  const handleGameChange = (newGameId) => {
    setCurrentGameId(newGameId);
    localStorage.setItem('rpg_last_game_id', newGameId);
  };

  // 如果還沒初始化完成，顯示載入畫面
  if (!isInitialized || !playerId || !currentGameId) {
    return (
      <div className="app-loading">
        <div className="loading-container">
          <div className="loading-logo">
            <span className="logo-icon">🎮</span>
            <span className="logo-text">文字RPG</span>
          </div>
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-message">正在初始化遊戲...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <GameScreen
        gameId={currentGameId}
        playerId={playerId}
        onGameChange={handleGameChange}
      />
    </div>
  );
}

export default App;