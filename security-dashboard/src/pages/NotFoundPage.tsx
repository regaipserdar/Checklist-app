// src/pages/NotFoundPage.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/"); // Ana sayfaya yönlendirir
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Button onClick={handleGoHome} className="px-4 py-2 text-lg bg-primary text-white rounded-lg">
        Go Home
      </Button>
    </div>
  );
};

export default NotFoundPage;
