import { useState, useEffect, useCallback } from 'react';
import apiService from '../utils/api';

const useAutoSummary = (gameState, updateGameState) => {
  const [summaryStatus, setSummaryStatus] = useState({
    isGenerating: false,
    progress: 0,
    lastSummaryAt: null,
    messagesSinceLastSummary: 0
  });

  const SUMMARY_THRESHOLD = 30; // 每 30 條訊息自動摘要
  const TOKEN_THRESHOLD = 8000; // Token 接近限制時強制摘要

  // 計算當前訊息數量
  const getMessageCount = useCallback(() => {
    return gameState.messageHistory?.length || 0;
  }, [gameState.messageHistory]);

  // 計算預估 Token 數量
  const estimateTokens = useCallback(() => {
    if (!gameState.messageHistory) return 0;
    
    const totalChars = gameState.messageHistory.reduce((sum, msg) => {
      return sum + (msg.content?.length || 0);
    }, 0);
    
    // 粗略估算：4個字符 ≈ 1個 Token
    return Math.ceil(totalChars / 4);
  }, [gameState.messageHistory]);

  // 生成摘要
  const generateSummary = useCallback(async (forceGenerate = false) => {
    if (summaryStatus.isGenerating) return;

    const messageCount = getMessageCount();
    const tokenCount = estimateTokens();
    
    // 檢查是否需要生成摘要
    if (!forceGenerate && messageCount < SUMMARY_THRESHOLD && tokenCount < TOKEN_THRESHOLD) {
      return;
    }

    setSummaryStatus(prev => ({ 
      ...prev, 
      isGenerating: true, 
      progress: 0 
    }));

    try {
      // 獲取需要摘要的訊息
      const lastSummaryIndex = gameState.summaries?.length 
        ? gameState.summaries[gameState.summaries.length - 1].messageRange.end 
        : 0;

      const messagesToSummarize = gameState.messageHistory.slice(lastSummaryIndex);
      
      if (messagesToSummarize.length === 0) {
        setSummaryStatus(prev => ({ ...prev, isGenerating: false }));
        return;
      }

      setSummaryStatus(prev => ({ ...prev, progress: 30 }));

      // 呼叫後端生成摘要
      const response = await apiService.generateSummary(
        gameState.gameId,
        messagesToSummarize,
        gameState.currentState
      );

      setSummaryStatus(prev => ({ ...prev, progress: 70 }));

      // 創建新的摘要物件
      const newSummary = {
        id: `summary-${Date.now()}`,
        content: response.summary,
        messageRange: {
          start: lastSummaryIndex,
          end: gameState.messageHistory.length
        },
        timestamp: new Date().toISOString(),
        tokensSaved: tokenCount
      };

      // 更新遊戲狀態
      const newSummaries = [...(gameState.summaries || []), newSummary];
      
      await updateGameState({
        summaries: newSummaries
      });

      setSummaryStatus(prev => ({ 
        ...prev, 
        isGenerating: false, 
        progress: 100,
        lastSummaryAt: new Date().toISOString(),
        messagesSinceLastSummary: 0
      }));

      // 3秒後重置進度
      setTimeout(() => {
        setSummaryStatus(prev => ({ ...prev, progress: 0 }));
      }, 3000);

    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummaryStatus(prev => ({ 
        ...prev, 
        isGenerating: false, 
        progress: 0 
      }));
    }
  }, [gameState, updateGameState, summaryStatus.isGenerating, getMessageCount, estimateTokens]);

  // 監控訊息數量變化
  useEffect(() => {
    const messageCount = getMessageCount();
    const tokenCount = estimateTokens();
    
    // 更新狀態
    setSummaryStatus(prev => ({
      ...prev,
      messagesSinceLastSummary: messageCount - (prev.lastSummaryAt ? 
        gameState.summaries?.[gameState.summaries.length - 1]?.messageRange.end || 0 : 0)
    }));

    // 自動檢查是否需要摘要
    if (messageCount > 0 && (messageCount % SUMMARY_THRESHOLD === 0 || tokenCount > TOKEN_THRESHOLD)) {
      generateSummary();
    }
  }, [gameState.messageHistory, generateSummary, getMessageCount, estimateTokens]);

  // 手動觸發摘要
  const triggerSummary = useCallback(() => {
    generateSummary(true);
  }, [generateSummary]);

  // 獲取摘要統計
  const getSummaryStats = useCallback(() => {
    const messageCount = getMessageCount();
    const tokenCount = estimateTokens();
    const summaryCount = gameState.summaries?.length || 0;
    
    return {
      totalMessages: messageCount,
      estimatedTokens: tokenCount,
      summaryCount,
      messagesSinceLastSummary: summaryStatus.messagesSinceLastSummary,
      needsSummary: messageCount >= SUMMARY_THRESHOLD || tokenCount >= TOKEN_THRESHOLD
    };
  }, [gameState.summaries, summaryStatus.messagesSinceLastSummary, getMessageCount, estimateTokens]);

  // 清理舊訊息（保留摘要）
  const cleanupOldMessages = useCallback(async () => {
    if (!gameState.summaries || gameState.summaries.length === 0) return;

    const lastSummary = gameState.summaries[gameState.summaries.length - 1];
    const messagesToKeep = gameState.messageHistory.slice(lastSummary.messageRange.end);
    
    await updateGameState({
      messageHistory: messagesToKeep
    });
  }, [gameState.summaries, gameState.messageHistory, updateGameState]);

  return {
    summaryStatus,
    generateSummary: triggerSummary,
    getSummaryStats,
    cleanupOldMessages,
    estimateTokens,
    SUMMARY_THRESHOLD,
    TOKEN_THRESHOLD
  };
};

export default useAutoSummary;