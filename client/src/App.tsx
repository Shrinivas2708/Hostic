import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import './App.css';

// Define the shape of a log entry
interface LogEntry {
  text: string;
  type?: 'message' | 'error'; // Optional type field with specific values
}

function App() {
  const [buildId, setBuildId] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]); // Explicitly type logs as LogEntry[]
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('[React] Connected to Socket.IO server');
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('[React] Disconnected from Socket.IO:', reason);
        setIsConnected(false);
      });

      socket.on('log', (msg: string) => {
        console.log('[React] Received log:', msg);
        setLogs((prevLogs) => [...prevLogs, { text: msg }]); // Add log as plain text
      });

      socket.on('message', (msg: string) => {
        console.log('[React] Received message:', msg);
        setLogs((prevLogs) => [...prevLogs, { text: msg, type: 'message' }]);
      });

      socket.on('error', (msg: string) => {
        console.log('[React] Received error:', msg);
        setLogs((prevLogs) => [...prevLogs, { text: msg, type: 'error' }]);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('log');
        socket.off('message');
        socket.off('error');
        socket.disconnect();
      };
    }
  }, [socket]);

  const connectSocket = () => {
    if (!buildId) {
      setLogs((prevLogs) => [...prevLogs, { text: 'Please enter a Build ID', type: 'error' }]);
      return;
    }
    if (socket) socket.disconnect();
    const newSocket = io('http://localhost:9001', {
      query: { buildId },
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ['websocket'],
      upgrade: true,
    });
    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setLogs((prevLogs) => [...prevLogs, { text: 'Manually disconnected from Socket.IO server', type: 'message' }]);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setLogs((prevLogs) => [...prevLogs, { text: 'Logs cleared', type: 'message' }]);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (socket && socket.connected) {
        e.preventDefault();
        e.returnValue = 'Logs are streaming. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [socket]);

  return (
    <div className="App">
      <h1>Build Logs</h1>
      <div>
        <input
          type="text"
          id="build-id-input"
          value={buildId}
          onChange={(e) => setBuildId(e.target.value.trim())}
          placeholder="Enter Build ID"
          disabled={isConnected}
        />
        <button onClick={connectSocket} disabled={isConnected}>
          Connect
        </button>
        <button onClick={disconnectSocket} disabled={!isConnected}>
          Disconnect
        </button>
        <button onClick={clearLogs}>Clear Logs</button>
      </div>
      <div id="log-container" style={{ border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'auto',  marginTop: '10px', fontFamily: 'monospace', fontSize: '14px' }}>
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${log.type === 'error' ? 'error' : log.type === 'message' ? 'message' : ''}`}>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;