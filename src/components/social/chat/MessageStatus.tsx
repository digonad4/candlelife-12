
import { Check, CheckCheck, Clock } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  className?: string;
}

export const MessageStatus = ({ status, className = "" }: MessageStatusProps) => {
  const getIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center ${className}`}>
      {getIcon()}
    </span>
  );
};
