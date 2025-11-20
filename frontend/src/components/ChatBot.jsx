import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TopBar from "./TopBar.jsx";
import { API_URL } from "../utils/auth.js";
import "./ChatBot.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI hiring assistant.\n\nI can help you find qualified candidates for law courses. You can either:\n1. **Select a course** from the dropdown menu below\n2. **Type freely** to search for candidates by topic or skills\n\nWhat course are you looking to fill?",
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
  const [courses, setCourses] = useState([]); // All available courses
  const [selectedCourse, setSelectedCourse] = useState(null); // Currently selected course
  const [courseSearchTerm, setCourseSearchTerm] = useState(""); // Search term for filtering courses
  const [showCourseDropdown, setShowCourseDropdown] = useState(false); // Show/hide dropdown
  const messagesEndRef = useRef(null);
  const courseDropdownRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all chat sessions from database on mount
  useEffect(() => {
    loadChatHistory();
    loadCourses();
  }, []);

  // Load courses from API
  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Handle clicking outside course dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target)) {
        setShowCourseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat-sessions`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const loadedSessions = data.sessions.map(s => ({
          id: s.session_id,
          title: s.title,
          preview: s.title.substring(0, 50),
          time: formatTime(s.updated_at),
          timestamp: new Date(s.updated_at),
          createdBy: s.created_by_name || s.created_by_email,
          messageCount: s.message_count
        }));
        setChatHistory(loadedSessions);
        if (loadedSessions.length > 0) {
          setNextChatId(Math.max(...loadedSessions.map(s => s.id)) + 1);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const saveMessageToDb = async (sessionId, role, content) => {
    try {
      await fetch(`${API_URL}/api/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role, content })
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat-sessions/${chatId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setChatHistory(chatHistory.filter(c => c.id !== chatId));
        delete chatMessages[chatId];
        if (activeChat === chatId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setCourseSearchTerm(`${course.course_code}`);
    setShowCourseDropdown(false);
    // Auto-fill the message input with course code, name, and description
    setInputValue(`Find candidates for ${course.course_code} - ${course.course_name}`);
  };

  const handleCourseSearchChange = (e) => {
    setCourseSearchTerm(e.target.value);
    setShowCourseDropdown(true);
    setSelectedCourse(null); // Clear selection when typing
  };

  const filteredCourses = courses.filter(course => {
    const searchLower = courseSearchTerm.toLowerCase();
    return (
      course.course_code.toLowerCase().includes(searchLower) ||
      course.course_name.toLowerCase().includes(searchLower) ||
      course.description.toLowerCase().includes(searchLower)
    );
  });

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
    
    // Reset course selection after sending
    const currentCourseSelection = selectedCourse;
    setSelectedCourse(null);
    setCourseSearchTerm("");

    // If this is a new unsaved chat, save it to database
    if (isNewUnsavedChat) {
      let sessionId;
      
      // Create session in database
      try {
        const createResponse = await fetch(`${API_URL}/api/chat-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: messageContent.substring(0, 50)
          })
        });
        const createData = await createResponse.json();
        if (createData.success) {
          sessionId = createData.session.session_id;
          const newChat = {
            id: sessionId,
            title: messageContent.substring(0, 50),
            preview: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
            time: "Just now",
            timestamp: new Date(),
            createdBy: createData.session.created_by_name || createData.session.created_by_email,
            messageCount: 0
          };
          
          setChatHistory([newChat, ...chatHistory]);
          setActiveChat(sessionId);
          setIsNewUnsavedChat(false);
          
          // Save user message to database
          await saveMessageToDb(sessionId, 'user', messageContent);
        }
      } catch (error) {
        console.error('Error creating session:', error);
        alert('Failed to create chat session');
        return;
      }
      
      // Capture the session ID for the async response
      const sessionIdForResponse = sessionId;
      const courseForSearch = currentCourseSelection;

      // Show typing indicator
      setIsTyping(true);
      
      // Call AI search API
      try {
        const response = await fetch(`${API_URL}/api/ai-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            course: courseForSearch ? `${courseForSearch.course_code} - ${courseForSearch.course_name}` : messageContent,
            description: courseForSearch ? courseForSearch.description : ''
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
              aiContent += `   Law School: ${candidate.lawSchool}\n`;
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
              aiContent += `   [View Resume](${candidate.resumeFile})\n`;
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
        
        // Save AI response to database
        await saveMessageToDb(sessionIdForResponse, 'assistant', aiContent);
        
        // Update messages and chatMessages using the captured session ID
        setChatMessages(prev => {
          const newChatMessages = {
            ...prev,
            [sessionIdForResponse]: finalMessages,
          };
          return newChatMessages;
        });
        
        // Only update visible messages if this chat is still active
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === sessionIdForResponse) {
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
          [sessionIdForResponse]: finalMessages,
        }));
        
        setActiveChat(currentActiveChat => {
          if (currentActiveChat === sessionIdForResponse) {
            setMessages(finalMessages);
          }
          return currentActiveChat;
        });
      }
    } else {
      // Update existing chat - capture the current active chat ID
      const chatIdForMessage = activeChat;
      const courseForSearch = currentCourseSelection;
      
      setChatMessages(prev => ({
        ...prev,
        [chatIdForMessage]: updatedMessages,
      }));
      
      // Save user message to database
      await saveMessageToDb(chatIdForMessage, 'user', messageContent);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Call AI search API
      try {
        const response = await fetch(`${API_URL}/api/ai-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            course: courseForSearch ? `${courseForSearch.course_code} - ${courseForSearch.course_name}` : messageContent,
            description: courseForSearch ? courseForSearch.description : ''
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
              aiContent += `   Law School: ${candidate.lawSchool}\n`;
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
              aiContent += `   [View Resume](${candidate.resumeFile})\n`;
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
        
        // Save AI response to database
        await saveMessageToDb(chatIdForMessage, 'assistant', aiContent);
        
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
        content: "Hello! I'm your AI hiring assistant.\n\nI can help you find qualified candidates for law courses. You can either:\n1. **Select a course** from the dropdown menu below\n2. **Type freely** to search for candidates by topic or skills\n\nWhat course are you looking to fill?",
        timestamp: new Date(),
      },
    ];
    
    setMessages(initialMessages);
    setActiveChat(null);
    setIsNewUnsavedChat(true);
    setSelectedCourse(null);
    setCourseSearchTerm("");
  };

  const handleChatSelect = async (chatId) => {
    // Load messages for selected chat from database
    setActiveChat(chatId);
    setIsNewUnsavedChat(false);
    
    // Check if already cached
    if (chatMessages[chatId]) {
      setMessages(chatMessages[chatId]);
      return;
    }
    
    // Load from database
    try {
      const response = await fetch(`${API_URL}/api/chat-sessions/${chatId}/messages`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const loadedMessages = data.messages.map(msg => ({
          id: msg.message_id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        
        // Cache the messages
        setChatMessages(prev => ({
          ...prev,
          [chatId]: loadedMessages
        }));
        
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([{
        id: 1,
        role: "assistant",
        content: "Error loading messages. Please try again.",
        timestamp: new Date(),
      }]);
    }
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
              <div className="brand-subtitle">Law Hiring Assistant</div>
            </div>
          </div>
        </div>

        <button className="btn-new-chat" onClick={handleNewChat}>
          <span className="btn-icon">+</span> New Chat
        </button>

        <div className="chat-history">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`chat-history-item ${activeChat === chat.id ? "active" : ""}`}
              style={{ position: 'relative', padding: '12px', cursor: 'pointer' }}
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
                <div className="chat-history-preview">
                  by {chat.createdBy} • {chat.messageCount || 0} msgs
                </div>
                <div className="chat-history-time">{chat.time}</div>
              </div>
              <button
                className="delete-chat-btn"
                onClick={(e) => deleteChat(chat.id, e)}
                title="Delete chat"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  padding: '0',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#9ca3af',
                  fontSize: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ef4444';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#9ca3af';
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="footer-text">
            Texas A&M University School of Law
          </div>
          <div className="footer-version">Law Hiring Assistant v1.0</div>
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
            <div className="chat-header-title">TAMU Law Hiring Assistant</div>
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
          <form onSubmit={handleSendMessage} className="chat-input-form" style={{ 
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Course Selection Dropdown - Compact and Elegant */}
            <div className="course-selector" ref={courseDropdownRef} style={{ 
              position: 'relative',
              flex: '0 0 200px',
              minWidth: '160px'
            }}>
              <input
                type="text"
                className="course-search-input"
                placeholder="Course code..."
                value={courseSearchTerm}
                onChange={handleCourseSearchChange}
                onFocus={() => setShowCourseDropdown(true)}
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  backgroundColor: 'white',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#500000';
                  e.target.style.boxShadow = '0 0 0 3px rgba(80, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#500000';
                  e.target.style.boxShadow = '0 0 0 3px rgba(80, 0, 0, 0.1)';
                }}
                onBlur={(e) => {
                  if (!courseDropdownRef.current?.contains(document.activeElement)) {
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
              {showCourseDropdown && filteredCourses.length > 0 && (
                <div className="course-dropdown" style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  width: '280px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  boxShadow: '0 -4px 12px -2px rgba(0, 0, 0, 0.15), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
                  zIndex: 1000
                }}>
                  {filteredCourses.slice(0, 20).map((course) => (
                    <div
                      key={course.course_id}
                      className="course-dropdown-item"
                      onClick={() => handleCourseSelect(course)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef8f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#500000', 
                        fontSize: '12px',
                        marginBottom: '2px'
                      }}>
                        {course.course_code}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#374151',
                        marginBottom: '2px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {course.course_name}
                      </div>
                      {course.credits && (
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#9ca3af'
                        }}>
                          {course.credits} credits
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              className="chat-input"
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ flex: '1' }}
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
