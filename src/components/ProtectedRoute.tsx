import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(true);

  useEffect(() => {
    if (user) {
      checkApprovalStatus();
    } else {
      setCheckingApproval(false);
    }
  }, [user]);

  const checkApprovalStatus = async () => {
    const { data } = await supabase
      .from("pending_users")
      .select("status")
      .eq("user_id", user?.id)
      .maybeSingle();

    setApprovalStatus(data?.status || null);
    setCheckingApproval(false);
  };

  if (loading || checkingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (approvalStatus === "pending" || approvalStatus === "rejected") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
};
