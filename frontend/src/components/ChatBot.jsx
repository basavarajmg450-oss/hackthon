import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/axiosConfig';
import {
    MessageCircle,
    Send,
    User,
    Bot,
    Loader,
    RefreshCw,
    BookOpen,
    MapPin,
    Calendar,
    Users
} from 'lucide-react';

const ChatBot = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initialize with welcome message
        setMessages([
            {
                id: 'welcome',
                type: 'bot',
                content: `Hello ${user.full_name}! 👋 I'm your AI Campus Helper. I can assist you with:

• Course information and schedules
• Campus navigation and facilities  
• Academic support and FAQ
• Event information
• Study group recommendations
• General campus life questions

How can I help you today?`,
                timestamp: new Date()
            }
        ]);

        // Generate session ID
        setSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }, [user.full_name]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim() || loading) return;

        const userMessage = {
            id: `msg_${Date.now()}`,
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            const response = await axios.post('/chat', {
                message: userMessage.content,
                session_id: sessionId
            });

            const botMessage = {
                id: `bot_${Date.now()}`,
                type: 'bot',
                content: response.data.response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);

            // Update session ID if provided
            if (response.data.session_id) {
                setSessionId(response.data.session_id);
            }
        } catch (error) {
            const errorMessage = {
                id: `error_${Date.now()}`,
                type: 'bot',
                content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
            console.error('Chat error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: 'welcome_new',
                type: 'bot',
                content: `Chat cleared! How can I help you today, ${user.full_name}?`,
                timestamp: new Date()
            }
        ]);
        setSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    };

    const quickQuestions = [
        {
            icon: BookOpen,
            text: "What courses are available this semester?",
            color: "bg-blue-100 text-blue-700 hover:bg-blue-200"
        },
        {
            icon: MapPin,
            text: "Where is the library located?",
            color: "bg-green-100 text-green-700 hover:bg-green-200"
        },
        {
            icon: Calendar,
            text: "What events are happening this week?",
            color: "bg-purple-100 text-purple-700 hover:bg-purple-200"
        },
        {
            icon: Users,
            text: "How do I join a study group?",
            color: "bg-orange-100 text-orange-700 hover:bg-orange-200"
        }
    ];

    const handleQuickQuestion = (question) => {
        setInputMessage(question);
    };

    return (
        <div className="min-h-screen p-4 lg:p-8" data-testid="chat-page">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-600 rounded-full flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">AI Campus Helper</h1>
                                <p className="text-gray-600">Powered by Gemini AI • Always here to help</p>
                            </div>
                        </div>

                        <button
                            onClick={handleClearChat}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            data-testid="clear-chat-button"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:inline">Clear Chat</span>
                        </button>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="bg-white rounded-xl shadow-lg flex flex-col h-96 lg:h-[600px]" data-testid="chat-container">
                    {/* Messages Area */}
                    <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4" data-testid="messages-area">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                    }`}
                                data-testid={`message-${message.type}-${message.id}`}
                            >
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                                        ? 'bg-indigo-600'
                                        : message.isError
                                            ? 'bg-red-500'
                                            : 'bg-teal-500'
                                    }`}>
                                    {message.type === 'user' ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${message.type === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : message.isError
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    <div className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">
                                        {message.content}
                                    </div>
                                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                                        }`}>
                                        {message.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex items-start space-x-3" data-testid="loading-indicator">
                                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Loader className="w-4 h-4 animate-spin text-gray-500" />
                                        <span className="text-gray-600 text-sm">AI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length === 1 && (
                        <div className="px-4 lg:px-6 py-4 border-t border-gray-100" data-testid="quick-questions">
                            <p className="text-gray-600 text-sm mb-3 font-medium">Quick questions to get you started:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickQuestion(question.text)}
                                        className={`flex items-center space-x-2 p-3 rounded-lg text-sm text-left transition-colors duration-200 ${question.color}`}
                                        data-testid={`quick-question-${index}`}
                                    >
                                        <question.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="line-clamp-2">{question.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 lg:p-6 border-t border-gray-100" data-testid="input-area">
                        <form onSubmit={handleSendMessage} className="flex space-x-3">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask me anything about campus life..."
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                                disabled={loading}
                                data-testid="chat-input"
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputMessage.trim()}
                                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                data-testid="send-message-button"
                            >
                                {loading ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Powered by Gemini AI • Responses may vary in accuracy
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;