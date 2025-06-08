import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { ChatModal } from '@/components/social/chat/ChatModal';
import { useMessages } from '@/hooks/useMessages';
import { Badge } from '@/components/ui/badge';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface FloatingChatSystemProps {
  isVisible: boolean;
  onToggle: () => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const FloatingChatSystem = ({ isVisible, onToggle }: FloatingChatSystemProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState({
    id: "",
    name: "",
    avatar: ""
  });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 20,
    currentY: 20
  });

  const { getTotalUnreadCount } = useMessages();
  const totalUnreadMessages = getTotalUnreadCount();

  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { userId, userName, userAvatar } = event.detail;
      setChatRecipient({
        id: userId,
        name: userName,
        avatar: userAvatar || ""
      });
      setIsChatOpen(true);
    };

    window.addEventListener('open-chat', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open-chat', handleOpenChat as EventListener);
    };
  }, []);

  const handleDragStart = (e: React.PointerEvent) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light });
    }
    
    setDragState({
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      currentX: position.x,
      currentY: position.y
    });
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragState.isDragging) return;

    const newX = e.clientX - dragState.startX;
    const newY = e.clientY - dragState.startY;

    // Keep within viewport bounds
    const maxX = window.innerWidth - 56; // button width
    const maxY = window.innerHeight - 56; // button height
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleDragEnd = () => {
    setDragState(prev => ({ ...prev, isDragging: false }));
    
    // Snap to edges
    const centerX = window.innerWidth / 2;
    const snapX = position.x < centerX ? 20 : window.innerWidth - 76;
    
    setPosition(prev => ({ ...prev, x: snapX }));
  };

  const handleChatToggle = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Medium });
    }
    onToggle();
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className="fixed z-50 transition-all duration-300 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: dragState.isDragging ? 'scale(1.1)' : 'scale(1)',
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
          onClick={handleChatToggle}
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnreadMessages > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs"
            >
              {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
            </Badge>
          )}
        </Button>
      </div>

      <ChatModal
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        recipientId={chatRecipient.id}
        recipientName={chatRecipient.name}
        recipientAvatar={chatRecipient.avatar}
      />
    </>
  );
};
