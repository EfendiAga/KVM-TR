import { useState, useRef, useEffect } from 'react';
import { Terminal, Monitor, Server, Link as LinkIcon, PowerOff, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Copy, ShieldCheck } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'server' | 'client'>('client');
  const [ip, setIp] = useState('192.168.1.100');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const [clipboardSync, setClipboardSync] = useState(true);
  const [logs, setLogs] = useState<string[]>(['[System] KVM initialized in client mode.']);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial status check
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setMode(data.mode);
        setIp(data.targetIp || '192.168.1.100');
        setStatus(data.status);
        if (data.lastEvent) {
          addLog(`[System] ${data.lastEvent}`);
        }
      });
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleModeChange = (newMode: 'server' | 'client') => {
    if (status !== 'disconnected') {
      handleConnect(); // Disconnect current session
    }
    setMode(newMode);
    addLog(`Switched to ${newMode} mode.`);
  };

  const handleConnect = async () => {
    if (status === 'connected' || status === 'connecting') {
      try {
        const res = await fetch('/api/disconnect', { method: 'POST' });
        const data = await res.json();
        setStatus(data.status);
        addLog(data.lastEvent);
      } catch (err) {
        addLog(`[Error] Failed to disconnect: ${err}`);
      }
      return;
    }

    setStatus('connecting');
    addLog(mode === 'server' ? `Binding to ${ip}...` : `Connecting to target ${ip}...`);

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, mode, position, clipboardSync })
      });
      const data = await res.json();
      
      // Artificial delay for UI feel
      setTimeout(() => {
        setStatus(data.status);
        addLog(data.lastEvent);
      }, 800);
    } catch (err) {
      setStatus('disconnected');
      addLog(`[Error] Connection failed: ${err}`);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F4F4F1] font-sans text-[#1A1A1A] p-[1cm] overflow-hidden flex flex-col box-border">
      <div className="flex-1 flex flex-col overflow-hidden border-[1px] border-[#1A1A1A] p-[1cm] w-full max-w-5xl mx-auto bg-[#F4F4F1]">
        
        {/* Header */}
        <header className="flex justify-between items-baseline border-b-[2px] border-[#1A1A1A] pb-[0.5cm] mb-[1cm] shrink-0">
          <h1 className="font-barlow-condensed text-[4rem] font-bold uppercase m-0 flex items-center gap-[0.2cm] leading-none">
            <Monitor className="w-[0.8em] h-[0.8em] text-[#1A1A1A]" />
            KVM TR
          </h1>
          <div className="font-mono text-[12px] font-bold">VER 4.0.2 / STABLE</div>
        </header>

        {/* Body */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[8cm_1fr] gap-[1.5cm] overflow-hidden">
          
          {/* Left Column */}
          <section className="flex flex-col gap-[1cm] overflow-y-auto pr-[0.5cm]">
            
            {/* Mode Toggle */}
            <div>
              <label className="block text-[10px] uppercase tracking-[2px] mb-[0.4cm] font-bold">01 / Connection Mode</label>
              <div className="grid grid-cols-2 border-[1px] border-[#1A1A1A] h-[1.2cm]">
                <button
                  onClick={() => handleModeChange('server')}
                  className={`flex items-center justify-center text-[11px] uppercase tracking-[1px] cursor-pointer font-bold transition-colors ${
                    mode === 'server'
                      ? 'bg-[#1A1A1A] text-[#F4F4F1]'
                      : 'bg-transparent text-[#1A1A1A] hover:bg-black/5'
                  }`}
                >
                  <Server className="w-[14px] h-[14px] mr-[6px]" />
                  Server
                </button>
                <button
                  onClick={() => handleModeChange('client')}
                  className={`flex items-center justify-center text-[11px] uppercase tracking-[1px] cursor-pointer font-bold transition-colors ${
                    mode === 'client'
                      ? 'bg-[#1A1A1A] text-[#F4F4F1]'
                      : 'bg-transparent text-[#1A1A1A] hover:bg-black/5'
                  }`}
                >
                  <Terminal className="w-[14px] h-[14px] mr-[6px]" />
                  Client
                </button>
              </div>
            </div>

            {/* Connection Settings */}
            <div>
              <label className="block text-[10px] uppercase tracking-[2px] mb-[0.4cm] font-bold">
                02 / {mode === 'server' ? 'Bind IP Address' : 'Target IP Address'}
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                disabled={status !== 'disconnected'}
                placeholder="192.168.x.x"
                className="w-full border-none border-b-[1px] border-[#1A1A1A] bg-transparent text-[1.5rem] font-mono py-[0.2cm] outline-none disabled:opacity-50 transition-all focus:border-b-[2px]"
              />
            </div>

            {/* Display Mapping */}
            <div className={mode === 'client' ? 'opacity-30 pointer-events-none' : ''}>
              <label className="block text-[10px] uppercase tracking-[2px] mb-[0.4cm] font-bold">03 / Display Mapping</label>
              <div className="grid grid-cols-4 border-[1px] border-[#1A1A1A] h-[1.2cm]">
                <button
                  onClick={() => setPosition('left')}
                  disabled={status !== 'disconnected' || mode === 'client'}
                  className={`flex items-center justify-center border-r-[1px] border-[#1A1A1A] transition-colors ${position === 'left' ? 'bg-[#1A1A1A] text-[#F4F4F1]' : 'hover:bg-black/5'} disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-[14px] h-[14px]" />
                </button>
                <button
                  onClick={() => setPosition('right')}
                  disabled={status !== 'disconnected' || mode === 'client'}
                  className={`flex items-center justify-center border-r-[1px] border-[#1A1A1A] transition-colors ${position === 'right' ? 'bg-[#1A1A1A] text-[#F4F4F1]' : 'hover:bg-black/5'} disabled:cursor-not-allowed`}
                >
                  <ArrowRight className="w-[14px] h-[14px]" />
                </button>
                <button
                  onClick={() => setPosition('top')}
                  disabled={status !== 'disconnected' || mode === 'client'}
                  className={`flex items-center justify-center border-r-[1px] border-[#1A1A1A] transition-colors ${position === 'top' ? 'bg-[#1A1A1A] text-[#F4F4F1]' : 'hover:bg-black/5'} disabled:cursor-not-allowed`}
                >
                  <ArrowUp className="w-[14px] h-[14px]" />
                </button>
                <button
                  onClick={() => setPosition('bottom')}
                  disabled={status !== 'disconnected' || mode === 'client'}
                  className={`flex items-center justify-center transition-colors ${position === 'bottom' ? 'bg-[#1A1A1A] text-[#F4F4F1]' : 'hover:bg-black/5'} disabled:cursor-not-allowed`}
                >
                  <ArrowDown className="w-[14px] h-[14px]" />
                </button>
              </div>
              <div className="text-[10px] uppercase mt-[0.2cm] text-black/50 font-bold">
                Client screen is: <span className="text-black">{position.toUpperCase()}</span> of server display
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-[10px] uppercase tracking-[2px] mb-[0.4cm] font-bold">04 / Subsystems</label>
              <div className="flex gap-[0.5cm]">
                <button
                  onClick={() => setClipboardSync(!clipboardSync)}
                  disabled={status !== 'disconnected'}
                  className={`flex items-center text-[10px] uppercase tracking-[1px] font-bold transition-opacity disabled:cursor-not-allowed ${clipboardSync ? 'opacity-100 text-[#1A1A1A]' : 'opacity-30 text-[#1A1A1A]'}`}
                >
                  <Copy className="w-[12px] h-[12px] mr-[4px]" />
                  Clipboard Sync
                </button>
                <div className="flex items-center text-[10px] uppercase tracking-[1px] font-bold text-[#1A1A1A] border-l-[1px] border-black/20 pl-[0.5cm]">
                  <ShieldCheck className="w-[12px] h-[12px] mr-[4px]" />
                  AES-256
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <div>
              <button
                onClick={handleConnect}
                className={`w-full flex items-center justify-center bg-transparent border-[2px] border-[#1A1A1A] h-[1.5cm] text-[14px] uppercase font-black tracking-[3px] cursor-pointer transition-all ${
                  status === 'connected'
                    ? 'bg-[#1A1A1A] text-[#F4F4F1]'
                    : status === 'connecting'
                    ? 'bg-[#1A1A1A] text-[#F4F4F1] opacity-70 cursor-wait'
                    : 'hover:bg-[#1A1A1A] hover:text-[#F4F4F1]'
                }`}
              >
                {status === 'connected' ? (
                  <>
                    <PowerOff className="w-[16px] h-[16px] mr-[8px]" /> Disconnect
                  </>
                ) : status === 'connecting' ? (
                  'Connecting...'
                ) : (
                  <>
                    <LinkIcon className="w-[16px] h-[16px] mr-[8px]" /> Establish Link
                  </>
                )}
              </button>
            </div>

            <div className="mt-auto text-[11px] leading-[1.5] opacity-60">
              <p>High-performance kernel-level input mapping. Secure P2P encrypted channel enabled by default.</p>
            </div>
          </section>

          {/* Right Column / Console Area */}
          <section className="flex flex-col md:border-l-[1px] border-black/10 md:pl-[1.5cm] overflow-hidden">
            <label className="block text-[10px] uppercase tracking-[2px] mb-[0.4cm] font-bold shrink-0">
              05 / Status Monitor
            </label>
            <div className="flex-1 bg-[#1A1A1A] text-[#AFAFAF] font-mono text-[13px] p-[0.8cm] rounded-[2px] relative overflow-hidden flex flex-col shadow-inner">
              <div className="text-[#00FF00] mb-[0.4cm] shrink-0">● SYSTEM READY</div>
              <div className="flex-1 overflow-y-auto break-all pb-[1.5cm]">
                {logs.map((log, i) => (
                  <div key={i} className="mb-[0.2cm]">
                    {log}
                  </div>
                ))}
                <div className="text-white mt-[0.2cm] animate-pulse">_</div>
                <div ref={consoleRef} />
              </div>
              <div className="absolute bottom-[0.8cm] right-[0.8cm] text-[10px] opacity-50 bg-[#1A1A1A] pl-[0.5cm]">
                LATENCY: {status === 'connected' ? '12ms' : '0ms'}
              </div>
            </div>
          </section>

        </main>

        <footer className="mt-[1cm] flex justify-between text-[10px] uppercase tracking-[1px] text-black/50 shrink-0">
          <div>© {new Date().getFullYear()} Minimalist Systems LLC</div>
          <div>Encrypted via AES-256-GCM</div>
        </footer>
      </div>
    </div>
  );
}
