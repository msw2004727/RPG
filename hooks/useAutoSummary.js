import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import apiService from '../utils/api';

const useGameState = (gameId, playerId) => {
  const [gameState, setGameState] = useState({
    gameId: null,
    playerId: null,
    currentState: {
      scene: '',
      inventory: [],
      stats: { health: 100, mana: 50 },
      location: ''
    },
    messageHistory: [],
    summaries: [],
    isLoading: false,
    lastSaved: null
  });

  const [isConnected, setIsConnected] = useState(false);

  // 初始化遊戲狀態
  const initializeGame = useCallback(async () => {
    if (!gameId || !playerId) return;

    setGameState(prev => ({ ...prev, isLoading: true }));

    try {
      // 先嘗試從 Firebase 載入
      const docRef = doc(db, 'games', gameId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(prev => ({
          ...prev,
          ...data,
          isLoading: false
        }));
      } else {
        // 如果不存在，創建新遊戲
        const newGameState = {
          gameId,
          playerId,
          currentState: {
            scene: '你站在一個神秘的十字路口，四周迷霧繚繞...',
            inventory: [],
            stats: { health: 100, mana: 50 },
            location: '神秘十字路口'
          },
          messageHistory: [
            {
              id: 'welcome',
              type: 'system',
              content: '歡迎來到文字RPG世界！請輸入你的第一個動作。',
              timestamp: new Date().toISOString()
            }
          ],
          summaries: [],
          createdAt: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        };

        await setDoc(docRef, newGameState);
        setGameState(prev => ({ ...prev, ...newGameState, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, [gameId, playerId]);

  // 監聽 Firebase 變更
  useEffect(() => {
    if (!gameId) return;

    const docRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(prev => ({
          ...prev,
          ...data,
          isLoading: false
        }));
        setIsConnected(true);
      }
    }, (error) => {
      console.error('Firebase connection error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  // 保存遊戲狀態
  const saveGameState = useCallback(async (newState) => {
    if (!gameId) return;

    try {
      const docRef = doc(db, 'games', gameId);
      const stateToSave = {
        ...newState,
        lastSaved: new Date().toISOString()
      };

      await setDoc(docRef, stateToSave, { merge: true });
      
      // 同時保存到後端
      await apiService.saveGameState(gameId, stateToSave);
      
      setGameState(prev => ({ ...prev, ...stateToSave }));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }, [gameId]);

  // 添加訊息
  const addMessage = useCallback(async (message) => {
    const newMessage = {
      id: Date.now().toString(),
      type: message.type || 'user',
      content: message.content,
      timestamp: new Date().toISOString()
    };

    const newMessageHistory = [...gameState.messageHistory, newMessage];
    
    await saveGameState({
      ...gameState,
      messageHistory: newMessageHistory
    });

    return newMessage;
  }, [gameState, saveGameState]);

  // 更新遊戲狀態
  const updateGameState = useCallback(async (updates) => {
    const newState = {
      ...gameState,
      ...updates
    };

    await saveGameState(newState);
  }, [gameState, saveGameState]);

  // 發送訊息到 Claude
  const sendMessageToClaude = useCallback(async (userMessage) => {
    try {
      // 先添加用戶訊息
      await addMessage({ type: 'user', content: userMessage });

      // 發送到 Claude API
      const response = await apiService.sendMessage(
        gameId,
        userMessage,
        gameState.currentState
      );

      // 添加 AI 回應
      await addMessage({ type: 'ai', content: response.content });

      // 更新遊戲狀態（如果有變化）
      if (response.gameState) {
        await updateGameState({
          currentState: response.gameState
        });
      }

      return response;
    } catch (error) {
      console.error('Failed to send message to Claude:', error);
      await addMessage({ 
        type: 'system', 
        content: '抱歉，發生了錯誤。請稍後再試。' 
      });
      throw error;
    }
  }, [gameId, gameState, addMessage, updateGameState]);

  // 初始化
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return {
    gameState,
    isConnected,
    saveGameState,
    addMessage,
    updateGameState,
    sendMessageToClaude,
    initializeGame
  };
};

export default useGameState;