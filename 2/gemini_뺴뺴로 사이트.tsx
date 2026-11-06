import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  PenTool, 
  Sparkles, 
  RotateCw, 
  PackageCheck, 
  Share2, 
  Download, 
  RefreshCw, 
  Gift, 
  Heart, 
  Star, 
  Check, 
  ArrowLeft, 
  Lock, 
  PartyPopper 
} from 'lucide-react';

// Color Options for Chocolate Coating
const CHOCO_COLORS = [
  { id: 'brown', name: '클래식 초코', hex: '#4A2C11', accent: '#6B4226', light: '#8D5B4C' },
  { id: 'pink', name: '딸기 초코', hex: '#FF85A1', accent: '#FF6B8B', light: '#FFB3C1' },
  { id: 'green', name: '말차 초코', hex: '#588157', accent: '#3A5A40', light: '#A3B18A' },
  { id: 'red', name: '레드 초코', hex: '#D90429', accent: '#EF233C', light: '#F77F00' },
  { id: 'blue', name: '민트 블루', hex: '#4EA8DE', accent: '#56CFE1', light: '#90E0EF' }
];

export default function App() {
  // App Mode: 'DIY' | 'PACKAGING' | 'RECEIVER_360'
  const [appMode, setAppMode] = useState('DIY');

  // Form & Letter State
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  
  // DIY State
  const [selectedColor, setSelectedColor] = useState(CHOCO_COLORS[0]);
  const [isCoated, setIsCoated] = useState(false);
  const [selectedSprinkle, setSelectedSprinkle] = useState(null); // 'heart' | 'star' | null
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#FFFFFF');
  
  // Data for rendering decoration layers on the Pepero
  const [sprinklesList, setSprinklesList] = useState([]); // [{id, type, x, y, size, rotation, color}]
  const [penPaths, setPenPaths] = useState([]); // [{color, points: [{x, y}]}]
  const [isDrawingPen, setIsDrawingPen] = useState(false);

  // Refs
  const peperoCanvasRef = useRef(null);
  const isDraggingSprinkleRef = useRef(false);

  // Drip & Splash Falling Particles State for Out-of-Bound effects
  const [fallingParticles, setFallingParticles] = useState([]); // [{id, x, y, vx, vy, size, color, type, opacity}]

  // 360 Box Viewer State
  const [boxRotation, setBoxRotation] = useState(0); // Y-axis rotation in degrees
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [isBoxOpen, setIsBoxOpen] = useState(false);

  // Parse URL Hash on Load for Recipient 360 Mode
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('#data=')) {
      try {
        const encodedData = hash.replace('#data=', '');
        const decodedJson = decodeURIComponent(atob(encodedData));
        const payload = JSON.parse(decodedJson);

        if (payload) {
          if (payload.color) setSelectedColor(payload.color);
          if (payload.sprinkles) setSprinklesList(payload.sprinkles);
          if (payload.paths) setPenPaths(payload.paths);
          if (payload.sender) setSenderName(payload.sender);
          if (payload.recipient) setRecipientName(payload.recipient);
          if (payload.message) setMessage(payload.message);
          setIsCoated(true);
          setAppMode('RECEIVER_360');
        }
      } catch (err) {
        console.error("Failed to parse shared Pepero URL hash data", err);
      }
    }
  }, []);

  // Notification Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Falling Particles Gravity & Splash Physics Loop
  useEffect(() => {
    if (fallingParticles.length === 0) return;

    const timer = setInterval(() => {
      setFallingParticles(prev => {
        return prev
          .map(p => {
            const nextY = p.y + p.vy;
            const nextX = p.x + p.vx;
            const nextVy = p.vy + 0.5; // Gravity acceleration
            const nextOpacity = p.opacity - 0.02;

            return {
              ...p,
              x: nextX,
              y: nextY,
              vy: nextVy,
              opacity: nextOpacity
            };
          })
          .filter(p => p.y < 380 && p.opacity > 0);
      });
    }, 16);

    return () => clearInterval(timer);
  }, [fallingParticles]);

  // Helper function to spawn out-of-bound falling drops/sprinkles
  const spawnFallingParticle = (coords, color, type = 'drip') => {
    const newParticle = {
      id: Date.now() + Math.random(),
      x: coords.x,
      y: coords.y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2 + 1,
      size: type === 'drip' ? Math.random() * 5 + 4 : Math.random() * 4 + 6,
      color: color,
      type: type, // 'drip' | 'heart' | 'star'
      opacity: 1
    };

    setFallingParticles(prev => [...prev.slice(-30), newParticle]); // keep max 30 active drops
  };

  // Render Main Pepero Canvas
  const redrawPeperoCanvas = () => {
    const canvas = peperoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background (transparent)
    ctx.clearRect(0, 0, width, height);

    // Draw Raw Biscuit Stick (Centered)
    const stickW = 32;
    const stickH = 340;
    const stickX = (width - stickW) / 2;
    const stickY = 40;
    const radius = 10;

    // Biscuit Body Gradient
    const biscuitGrad = ctx.createLinearGradient(stickX, stickY, stickX + stickW, stickY);
    biscuitGrad.addColorStop(0, '#E6B06C');
    biscuitGrad.addColorStop(0.5, '#F5C98B');
    biscuitGrad.addColorStop(1, '#D49B53');

    ctx.fillStyle = biscuitGrad;
    ctx.beginPath();
    ctx.roundRect(stickX, stickY, stickW, stickH, [radius, radius, 8, 8]);
    ctx.fill();

    // Biscuit Texture Lines
    ctx.strokeStyle = '#C38538';
    ctx.lineWidth = 1.5;
    for (let y = stickY + 30; y < stickY + stickH - 20; y += 35) {
      ctx.beginPath();
      ctx.moveTo(stickX + 6, y);
      ctx.lineTo(stickX + stickW - 6, y + 2);
      ctx.stroke();
    }

    // Draw Chocolate Coating if Coated
    const coatedH = 260; // Coating covers top 260px
    if (isCoated) {
      const coatGrad = ctx.createLinearGradient(stickX, stickY, stickX + stickW, stickY);
      coatGrad.addColorStop(0, selectedColor.accent);
      coatGrad.addColorStop(0.3, selectedColor.hex);
      coatGrad.addColorStop(0.8, selectedColor.hex);
      coatGrad.addColorStop(1, selectedColor.light);

      ctx.save();
      // Clip to stick top portion
      ctx.beginPath();
      ctx.roundRect(stickX - 2, stickY - 2, stickW + 4, coatedH, [radius, radius, 0, 0]);
      ctx.clip();

      ctx.fillStyle = coatGrad;
      ctx.fillRect(stickX - 2, stickY - 2, stickW + 4, coatedH);

      // Chocolate Shine Effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(stickX + 4, stickY, 5, coatedH - 10);

      // Bottom Chocolate Drip effect
      ctx.fillStyle = selectedColor.hex;
      ctx.beginPath();
      ctx.arc(stickX + 8, stickY + coatedH, 7, 0, Math.PI);
      ctx.arc(stickX + 18, stickY + coatedH + 3, 6, 0, Math.PI);
      ctx.arc(stickX + 26, stickY + coatedH - 2, 5, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    }

    // Draw Sprinkles
    sprinklesList.forEach(sp => {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate((sp.rotation * Math.PI) / 180);

      ctx.fillStyle = sp.color;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 2;

      if (sp.type === 'heart') {
        const s = sp.size / 12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-6 * s, -6 * s, -12 * s, 2 * s, 0, 10 * s);
        ctx.bezierCurveTo(12 * s, 2 * s, 6 * s, -6 * s, 0, 0);
        ctx.fill();
      } else if (sp.type === 'star') {
        const r = sp.size;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
          ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2));
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    // Draw 3D Volumetric Gel Choco Pen Paths (Shadow + Base Gel + Top Gloss Highlight)
    penPaths.forEach(path => {
      if (path.points.length < 2) return;

      // Layer 1: Dark Drop Shadow for 3D depth
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x + 1.5, path.points[0].y + 2.5);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x + 1.5, path.points[i].y + 2.5);
      }
      ctx.stroke();
      ctx.restore();

      // Layer 2: Main Chocolate Gel Body Color
      ctx.save();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.restore();

      // Layer 3: Top Curved Glossy Highlight Layer (3D Tube Effect)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x - 1, path.points[0].y - 1);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x - 1, path.points[i].y - 1);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Render Falling Drops / Out-of-bound Gravity Particles
    fallingParticles.forEach(fp => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, fp.opacity);
      ctx.fillStyle = fp.color;

      if (fp.type === 'drip') {
        // Chocolate Drip Droplet with Highlight
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(fp.x - fp.size * 0.3, fp.y - fp.size * 0.3, fp.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Falling Sprinkle Shape
        ctx.translate(fp.x, fp.y);
        ctx.rotate((fp.y * 3 * Math.PI) / 180);
        if (fp.type === 'heart') {
          const s = fp.size / 10;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-6 * s, -6 * s, -12 * s, 2 * s, 0, 10 * s);
          ctx.bezierCurveTo(12 * s, 2 * s, 6 * s, -6 * s, 0, 0);
          ctx.fill();
        } else {
          const r = fp.size;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (r / 2));
          }
          ctx.fill();
        }
      }

      ctx.restore();
    });
  };

  useEffect(() => {
    redrawPeperoCanvas();
  }, [selectedColor, isCoated, sprinklesList, penPaths, fallingParticles, appMode, isBoxOpen]);

  // Canvas Interactions (Dipping, Sprinkle Spraying, Pen Drawing, Out-of-Bounds Drips)
  const getCanvasCoords = (e) => {
    const canvas = peperoCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  // Add sprinkle particle along movement path (Stick region vs Falling Drip)
  const handleSprinkleScatter = (coords) => {
    if (!isCoated) return;
    // On Stick Region
    if (coords.x >= 70 && coords.x <= 130 && coords.y >= 40 && coords.y <= 300) {
      const colors = selectedSprinkle === 'heart' 
        ? ['#FF4D6D', '#FFB3C1', '#FFF0F5', '#FF758F'] 
        : ['#FFD166', '#FFB703', '#FFF3B0', '#FAEDCD'];
      
      const newSprinkle = {
        id: Date.now() + Math.random(),
        type: selectedSprinkle,
        x: coords.x + (Math.random() * 12 - 6),
        y: coords.y + (Math.random() * 12 - 6),
        size: Math.random() * 4 + 7,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)]
      };

      setSprinklesList(prev => [...prev, newSprinkle]);
    } else {
      // Out of Bound Sprinkle Drop Fall
      const colors = selectedSprinkle === 'heart' ? '#FF4D6D' : '#FFD166';
      spawnFallingParticle(coords, colors, selectedSprinkle);
    }
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    const isOnStick = coords.x >= 70 && coords.x <= 130 && coords.y >= 40 && coords.y <= 300;

    // Pen Drawing Mode
    if (isPenActive && isCoated) {
      setIsDrawingPen(true);
      if (isOnStick) {
        setPenPaths(prev => [...prev, { color: penColor, points: [coords] }]);
      } else {
        spawnFallingParticle(coords, penColor, 'drip');
      }
      return;
    }

    // Sprinkle Spraying Mode
    if (selectedSprinkle && isCoated) {
      isDraggingSprinkleRef.current = true;
      handleSprinkleScatter(coords);
    }
  };

  const handlePointerMove = (e) => {
    const coords = getCanvasCoords(e);
    const isOnStick = coords.x >= 70 && coords.x <= 130 && coords.y >= 40 && coords.y <= 300;

    // Pen drawing state update
    if (isPenActive && isDrawingPen) {
      if (isOnStick) {
        setPenPaths(prev => {
          if (prev.length === 0) return [{ color: penColor, points: [coords] }];
          const updated = [...prev];
          const currentPath = { ...updated[updated.length - 1] };
          currentPath.points = [...currentPath.points, coords];
          updated[updated.length - 1] = currentPath;
          return updated;
        });
      } else {
        // Out-of-bounds Pen Drop Fall
        spawnFallingParticle(coords, penColor, 'drip');
      }
    }

    // Sprinkle scattering continuous spray
    if (selectedSprinkle && isDraggingSprinkleRef.current) {
      handleSprinkleScatter(coords);
    }
  };

  const handlePointerUp = () => {
    setIsDrawingPen(false);
    isDraggingSprinkleRef.current = false;
  };

  // Handle Drag & Drop Coat dipping stick into bowl
  const handleDropOnBowl = (e) => {
    e.preventDefault();
    setIsCoated(true);
    showToast(`${selectedColor.name} 초콜릿에 푹 덤뿍 코팅되었습니다! 🎉`);
  };

  // Box 360 Degree Drag Interaction
  const handleBoxPointerDown = (e) => {
    setIsDraggingBox(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleBoxPointerMove = (e) => {
    if (!isDraggingBox) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartX;
    setBoxRotation(prev => (prev + deltaX * 0.8) % 360);
    setDragStartX(clientX);
  };

  const handleBoxPointerUp = () => {
    setIsDraggingBox(false);
  };

  // Encoded Link Generation & Image Exports
  const generateShareLink = async () => {
    const payload = {
      color: selectedColor,
      sprinkles: sprinklesList,
      paths: penPaths,
      sender: senderName,
      recipient: recipientName,
      message: message
    };

    const jsonStr = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('360도 인터랙티브 선물 URL이 클립보드에 복사되었습니다! 💌');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch (err) {
      // Fallback method when Clipboard API is restricted by iframe permissions policy
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          showToast('360도 인터랙티브 선물 URL이 복사되었습니다! 💌');
        } else {
          prompt('아래 링크를 복사해주세요:', url);
        }
      } catch (fallbackErr) {
        prompt('아래 링크를 복사해주세요:', url);
      }
    }
  };

  // Export Images
  const downloadPeperoImage = () => {
    const canvas = peperoCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Pepero_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('커스텀 빼빼로 이미지가 다운로드되었습니다! 🖼️');
  };

  const downloadBoxImage = () => {
    const boxCanvas = document.createElement('canvas');
    boxCanvas.width = 600;
    boxCanvas.height = 700;
    const ctx = boxCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFF5F5';
    ctx.fillRect(0, 0, 600, 700);

    // Outer Box Frame
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.roundRect(100, 80, 400, 540, 20);
    ctx.fill();

    // White Ribbon
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(270, 80, 60, 540);
    ctx.fillRect(100, 310, 400, 60);

    // Gold Seal
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(300, 340, 45, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '28px "Nanum Pen Script", cursive';
    ctx.fillStyle = '#1D3557';
    ctx.textAlign = 'center';
    
    // Split message into lines
    const lines = (message || "편지 내용이 없습니다.").split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, 300, 460 + (idx * 35));
    });

    if (recipientName) {
      ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
      ctx.fillText(`To. ${recipientName}`, 300, 150);
    }
    if (senderName) {
      ctx.font = '20px "Noto Sans KR", sans-serif';
      ctx.fillText(`From. ${senderName}`, 300, 580);
    }

    const link = document.createElement('a');
    link.download = `Pepero_GiftBox_${Date.now()}.png`;
    link.href = boxCanvas.toDataURL('image/png');
    link.click();
    showToast('선물 상자 패키지 이미지가 다운로드되었습니다! 🎁');
  };

  return (
    <div className="min-h-screen bg-pink-50 text-slate-800 font-sans flex flex-col items-center justify-between select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <PartyPopper className="w-5 h-5 text-yellow-400" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-pink-100 py-3 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-red-500 text-white p-2 rounded-xl shadow-md">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-red-600">DIY 빼빼로 스튜디오</h1>
            <p className="text-xs text-slate-500 font-medium">360° 인터랙티브 손글씨 기프트 박스</p>
          </div>
        </div>

        {appMode !== 'RECEIVER_360' && (
          <div className="flex items-center space-x-3">
            {appMode === 'DIY' ? (
              <button
                onClick={() => setAppMode('PACKAGING')}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-red-200 transition flex items-center space-x-2"
              >
                <PackageCheck className="w-5 h-5" />
                <span>완성하기 & 포장</span>
              </button>
            ) : (
              <button
                onClick={() => setAppMode('DIY')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-full font-bold transition flex items-center space-x-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>빼빼로 수정하기</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Areas */}
      <main className="w-full max-w-6xl flex-1 p-4 md:p-6 flex flex-col justify-center">

        {/* MODE 1: DIY 4-QUARTER KITCHEN STUDIO */}
        {appMode === 'DIY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* TOP-LEFT: Chocolate Melting Bowl Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnBowl}
              className="bg-amber-900/10 border-2 border-dashed border-amber-300 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-inner min-h-[300px] bg-gradient-to-br from-amber-50 to-orange-100"
            >
              <span className="absolute top-4 left-4 bg-amber-800 text-amber-50 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                1. 중탕 초콜릿 그릇
              </span>

              {/* Melting Bowl Graphic */}
              <div 
                onClick={() => { setIsCoated(true); showToast(`${selectedColor.name} 초콜릿에 dip 코팅 완료!`); }}
                className="w-48 h-48 rounded-full border-8 border-amber-900 shadow-2xl flex items-center justify-center relative cursor-pointer transform hover:scale-105 transition-transform group"
                style={{ backgroundColor: selectedColor.hex }}
              >
                {/* Chocolate Surface Shine */}
                <div className="w-36 h-36 rounded-full border-4 border-white/20 bg-gradient-to-tl from-transparent to-white/30 flex items-center justify-center">
                  <div className="text-white text-center opacity-80 group-hover:opacity-100 transition">
                    <p className="font-bold text-sm">{selectedColor.name}</p>
                    <p className="text-[11px] underline mt-1">클릭/스틱을 드래그하여 코팅</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: Sprinkle Scatter Selection Bowl */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-50 border-2 border-pink-200 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-sm min-h-[300px]">
              <span className="absolute top-4 left-4 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                3. 스프링클 흩뿌리기
              </span>

              <p className="text-xs text-slate-600 mb-4 text-center font-medium">
                원하는 모양을 선택한 후 우측 하단 <br/>
                <span className="font-bold text-pink-600">빼빼로 스틱 위로 마우스/터치를 문질러</span> 뿌려주세요!
              </p>

              <div className="flex space-x-6">
                {/* Heart Sprinkle Selector */}
                <button
                  onClick={() => {
                    setSelectedSprinkle(selectedSprinkle === 'heart' ? null : 'heart');
                    setIsPenActive(false);
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${
                    selectedSprinkle === 'heart' 
                      ? 'border-pink-500 bg-pink-200 shadow-md scale-105' 
                      : 'border-pink-100 bg-white hover:border-pink-300'
                  }`}
                >
                  <Heart className="w-10 h-10 text-pink-500 fill-pink-400" />
                  <span className="text-xs font-bold mt-2 text-pink-700">하트 스프링클</span>
                </button>

                {/* Star Sprinkle Selector */}
                <button
                  onClick={() => {
                    setSelectedSprinkle(selectedSprinkle === 'star' ? null : 'star');
                    setIsPenActive(false);
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition ${
                    selectedSprinkle === 'star' 
                      ? 'border-amber-400 bg-amber-100 shadow-md scale-105' 
                      : 'border-pink-100 bg-white hover:border-amber-200'
                  }`}
                >
                  <Star className="w-10 h-10 text-amber-400 fill-amber-300" />
                  <span className="text-xs font-bold mt-2 text-amber-700">별 스프링클</span>
                </button>
              </div>

              {selectedSprinkle && (
                <div className="mt-4 bg-white/80 px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 border border-pink-200 animate-pulse">
                  ✨ {selectedSprinkle === 'heart' ? '하트' : '별'} 스프링클 모드 활성화 중!
                </div>
              )}
            </div>

            {/* BOTTOM-LEFT: Palette & Choco Pen Controls */}
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm min-h-[300px]">
              <div>
                <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  2. 초콜릿 팔레트 & 초코펜
                </span>

                <div className="mt-4">
                  <label className="text-xs font-bold text-slate-500 block mb-2">중탕 초콜릿 색상 선택</label>
                  <div className="flex items-center space-x-3">
                    {CHOCO_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition border-2 ${
                          selectedColor.id === c.id ? 'scale-110 border-slate-900 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {selectedColor.id === c.id && <Check className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Choco-Pen Drawing Controls */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      setIsPenActive(!isPenActive);
                      if (!isPenActive) setSelectedSprinkle(null);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                      isPenActive 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <PenTool className="w-4 h-4" />
                    <span>초코펜 {isPenActive ? '켜짐' : '끄기'}</span>
                  </button>

                  {isPenActive && (
                    <div className="flex items-center space-x-2">
                      {['#FFFFFF', '#4A2C11', '#FF4D6D', '#FFD166'].map(col => (
                        <button
                          key={col}
                          onClick={() => setPenColor(col)}
                          className={`w-7 h-7 rounded-full border-2 ${
                            penColor === col ? 'border-purple-600 scale-110' : 'border-slate-200'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>초코펜으로 빼빼로 위에 손글씨를 써보세요!</span>
                  <button
                    onClick={() => {
                      setSprinklesList([]);
                      setPenPaths([]);
                      setIsCoated(false);
                      showToast('초기화 되었습니다.');
                    }}
                    className="text-red-400 hover:text-red-600 underline font-medium flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>초기화</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT: Interactive Canvas Pepero Stick */}
            <div className="bg-amber-50/50 border-2 border-amber-200/60 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-sm min-h-[360px]">
              <span className="absolute top-4 left-4 bg-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                4. 빼빼로 작업대
              </span>

              {/* HTML5 Canvas Pepero */}
              <div 
                draggable={!isCoated}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', 'stick');
                }}
                className="relative cursor-crosshair touch-none flex items-center justify-center"
              >
                <canvas
                  ref={peperoCanvasRef}
                  width={200}
                  height={380}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className="drop-shadow-xl"
                />

                {!isCoated && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium animate-pulse">
                      스틱을 좌측 상단 그릇으로 드래그
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* MODE 2: PACKAGING & LETTER CREATION */}
        {appMode === 'PACKAGING' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-pink-100">
            
            {/* Left: Handwritten Letter & Metadata Form */}
            <div className="space-y-5">
              <h2 className="text-2xl font-black text-slate-800 flex items-center space-x-2">
                <Gift className="w-6 h-6 text-red-500" />
                <span>선물 상자 손글씨 메세지</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">받는 사람 (To)</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="예: 지은이"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">보내는 사람 (From)</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="예: 민수"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">손글씨 메세지 입력</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="따뜻한 마음을 담은 편지를 적어보세요..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col space-y-3">
                <button
                  onClick={generateShareLink}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-100 transition flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>360° 선물 공유 링크 복사</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={downloadBoxImage}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>박스 이미지 저장</span>
                  </button>
                  <button
                    onClick={downloadPeperoImage}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>빼빼로 이미지 저장</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Box Preview */}
            <div className="flex flex-col items-center justify-center bg-pink-50/60 rounded-2xl p-8 border border-pink-100 relative">
              <span className="text-xs font-bold text-slate-400 mb-4">선물 박스 겉면 실시간 프리뷰</span>
              
              {/* Box Frame Graphic */}
              <div className="w-64 h-80 bg-red-600 rounded-2xl shadow-2xl relative p-5 flex flex-col justify-between border-4 border-red-700">
                {/* Ribbon Vertical */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 bg-white/90 shadow-md" />
                {/* Ribbon Horizontal */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-white/90 shadow-md" />
                
                {/* Center Bow / Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-amber-400 rounded-full shadow-lg border-2 border-white flex items-center justify-center z-10">
                  <Heart className="w-7 h-7 text-red-600 fill-red-500" />
                </div>

                {/* Sender & Recipient Labels */}
                <div className="z-10 text-center">
                  {recipientName && (
                    <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow">
                      To. {recipientName}
                    </span>
                  )}
                </div>

                {/* Handwritten Letter Card Area */}
                <div className="z-10 bg-white/95 p-3 rounded-xl shadow-lg border border-pink-200 min-h-[110px] flex items-center justify-center text-center">
                  <p 
                    className="text-slate-800 leading-snug break-words"
                    style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '20px' }}
                  >
                    {message || "편지 내용이 여기에 들어갑니다."}
                  </p>
                </div>

                {/* Sender Label Bottom */}
                <div className="z-10 text-center">
                  {senderName && (
                    <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow">
                      From. {senderName}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MODE 3: RECIPIENT 360-DEGREE VIEW & OPEN ANIMATION */}
        {appMode === 'RECEIVER_360' && (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">
                {senderName ? `${senderName}님이 보낸 특별한 빼빼로 선물 🎁` : '특별한 빼빼로 선물 도착! 🎁'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                상자를 마우스/터치로 좌우로 드래그하여 360도 관람해보세요!
              </p>
            </div>

            {/* 360 Interactive Box Container */}
            <div className="relative w-80 h-96 flex items-center justify-center">
              
              <div
                onMouseDown={handleBoxPointerDown}
                onMouseMove={handleBoxPointerMove}
                onMouseUp={handleBoxPointerUp}
                onTouchStart={handleBoxPointerDown}
                onTouchMove={handleBoxPointerMove}
                onTouchEnd={handleBoxPointerUp}
                onClick={() => setIsBoxOpen(true)}
                className="w-72 h-96 relative cursor-grab active:cursor-grabbing transition-transform duration-100 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${boxRotation}deg)`
                }}
              >

                {/* CLOSED BOX GRAPHIC */}
                {!isBoxOpen ? (
                  <div className="w-full h-full bg-gradient-to-b from-red-500 to-red-600 rounded-3xl shadow-2xl p-6 flex flex-col justify-between border-4 border-red-700 relative overflow-hidden">
                    
                    {/* Ribbon Vertical */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-14 bg-white/90 shadow-md" />
                    {/* Ribbon Horizontal */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-14 bg-white/90 shadow-md" />
                    
                    {/* Center Bow / Lock */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-amber-400 rounded-full shadow-xl border-4 border-white flex items-center justify-center z-10 animate-pulse">
                      <Gift className="w-8 h-8 text-red-600" />
                    </div>

                    {/* Recipient */}
                    <div className="z-10 text-center">
                      <span className="bg-white/90 px-4 py-1.5 rounded-full text-sm font-bold text-slate-800 shadow-md">
                        To. {recipientName || '당신을 위한 선물'}
                      </span>
                    </div>

                    {/* Handwritten Message Front */}
                    <div className="z-10 bg-white/95 p-4 rounded-2xl shadow-xl border border-pink-200 min-h-[120px] flex items-center justify-center text-center">
                      <p 
                        className="text-slate-800 leading-snug"
                        style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '24px' }}
                      >
                        {message || "손글씨 편지가 담겨 있습니다."}
                      </p>
                    </div>

                    {/* Sender */}
                    <div className="z-10 text-center">
                      <span className="bg-white/90 px-4 py-1.5 rounded-full text-sm font-bold text-slate-800 shadow-md">
                        From. {senderName || '익명의 천사'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* OPENED BOX INSIDE REVEAL */
                  <div className="w-full h-full bg-amber-100/90 rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-center border-4 border-amber-300 relative animate-fadeIn">
                    
                    <span className="absolute top-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      내 커스텀 빼빼로
                    </span>

                    {/* Rendered Canvas Copy */}
                    <div className="mt-4">
                      <canvas
                        ref={peperoCanvasRef}
                        width={200}
                        height={380}
                        className="drop-shadow-2xl scale-90"
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Interaction Buttons for Recipient */}
            <div className="mt-8 flex items-center space-x-4">
              {!isBoxOpen ? (
                <button
                  onClick={() => setIsBoxOpen(true)}
                  className="bg-red-500 hover:bg-red-600 text-white font-black px-8 py-3.5 rounded-full shadow-xl shadow-red-200 transition transform hover:scale-105 flex items-center space-x-2"
                >
                  <PartyPopper className="w-5 h-5" />
                  <span>상자 열어보기!</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsBoxOpen(false)}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-full shadow-lg transition text-sm flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>상자 다시 닫기</span>
                </button>
              )}

              <button
                onClick={() => {
                  window.location.hash = '';
                  setAppMode('DIY');
                  setIsBoxOpen(false);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-full border border-slate-200 transition text-sm flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>나도 만들기</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-400 border-t border-pink-100 bg-white/50">
        DIY Pepero & 360° Interactive Gift Box App • Built with React & HTML5 Canvas
      </footer>

    </div>
  );
}