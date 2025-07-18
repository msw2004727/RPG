import React, { useState, useRef, useEffect } from 'react';
import './InputBox.css';

const InputBox = ({ onSendMessage, isLoading, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // 自動調整高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // 處理發送訊息
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || disabled) {
      return;
    }

    const messageToSend = message.trim();
    setMessage('');
    onSendMessage(messageToSend);
    
    // 重置高度
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  // 處理鍵盤事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 處理輸入變化
  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  // 快速動作按鈕
  const quickActions = [
    { text: '查看周圍', icon: '👀' },
    { text: '檢查背包', icon: '🎒' },
    { text: '查看狀態', icon: '📊' },
    { text: '休息', icon: '😴' }
  ];

  const handleQuickAction = (action) => {
    if (isLoading || disabled) return;
    onSendMessage(action.text);
  };

  return (
    <div className="input-box-container">
      {/* 快速動作按鈕 */}
      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action)}
            disabled={isLoading || disabled}
            title={action.text}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-text">{action.text}</span>
          </button>
        ))}
      </div>

      {/* 輸入框 */}
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "AI 正在回應中..." : "輸入你的動作... (Enter 發送，Shift+Enter 換行)"}
            disabled={isLoading || disabled}
            className="message-input"
            rows={1}
          />
          
          <button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className="send-button"
            title="發送訊息"
          >
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* 字數統計 */}
        <div className="input-info">
          <span className="char-count">
            {message.length}/500
          </span>
          {message.length > 400 && (
            <span className="char-warning">
              建議保持簡潔以獲得更好的回應
            </span>
          )}
        </div>
      </form>

      {/* 提示信息 */}
      {disabled && (
        <div className="input-disabled-message">
          <span className="warning-icon">⚠️</span>
          遊戲連接中斷，請檢查網路連接
        </div>
      )}
    </div>
  );
};

export default InputBox;