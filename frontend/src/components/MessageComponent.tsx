// @ts-nocheck
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, User, Bot } from 'lucide-react'
import { Message } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

interface MessageComponentProps {
  message: Message
}

export default function MessageComponent({ message }: MessageComponentProps) {
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`inline-block p-4 rounded-lg ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
          }`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      const code = String(children).replace(/\n$/, '')
                      
                      if (!inline && match) {
                        return (
                          <div className="relative">
                            <button
                              onClick={() => copyToClipboard(code)}
                              className="absolute top-2 right-2 p-1 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-md"
                              {...props}
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        )
                      }
                      
                      return (
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre({ children, ...props }) {
                      return (
                        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto" {...props}>
                          {children}
                        </pre>
                      )
                    },
                    blockquote({ children, ...props }) {
                      return (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic" {...props}>
                          {children}
                        </blockquote>
                      )
                    },
                    table({ children, ...props }) {
                      return (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                            {children}
                          </table>
                        </div>
                      )
                    },
                    th({ children, ...props }) {
                      return (
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold" {...props}>
                          {children}
                        </th>
                      )
                    },
                    td({ children, ...props }) {
                      return (
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" {...props}>
                          {children}
                        </td>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {formatRelativeTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}
