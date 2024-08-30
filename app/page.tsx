'use client';

import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import Calendar from './components/calendar/Calendar';
import './components/ChatInterface.css';
import './components/CodeBlock.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ChatMessage {
  role: 'USER' | 'CHATBOT';
  message: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [date, setDate] = useState<Value>(new Date());
  const [interimTranscript, setInterimTranscript] = useState('');

  const handleNewMessage = async (message: string) => {
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatHistory }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      setMessages(prev => [...prev, { text: '', isUser: false }]);

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        fullResponse += text;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }

      // Update chat history
      setChatHistory(prev => [
        ...prev,
        { role: 'USER', message },
        { role: 'CHATBOT', message: fullResponse }
      ]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: "Sorry, an error occurred.", isUser: false }]);
    }
  };

  const handleInterimTranscript = (transcript: string) => {
    setInterimTranscript(transcript);
  };

  return (
    <main className="flex min-h-screen p-4">
      <div className="flex-grow mr-4">
        <h1 className="text-4xl font-bold mb-8">Personal AI Assistant</h1>
        <ChatInterface 
          messages={messages} 
          onNewMessage={handleNewMessage} 
          interimTranscript={interimTranscript}
        />
        <VoiceInterface 
          onNewMessage={handleNewMessage} 
          onInterimTranscript={handleInterimTranscript}
        />
      </div>
      <Calendar />
    </main>
  );
}
