
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  className?: string;
}

export const BackButton = ({ to = "/dashboard", className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-2 mb-4 ${className}`}
      onClick={handleBack}
    >
      <ArrowLeft size={16} />
      <span>Voltar</span>
    </Button>
  );
};
