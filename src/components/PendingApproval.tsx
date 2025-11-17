import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Clock } from "lucide-react";

export const PendingApproval = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    if (user) {
      checkApprovalStatus();
      
      // Subscribe to changes
      const subscription = supabase
        .channel("pending_users_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pending_users",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setStatus(payload.new.status);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const checkApprovalStatus = async () => {
    const { data } = await supabase
      .from("pending_users")
      .select("status")
      .eq("user_id", user?.id)
      .single();

    if (data) setStatus(data.status);
  };

  if (status === "approved") return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          {status === "pending" ? (
            <Clock className="h-16 w-16 text-primary animate-pulse" />
          ) : (
            <Shield className="h-16 w-16 text-destructive" />
          )}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {status === "pending" ? "Account Pending Approval" : "Account Rejected"}
          </h2>
          <p className="text-muted-foreground">
            {status === "pending"
              ? "Your account is waiting for admin approval. You'll be notified once approved."
              : "Your account request was rejected. Please contact support for more information."}
          </p>
        </div>

        {status === "pending" && (
          <div className="text-sm text-muted-foreground">
            This usually takes 24-48 hours
          </div>
        )}
      </Card>
    </div>
  );
};
