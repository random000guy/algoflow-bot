import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Check, X } from "lucide-react";
import { format } from "date-fns";

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
}

export const AdminApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingUsers();
    }
  }, [user]);

  const fetchPendingUsers = async () => {
    const { data } = await supabase
      .from("pending_users")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) setPendingUsers(data);
    setLoading(false);
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from("pending_users")
      .update({
        status: approve ? "approved" : "rejected",
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: approve ? "User Approved" : "User Rejected",
        description: `The user has been ${approve ? "approved" : "rejected"}`,
      });
      fetchPendingUsers();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pending User Approvals</h3>
      </div>

      {pendingUsers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No pending approvals</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.map((pendingUser) => (
              <TableRow key={pendingUser.id}>
                <TableCell>{pendingUser.email}</TableCell>
                <TableCell>{pendingUser.full_name || '-'}</TableCell>
                <TableCell>{format(new Date(pendingUser.created_at), "MM/dd/yyyy HH:mm")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproval(pendingUser.user_id, true)}
                      className="bg-bullish hover:bg-bullish/90"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleApproval(pendingUser.user_id, false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};
