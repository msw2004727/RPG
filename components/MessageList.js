import React, { useEffect, useRef } from 'react';
import './MessageList.css';

const MessageList = ({ messages, summaries, isLoading }) => {
  const messagesEndRef = useRef(null);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 格式化時間
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染訊息
  const renderMessage = (message, index) => {
    const messageClass = `message ${message.type}`;
    
    return (
      <div key={message.id || index} className={messageClass}>
        <div className="message-content">
          {message.content}
        </div>
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    );
  };

  // 渲染摘要
  const renderSummary = (summary, index) => {
    return (
      <div key={summary.id || index} className="message summary">
        <div className="summary-header">
          <span className="summary-icon">📖</span>
          <span className="summary-title">劇情摘要</span>
          <span className="summary-range">
            (訊息 {summary.messageRange.start + 1} - {summary.messageRange.end})
          </span>
        </div>
        <div className="summary-content">
          {summary.content}
        </div>
        <div className="summary-time">
          {formatTime(summary.timestamp)}
        </div>
      </div>
    );
  };

  // 合併並排序訊息和摘要
  const getAllItems = () => {
    const items = [];
    
    // 添加所有訊息
    messages.forEach((message, index) => {
      items.push({
        type: 'message',
        data: message,
        index: index,
        timestamp: message.timestamp
      });
    });

    // 添加所有摘要
    summaries.forEach((summary, index) => {
      items.push({
        type: 'summary',
        data: summary,
        index: index,
        timestamp: summary.timestamp
      });
    });

    // 按時間排序
    return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const allItems = getAllItems();

  return (
    <div className="message-list">
      <div className="messages-container">
        {allItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <div className="empty-text">準備開始你的冒險...</div>
          </div>
        ) : (
          allItems.map((item, index) => {
            if (item.type === 'message') {
              return renderMessage(item.data, item.index);
            } else {
              return renderSummary(item.data, item.index);
            }
          })
        )}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;