import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, Clock, Lock } from "lucide-react";

export const PendingApproval = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("pending");
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
            if (payload.new.status === "approved") {
              navigate("/");
              window.location.reload();
            }
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

    if (data) {
      setStatus(data.status);
      if (data.status === "approved") {
        navigate("/");
      }
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !adminPassword) return;

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { password: adminPassword, userId: user.id },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Access Granted",
          description: "Redirecting to dashboard...",
        });
        setTimeout(() => {
          navigate("/");
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Invalid Password",
        description: error.message || "The admin password you entered is incorrect",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
      setAdminPassword("");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (status === "approved") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
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
        </div>

        {/* Admin Password Bypass */}
        {status === "pending" && (
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Have an Admin Password?</h3>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Enter the admin password to gain immediate access
            </p>
            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!adminPassword || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify & Access"}
              </Button>
            </form>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Signed in as: {user?.email}
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};
