import React from 'react';
import ChatButton from './ChatButton';
import ChatInterface from './ChatInterface';
import { ChatProvider } from '../../store/chat/ChatContext';

const ChatContainer: React.FC = () => {
  return (
    <ChatProvider>
      <ChatButton />
      <ChatInterface />
    </ChatProvider>
  );
};

export default ChatContainer;
