import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, User, Bot } from 'lucide-react'
import { Message } from '../../../shared/types'
import { formatRelativeTime } from '@/lib/utils'

interface MessageComponentProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp?: string;
  };
  isStreaming?: boolean;
}

export default function MessageComponent({ message, isStreaming = false }: MessageComponentProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const isUser = message.role === 'user'

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`rounded-lg p-3 max-w-[80%] ${
        message.role === 'user' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
      }`}>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {message.role === 'user' ? 'Bạn' : 'Assistant'}
          {message.timestamp && ` • ${formatRelativeTime(message.timestamp)}`}
        </div>
        <div className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
}
