import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import TopBar from "./TopBar.jsx";
import { API_URL } from "../utils/auth.js";
import "./ChatBot.css";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load all chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat-sessions`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadChatMessages = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat-sessions/${sessionId}/messages`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages.map(msg => ({
          id: msg.message_id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        })));
        setActiveSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewChat = () => {
    setActiveSessionId(null);
    setMessages([{
      id: 0,
      role: "assistant",
      content: "Hello! I'm your AI teaching assistant.\n\nI can help you find qualified candidates for law courses. Simply tell me the course name (e.g., 'Cyber Law', 'Constitutional Law', 'Contract Law') and I'll search through all applicant resumes to find potential instructors.\n\nWhat course are you looking to fill?",
      timestamp: new Date(),
    }]);
  };

  const deleteChat = async (sessionId, e) => {
    e.stopPropagation(); // Prevent loading the chat when clicking delete
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Remove from local state
        setChatSessions(chatSessions.filter(s => s.session_id !== sessionId));
        // If deleted chat was active, create new chat
        if (activeSessionId === sessionId) {
          createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  const saveMessage = async (sessionId, role, content) => {
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessageContent = inputValue;
    setInputValue("");

    // If no active session, create one
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const response = await fetch(`${API_URL}/api/chat-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: userMessageContent.substring(0, 50)
          })
        });
        const data = await response.json();
        if (data.success) {
          sessionId = data.session.session_id;
          setActiveSessionId(sessionId);
          // Reload sessions to show the new one
          await loadChatSessions();
        }
      } catch (error) {
        console.error('Error creating session:', error);
        alert('Failed to create chat session');
        return;
      }
    }

    // Add user message to UI
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Save user message to database
    await saveMessage(sessionId, 'user', userMessageContent);

    // Show typing indicator
    setIsTyping(true);

    // Call AI search API
    try {
      const response = await fetch(`${API_URL}/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course: userMessageContent,
          description: ''
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search candidates');
      }

      // Format AI response with candidate list
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
        id: Date.now() + 1,
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Save AI message to database
      await saveMessage(sessionId, 'assistant', aiContent);

    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, errorMessage]);
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

  return (
    <div className="chatbot-page">
      <TopBar />

      <div className="chatbot-container">
        {/* Sidebar with chat history */}
        <div className="sidebar">
          <button className="new-chat-btn" onClick={createNewChat}>
            + New Chat
          </button>

          <div className="chat-history">
            <h3>Chat History</h3>
            {isLoadingSessions ? (
              <p style={{ textAlign: 'center', color: '#999' }}>Loading...</p>
            ) : chatSessions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>No chats yet</p>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.session_id}
                  className={`chat-item ${activeSessionId === session.session_id ? 'active' : ''}`}
                  onClick={() => loadChatMessages(session.session_id)}
                >
                  <div className="chat-item-header">
                    <span className="chat-title">{session.title}</span>
                    <button 
                      className="delete-chat-btn" 
                      onClick={(e) => deleteChat(session.session_id, e)}
                      title="Delete chat"
                    >
                      ×
                    </button>
                  </div>
                  <div className="chat-meta">
                    <span className="chat-creator">by {session.created_by_name || session.created_by_email}</span>
                    <span className="chat-time">{formatTime(session.updated_at)}</span>
                  </div>
                  <div className="chat-message-count">{session.message_count} messages</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a course name (e.g., Cyber Law, Tax Law)..."
              className="message-input"
              disabled={isTyping}
            />
            <button type="submit" className="send-btn" disabled={isTyping || !inputValue.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
