import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TopBar from "./TopBar.jsx";
import "./ChatBot.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI teaching assistant.\n\nI can help you find qualified candidates for law courses. Simply tell me the course name (e.g., 'Cyber Law', 'Constitutional Law', 'Contract Law') and I'll search through all applicant resumes to find potential instructors.\n\nWhat course are you looking to fill?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState({}); // Store messages for each chat
  const [activeChat, setActiveChat] = useState(null);
  const [nextChatId, setNextChatId] = useState(1);
  const [isNewUnsavedChat, setIsNewUnsavedChat] = useState(true); // Track if current chat is unsaved
  const [isTyping, setIsTyping] = useState(false); // Track if AI is typing
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const messageContent = inputValue;
    setInputValue("");

    // If this is a new unsaved chat, save it to history now
    if (isNewUnsavedChat) {
      const newChatId = nextChatId;
      const newChat = {
        id: newChatId,
        title: messageContent.substring(0, 50),
        preview: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
        time: "Just now",
        timestamp: new Date(),
      };
      
      setChatHistory([newChat, ...chatHistory]);
      setActiveChat(newChatId);
      setNextChatId(nextChatId + 1);
      setIsNewUnsavedChat(false);
      
      // Capture the chat ID for the async response
      const chatIdForResponse = newChatId;

      // Show typing indicator
      setIsTyping(true);
      
      // Call AI search API
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${API_URL}/api/ai-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course: messageContent,
            description: ''
          })
        });

        const data = await response.json();
        setIsTyping(false);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to search candidates');
        }

        // Format AI response with candidate list (updated with new fields)
        let aiContent = '';
        if (data.candidates && data.candidates.length > 0) {
          aiContent = `Found ${data.totalFound} candidate(s) who could teach "${data.course}":\n\n`;
          
          data.candidates.forEach((candidate, idx) => {
            aiContent += `${idx + 1}. **${candidate.name}** (${candidate.email || 'N/A'})\n`;
            if (candidate.lawSchool) {
              aiContent += `   🎓 Law School: ${candidate.lawSchool}\n`;
            }
            if (candidate.note) {
              aiContent += `   Note: ${candidate.note}\n`;
            }
            aiContent += `   Confidence: ${candidate.confidence || 'N/A'}/5\n`;
            aiContent += `   Reasoning: ${candidate.reasoning}\n`;
            if (candidate.evidence && candidate.evidence.length > 0) {
              aiContent += `   Evidence: "${candidate.evidence.join('", "')}"\n`;
            }
            if (candidate.source && candidate.source.length > 0) {
              aiContent += `   Source: ${candidate.source.join(', ')}\n`;
            }
            if (candidate.resumeFile) {
              aiContent += `   📄 [View Resume](${candidate.resumeFile})\n`;
            }
            aiContent += `\n`;
          });
          
          aiContent += `\nSearched ${data.searchedApplicants} applicant(s) in total.`;
        } else {
          aiContent = `No candidates found for "${data.course}". This could mean:\n- No applicants have submitted resumes yet\n- No applicants match this course topic\n\nTry a different course name or broader topic.`;
        }

        const aiMessage = {
          id: updatedMessages.length + 1,
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
          candidates: data.candidates || []
        };
        const finalMessages = [...updatedMessages, aiMessage];
        
        // Update messages and chatMessages using the captured chat ID
        setChatMessages(prev => {
          const newChatMessages = {
            ...prev,
            [chatIdForResponse]: finalMessages,
          };
          return newChatMessages;
        });
        
        // Only update visible messages if this chat is still active
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === chatIdForResponse) {
            setMessages(finalMessages);
          }
          return currentActiveChat;
        });
      } catch (error) {
        setIsTyping(false);
        console.error('AI search error:', error);
        
        const errorMessage = {
          id: updatedMessages.length + 1,
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}\n\nPlease make sure the backend server is running and try again.`,
          timestamp: new Date(),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        
        setChatMessages(prev => ({
          ...prev,
          [chatIdForResponse]: finalMessages,
        }));
        
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === chatIdForResponse) {
            setMessages(finalMessages);
          }
          return currentActiveChat;
        });
      }
    } else {
      // Update existing chat - capture the current active chat ID
      const chatIdForMessage = activeChat;
      
      setChatMessages(prev => ({
        ...prev,
        [chatIdForMessage]: updatedMessages,
      }));
      
      // Show typing indicator
      setIsTyping(true);
      
      // Call AI search API
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const response = await fetch(`${API_URL}/api/ai-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course: messageContent,
            description: ''
          })
        });

        const data = await response.json();
        setIsTyping(false);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to search candidates');
        }

        // Format AI response with candidate list (updated with new fields)
        let aiContent = '';
        if (data.candidates && data.candidates.length > 0) {
          aiContent = `Found ${data.totalFound} candidate(s) who could teach "${data.course}":\n\n`;
          
          data.candidates.forEach((candidate, idx) => {
            aiContent += `${idx + 1}. **${candidate.name}** (${candidate.email || 'N/A'})\n`;
            if (candidate.lawSchool) {
              aiContent += `   🎓 Law School: ${candidate.lawSchool}\n`;
            }
            if (candidate.note) {
              aiContent += `   Note: ${candidate.note}\n`;
            }
            aiContent += `   Confidence: ${candidate.confidence || 'N/A'}/5\n`;
            aiContent += `   Reasoning: ${candidate.reasoning}\n`;
            if (candidate.evidence && candidate.evidence.length > 0) {
              aiContent += `   Evidence: "${candidate.evidence.join('", "')}"\n`;
            }
            if (candidate.source && candidate.source.length > 0) {
              aiContent += `   Source: ${candidate.source.join(', ')}\n`;
            }
            if (candidate.resumeFile) {
              aiContent += `   📄 [View Resume](${candidate.resumeFile})\n`;
            }
            aiContent += `\n`;
          });
          
          aiContent += `\nSearched ${data.searchedApplicants} applicant(s) in total.`;
        } else {
          aiContent = `No candidates found for "${data.course}". This could mean:\n- No applicants have submitted resumes yet\n- No applicants match this course topic\n\nTry a different course name or broader topic.`;
        }

        const aiMessage = {
          id: updatedMessages.length + 1,
          role: "assistant",
          content: aiContent,
          timestamp: new Date(),
          candidates: data.candidates || []
        };
        const finalMessages = [...updatedMessages, aiMessage];
        
        // Save to the specific chat ID that sent the message
        setChatMessages(prev => ({
          ...prev,
          [chatIdForMessage]: finalMessages,
        }));
        
        // Only update visible messages if that chat is still active
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === chatIdForMessage) {
            setMessages(finalMessages);
          }
          return currentActiveChat;
        });
      } catch (error) {
        setIsTyping(false);
        console.error('AI search error:', error);
        
        const errorMessage = {
          id: updatedMessages.length + 1,
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}\n\nPlease make sure the backend server is running and try again.`,
          timestamp: new Date(),
        };
        const finalMessages = [...updatedMessages, errorMessage];
        
        setChatMessages(prev => ({
          ...prev,
          [chatIdForMessage]: finalMessages,
        }));
        
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === chatIdForMessage) {
            setMessages(finalMessages);
          }
          return currentActiveChat;
        });
      }
    }
  };

  const handleNewChat = () => {
    // Simply reset to a fresh chat state (unsaved until first message)
    const initialMessages = [
      {
        id: 1,
        role: "assistant",
        content: "Hello! I'm your AI teaching assistant.\n\nI can help you find qualified candidates for law courses. Simply tell me the course name (e.g., 'Cyber Law', 'Constitutional Law', 'Contract Law') and I'll search through all applicant resumes to find potential instructors.\n\nWhat course are you looking to fill?",
        timestamp: new Date(),
      },
    ];
    
    setMessages(initialMessages);
    setActiveChat(null);
    setIsNewUnsavedChat(true);
  };

  const handleChatSelect = (chatId) => {
    // Load messages for selected chat
    setActiveChat(chatId);
    setIsNewUnsavedChat(false);
    
    const loadedMessages = chatMessages[chatId] || [
      {
        id: 1,
        role: "assistant",
        content: "Hello! I'm your AI teaching assistant.\n\nI can help you find qualified candidates for law courses. Simply tell me the course name (e.g., 'Cyber Law', 'Constitutional Law', 'Contract Law') and I'll search through all applicant resumes to find potential instructors.\n\nWhat course are you looking to fill?",
        timestamp: new Date(),
      },
    ];
    setMessages(loadedMessages);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <TopBar />
      <div className="chatbot-container">
        {/* Sidebar */}
        <aside className="chatbot-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="brand-text">
              <div className="brand-title">TAMU Law School</div>
              <div className="brand-subtitle">Cyber Law Assistant</div>
            </div>
          </div>
        </div>

        <button className="btn-new-chat" onClick={handleNewChat}>
          <span className="btn-icon">+</span> New Chat
        </button>

        <div className="chat-history">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className={`chat-history-item ${activeChat === chat.id ? "active" : ""}`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <div className="chat-history-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="chat-history-content">
                <div className="chat-history-title">{chat.title}</div>
                <div className="chat-history-preview">{chat.preview}</div>
                <div className="chat-history-time">{chat.time}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="footer-text">
            Texas A&M University School of Law
          </div>
          <div className="footer-version">Cyber Law Assistant v1.0</div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chatbot-main">
        <div className="chat-header">
          <div className="chat-header-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
          <div className="chat-header-text">
            <div className="chat-header-title">TAMU Law Cyber Assistant</div>
            <div className="chat-header-subtitle">
              Texas A&M University School of Law
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === "user" ? "message-user" : "message-assistant"}`}
            >
              <div className="message-icon">
                {message.role === "assistant" ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                )}
              </div>
              <div className="message-content">
                <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                  <ReactMarkdown
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{color: '#500000', textDecoration: 'underline'}} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="message message-assistant">
              <div className="message-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div className="message-content">
                <div className="message-text typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputValue.trim()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
    </>
  );
}
